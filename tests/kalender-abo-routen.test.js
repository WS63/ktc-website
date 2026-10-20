import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

/**
 * Das Kalender-Abo gegen einen echten Server mit eigener Datenbank. Der Spielstand
 * kommt dort beim ersten Start aus inhalte/spielplan/ (Saison 2026), die Mannschaften
 * aus inhalte/mannschaften/.
 */
const PORT = 3913;   // 3912 gehört redaktion.test.js — derselbe Port ließ beide je nach Zeitablauf rot werden
const B = `http://localhost:${PORT}`;
const DB = 'data/test-abo.db';
let server;

const hole = (pfad) => fetch(B + pfad, { redirect: 'manual' });

before(async () => {
  const { rmSync } = await import('node:fs');
  for (const e of ['', '-wal', '-shm']) rmSync(`${DB}${e}`, { force: true });
  server = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(PORT), SQLITE_FILE: DB, DATABASE_URL: '',
           USER_NAME: '', USER_PASSWORD: '', SPIELPLAN_DEMO: '' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${B}/health`)).ok) return; } catch { /* noch nicht da */ }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error('Testserver startet nicht');
});

after(async () => {
  server?.kill();
  const { rmSync } = await import('node:fs');
  for (const e of ['', '-wal', '-shm']) rmSync(`${DB}${e}`, { force: true });
});

test('Erwachsene: eine Adresse ueber die Jahre', async () => {
  const r = await hole('/kalender/abo/herren-40/');
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), `webcal://localhost:${PORT}/kalender/mannschaft/herren-40.ics`);
  const f = await hole('/kalender/mannschaft/herren-40.ics');
  assert.equal(f.status, 200);
  assert.match(await f.text(), /X-WR-CALNAME:KTC · Herren 40\r\n/);
});

test('Jugend: das Abo fuehrt in die laufende Saison und bleibt dort', async () => {
  const r = await hole('/kalender/abo/junioren-u15-ii/');
  assert.equal(r.headers.get('location'), `webcal://localhost:${PORT}/kalender/mannschaft/2026/junioren-u15-ii.ics`);
  const f = await hole('/kalender/mannschaft/2026/junioren-u15-ii.ics');
  assert.equal(f.status, 200);
  assert.match(await f.text(), /X-WR-CALNAME:KTC · Junioren U15 II · 2026/);
  assert.equal((await hole('/kalender/mannschaft/2019/junioren-u15-ii.ics')).status, 404,
    'eine Saison ohne Spiele ist eine falsche Adresse');
});

test('Formular: Mannschaft und Weg, ohne Auswahl zurueck zum Abschnitt', async () => {
  const g = await hole('/kalender/abo/?mannschaft=junioren-u15-ii&weg=google');
  assert.equal(g.status, 302);
  assert.equal(g.headers.get('location'), 'https://calendar.google.com/calendar/render?cid='
    + encodeURIComponent(`webcal://localhost:${PORT}/kalender/mannschaft/2026/junioren-u15-ii.ics`));
  const a = await hole('/kalender/abo/?mannschaft=damen&weg=apple');
  assert.equal(a.headers.get('location'), `webcal://localhost:${PORT}/kalender/mannschaft/damen.ics`);
  const leer = await hole('/kalender/abo/');
  assert.equal(leer.headers.get('location'), '/kalender/#abo');
});

test('Unbekannte Mannschaft: 404, kein Kalender aus dem Nichts', async () => {
  assert.equal((await hole('/kalender/abo/gibts-nicht/')).status, 404);
  assert.equal((await hole('/kalender/abo/?mannschaft=gibts-nicht&weg=apple')).status, 404);
  assert.equal((await hole('/kalender/mannschaft/gibts-nicht.ics')).status, 404);
});

test('Die festen Abos und ihr Format', async () => {
  for (const feed of ['club', 'heimspiele']) {
    const f = await hole(`/kalender/${feed}.ics`);
    assert.equal(f.status, 200);
    assert.match(f.headers.get('content-type'), /^text\/calendar/);
  }
});
