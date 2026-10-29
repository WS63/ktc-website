import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { rmSync, readFileSync } from 'node:fs';
import { pruefe } from '../src/vereinstermine.js';

/**
 * Vereinstermine im Cockpit: die Regeln als reine Funktion, dann der ganze Weg (Cockpit → Datenbank → Kalender,
 * Startseite, Kalender-Abo) gegen einen eigenen Server mit eigener Datenbank.
 */
const ARTEN = ['spiel', 'jugend', 'club', 'info'];

test('pruefe: ein gültiger Termin wird bereinigt, ein ungültiger nennt jeden Fehler', () => {
  const ok = pruefe({ titel: '  Mitgliederversammlung ', datum: '2027-03-12', uhrzeit: '19:00', ende: '21:30', art: 'club',
    ort: 'Clubhaus', text: 'Einladung folgt.', mehr: '/aktuelles/versammlung/' }, ARTEN);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.termin, { datum: '2027-03-12', art: 'club', titel: 'Mitgliederversammlung', uhrzeit: '19:00', ende: '21:30',
    text: 'Einladung folgt.', ort: 'Clubhaus', mehr: '/aktuelles/versammlung/', mehrLabel: 'Mehr erfahren' });
  const schlecht = pruefe({ titel: '', datum: '2027-02-30', uhrzeit: '25:00', bis: '2027-01-01', art: 'gibt-es-nicht', mehr: 'javascript:alert(1)' }, ARTEN);
  assert.equal(schlecht.ok, false);
  assert.ok(schlecht.fehler.length >= 5, schlecht.fehler.join(' | '));
});

test('pruefe: Links nur zur eigenen Website oder https; Ende braucht Beginn; Beispiel nur auf ausdrücklichen Wunsch', () => {
  for (const mehr of ['//fremde-seite.de/x', 'http://unsicher.de', 'data:text/html,x', 'ftp://x']) {
    assert.equal(pruefe({ titel: 'T', datum: '2027-01-01', mehr }, ARTEN).ok, false, mehr);
  }
  assert.equal(pruefe({ titel: 'T', datum: '2027-01-01', mehr: 'https://ebusy.de/x' }, ARTEN).ok, true);
  assert.equal(pruefe({ titel: 'T', datum: '2027-01-01', ende: '16:00' }, ARTEN).ok, false, 'Ende ohne Beginn');
  assert.equal(pruefe({ titel: 'T', datum: '2027-01-01', uhrzeit: '16:00', ende: '15:00' }, ARTEN).ok, false, 'Ende vor Beginn');
  assert.equal(pruefe({ titel: 'T', datum: '2027-07-05', bis: '2027-07-09', uhrzeit: '10:00', ende: '12:00' }, ARTEN).ok, true, 'Camp: täglich 10 bis 12');
  assert.equal(pruefe({ titel: 'T', datum: '2027-01-01' }, ARTEN).termin.beispiel, undefined);
  assert.equal(pruefe({ titel: 'T', datum: '2027-01-01', beispiel: true }, ARTEN).termin.beispiel, true);
  assert.equal(pruefe({ titel: 'T', datum: '2027-01-01', bis: '2027-01-01' }, ARTEN).termin.bis, undefined, 'ein Tag ist kein mehrtägiger Termin');
});

const PORT = 3914;
const B = `http://localhost:${PORT}`;
const DB = 'data/test-termine.db';
const PW_ADMIN = 'test-admin-termine', PW_RED = 'test-redaktion-termine';
let server;

