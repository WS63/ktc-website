import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { nachzutragen } from '../src/vereinstermine.js';

const ARTEN = ['spiel', 'jugend', 'club', 'info'];
const HEUTE = '2026-11-10';

test('Nachtragen: nur Fehlendes aus der Zukunft, nie Beispiele, nie Vergangenes, nie Doppeltes', () => {
  const datei = [
    { datum: '2027-02-15', art: 'info', titel: 'Einzug' },
    { datum: '2027-03-16', art: 'info', titel: 'Mitgliederversammlung' },
    { datum: '2027-06-12', art: 'info', titel: 'Tag der offenen Tür', beispiel: true },
    { datum: '2026-03-16', art: 'info', titel: 'Alt' },
    { datum: '2027-02-15', art: 'info', titel: 'einzug ' },                    // dasselbe noch einmal in der Datei
  ];
  const bestand = [{ datum: '2027-03-16', art: 'club', titel: 'Mitgliederversammlung ' }];   // schon da (Art egal)
  const r = nachzutragen(datei, bestand, ARTEN, HEUTE);
  assert.deepEqual(r.neu.map((t) => t.titel), ['Einzug']);
  assert.deepEqual(r.uebersprungen.map((u) => u.grund),
    ['schon vorhanden', 'Beispiel', 'vergangen', 'schon vorhanden']);
  assert.deepEqual(r.fehler, []);
});

test('Nachtragen: ein mehrtägiger Termin gilt bis zu seinem letzten Tag', () => {
  const lang = { datum: '2026-11-08', bis: '2026-11-12', art: 'club', titel: 'Camp' };
  assert.deepEqual(nachzutragen([lang], [], ARTEN, HEUTE).neu.map((t) => t.titel), ['Camp']);
});

test('Nachtragen: was die Prüfung nicht besteht, wird gemeldet und nicht geschrieben', () => {
  const r = nachzutragen([{ datum: '2027-02-30', art: 'info', titel: 'X' }, { datum: '2027-05-01', art: 'gibts-nicht', titel: 'Y' },
    { datum: '2027-05-02', art: 'club', titel: 'Z', mehr: 'javascript:alert(1)' }, null], [], ARTEN, HEUTE);
  assert.equal(r.neu.length, 0);
  assert.equal(r.fehler.length, 4);
});

// ── das Skript selbst, gegen eine Wegwerf-Datenbank ─────────────────────
const VERZ = 'data/test-nachtragen';
const DB = `${VERZ}/site.db`;
const DATEI = `${VERZ}/termine.json`;
const lauf = (...args) => execFileSync('node', ['scripts/termine-nachtragen.js', ...args], {
  env: { ...process.env, SQLITE_FILE: DB, DATABASE_URL: '' }, encoding: 'utf8' });
const zeilen = () => { const d = new DatabaseSync(DB, { readOnly: true });
  try { return d.prepare('SELECT datum, titel, beispiel FROM vereinstermine ORDER BY datum').all(); } finally { d.close(); } };

before(() => {
  rmSync(VERZ, { recursive: true, force: true });
  mkdirSync(VERZ, { recursive: true });
  writeFileSync(DATEI, JSON.stringify({ termine: [
    { datum: '2099-01-31', art: 'info', titel: 'Frist', text: 'Bis zu diesem Tag.' },
    { datum: '2099-02-15', art: 'club', titel: 'Fest', uhrzeit: '14:00', ort: 'Clubhaus' },
    { datum: '2099-03-01', art: 'club', titel: 'Probe', beispiel: true },
    { datum: '2000-01-01', art: 'club', titel: 'Uralt' },
  ] }));
});
after(() => rmSync(VERZ, { recursive: true, force: true }));

test('Skript: trocken schreibt nichts, danach trägt es ein, ein zweiter Lauf findet nichts mehr', () => {
  const trocken = lauf('--trocken', DATEI);
  assert.match(trocken, /würde eintragen\s+2099-01-31\s+Frist/);
  assert.match(trocken, /Trocken gelaufen/);
  assert.equal(zeilen().length, 0, 'trocken hat nichts geschrieben');

  const echt = lauf(DATEI);
  assert.match(echt, /eingetragen\s+2099-02-15\s+Fest/);
  assert.match(echt, /übersprungen \(Beispiel\)/);
  assert.match(echt, /übersprungen \(vergangen\)/);
  assert.match(echt, /Anwendung neu starten/);
  assert.deepEqual(zeilen().map((z) => z.titel), ['Frist', 'Fest']);

  assert.match(lauf(DATEI), /Nichts nachzutragen/);
  assert.equal(zeilen().length, 2, 'ein zweiter Lauf verdoppelt nichts');
});

test('Skript: ein im Cockpit geänderter Termin wird nicht überschrieben, eine fehlende Datei ist ein klarer Fehler', () => {
  const d = new DatabaseSync(DB);
  d.prepare("UPDATE vereinstermine SET beschreibung = 'im Cockpit geändert' WHERE titel = 'Frist'").run();
  d.close();
  lauf(DATEI);
  const e = new DatabaseSync(DB, { readOnly: true });
  assert.equal(e.prepare("SELECT beschreibung FROM vereinstermine WHERE titel = 'Frist'").get().beschreibung, 'im Cockpit geändert');
  e.close();
  assert.throws(() => execFileSync('node', ['scripts/termine-nachtragen.js', `${VERZ}/gibts-nicht.json`],
    { env: { ...process.env, SQLITE_FILE: DB, DATABASE_URL: '' }, stdio: 'pipe' }), /Command failed/);
});