const weg = () => { for (const s of ['', '-wal', '-shm']) rmSync(`${DB}${s}`, { force: true }); };
async function anmelden(passwort) {
  const r = await fetch(`${B}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ passwort }) });
  return (r.headers.get('set-cookie') || '').split(';')[0];
}
const api = async (keks, pfad, opt = {}) => {
  const r = await fetch(B + pfad, { ...opt, headers: { cookie: keks, ...(typeof opt.body === 'string' ? { 'content-type': 'application/json' } : {}) } });
  let daten = null; try { daten = await r.json(); } catch { /* leer */ }
  return { status: r.status, daten };
};

before(async () => {
  weg();
  execFileSync('node', ['scripts/seed.js'], { stdio: 'ignore', env: { ...process.env, SQLITE_FILE: DB, DATABASE_URL: '' } });
  server = spawn('node', ['server.js'], { stdio: 'ignore',
    env: { ...process.env, PORT: String(PORT), SQLITE_FILE: DB, DATABASE_URL: '', ADMIN_PASSWORT: PW_ADMIN,
      REDAKTION_PASSWORD: PW_RED, SESSION_GEHEIMNIS: 'test-geheimnis-termine', ANTHROPIC_API_KEY: '', HTV_ABRUF: '',
      USER_NAME: '', USER_PASSWORD: '', SPIELPLAN_DEMO: '' } });
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`${B}/health`)).ok) return; } catch { /* noch nicht da */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Testserver kam nicht hoch');
});
after(() => { server?.kill(); weg(); });

test('beim ersten Start kommen die Termine aus der Datei in die Datenbank, auch die Beispiele (mit Vermerk)', async () => {
  const adm = await anmelden(PW_ADMIN);
  const { status, daten } = await api(adm, '/api/termine');
  assert.equal(status, 200);
  const aus = JSON.parse(readFileSync('inhalte/termine.json', 'utf8')).termine;
  assert.equal(daten.length, aus.length);
  assert.equal(daten.filter((t) => t.beispiel).length, aus.filter((t) => t.beispiel).length);
  assert.ok(daten.every((t) => t.id && t.datum && t.titel));
});

test('anlegen, ändern, löschen: Kalender, Startseite und Abo zeigen es sofort, Ungültiges wird abgewiesen', async () => {
  const adm = await anmelden(PW_ADMIN);
  const neu = await api(adm, '/api/termine', { method: 'POST', body: JSON.stringify({
    titel: 'Mitgliederversammlung 2027', datum: '2027-03-12', uhrzeit: '19:00', ende: '21:30', art: 'club', ort: 'Clubhaus', text: 'Einladung folgt.' }) });
  assert.equal(neu.status, 200);
  const html = await (await fetch(`${B}/kalender/`)).text();
  assert.match(html, /Mitgliederversammlung 2027/);
  const ics = await (await fetch(`${B}/kalender/club.ics`)).text();
  assert.match(ics, /Mitgliederversammlung 2027/);
  assert.match(ics, /DTSTART;TZID=Europe\/Berlin:20270312T190000/);
  // Ändern: neuer Titel, und die alte Fassung ist weg.
  const aendern = await api(adm, `/api/termine/${neu.daten.id}`, { method: 'PUT', body: JSON.stringify({
    titel: 'Mitgliederversammlung (verschoben)', datum: '2027-03-19', uhrzeit: '19:00', art: 'club' }) });
  assert.equal(aendern.status, 200);
  const nachher = await (await fetch(`${B}/kalender/`)).text();
  assert.match(nachher, /Mitgliederversammlung \(verschoben\)/);
  assert.doesNotMatch(nachher, /Mitgliederversammlung 2027/);
  // Ungültig: 400 mit Klartext, nichts gespeichert.
  const schlecht = await api(adm, '/api/termine', { method: 'POST', body: JSON.stringify({ titel: 'X', datum: '12.03.2027', mehr: 'javascript:x' }) });
  assert.equal(schlecht.status, 400);
  assert.match(schlecht.daten.fehler, /Datum/);
  // Löschen
  assert.equal((await api(adm, `/api/termine/${neu.daten.id}`, { method: 'DELETE' })).status, 200);
  assert.doesNotMatch(await (await fetch(`${B}/kalender/`)).text(), /Mitgliederversammlung \(verschoben\)/);
  assert.equal((await api(adm, `/api/termine/${neu.daten.id}`, { method: 'DELETE' })).status, 404);
});

test('ein gelöschter Beispieltermin kommt beim Neustart nicht zurück, und die Redaktion darf Termine pflegen, aber sonst nichts', async () => {
  const adm = await anmelden(PW_ADMIN), red = await anmelden(PW_RED);
  const liste = (await api(adm, '/api/termine')).daten;
  const beispiel = liste.find((t) => t.beispiel);
  assert.ok(beispiel, 'die Datei enthält noch Beispieltermine');
  assert.equal((await api(red, `/api/termine/${beispiel.id}`, { method: 'DELETE' })).status, 200, 'die Redaktion darf löschen');
  assert.equal((await api(red, '/api/termine', { method: 'POST', body: JSON.stringify({ titel: 'Fest', datum: '2027-06-19', art: 'club' }) })).status, 200);
  assert.equal((await api(red, '/api/redirects')).status, 403, 'aber keine Umleitungen');
  assert.equal((await fetch(`${B}/api/termine`)).status, 401, 'ohne Anmeldung gar nichts');
  // Neustart: dieselbe Datenbank, die Marke verhindert, dass die Datei die gelöschten wieder einspielt.
  server.kill();
  await new Promise((r) => setTimeout(r, 600));
  server = spawn('node', ['server.js'], { stdio: 'ignore',
    env: { ...process.env, PORT: String(PORT), SQLITE_FILE: DB, DATABASE_URL: '', ADMIN_PASSWORT: PW_ADMIN,
      REDAKTION_PASSWORD: PW_RED, SESSION_GEHEIMNIS: 'test-geheimnis-termine', ANTHROPIC_API_KEY: '', HTV_ABRUF: '',
      USER_NAME: '', USER_PASSWORD: '', SPIELPLAN_DEMO: '' } });
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`${B}/health`)).ok) break; } catch { /* noch nicht da */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  const adm2 = await anmelden(PW_ADMIN);
  const danach = (await api(adm2, '/api/termine')).daten;
  assert.ok(!danach.some((t) => t.id === beispiel.id || (t.titel === beispiel.titel && t.beispiel)), 'der gelöschte Beispieltermin ist weg');
  assert.ok(danach.some((t) => t.titel === 'Fest'), 'der neue Termin ist noch da');
});
