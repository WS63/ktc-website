import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';

/**
 * Die Rollen: Administrator und Redaktion.
 *
 * Laeuft gegen einen eigenen Server mit eigener Datenbank. Wichtiger als alles,
 * was die Redaktion DARF, ist, was sie NICHT darf — und dass sich die Rolle nicht
 * faelschen laesst.
 */
const PORT = 3912;
const B = `http://localhost:${PORT}`;
const PW_ADMIN = 'test-admin-nur-hier';
const PW_RED = 'test-redaktion-nur-hier';
let server;

async function anmelden(passwort) {
  const r = await fetch(`${B}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ passwort }) });
  const keks = (r.headers.get('set-cookie') || '').split(';')[0];
  return { status: r.status, keks, daten: await r.json().catch(() => null) };
}
const api = async (keks, pfad, opt = {}) => {
  const r = await fetch(B + '/api' + pfad, { ...opt, headers: { cookie: keks,
    ...(typeof opt.body === 'string' ? { 'content-type': 'application/json' } : {}) } });
  return { status: r.status, daten: await r.json().catch(() => null) };
};

before(async () => {
  for (const s of ['', '-wal', '-shm']) rmSync(`data/test-redaktion.db${s}`, { force: true });
  // Die Seiten kommen aus dem Seed — wie auf dem echten Server.
  execFileSync('node', ['scripts/seed.js'], { stdio: 'ignore',
    env: { ...process.env, SQLITE_FILE: 'data/test-redaktion.db', DATABASE_URL: '' } });
  server = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(PORT), SQLITE_FILE: 'data/test-redaktion.db', DATABASE_URL: '',
      ADMIN_PASSWORT: PW_ADMIN, REDAKTION_PASSWORT: PW_RED, SESSION_GEHEIMNIS: 'test-geheimnis',
      ANTHROPIC_API_KEY: '', HTV_ABRUF: '' },
    stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${B}/health`)).ok) return; } catch { /* noch nicht da */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Testserver kam nicht hoch');
});
after(() => {
  server?.kill();
  for (const s of ['', '-wal', '-shm']) rmSync(`data/test-redaktion.db${s}`, { force: true });
});

test('jedes Passwort gibt seine Rolle, ein falsches gar keine', async () => {
  const a = await anmelden(PW_ADMIN), r = await anmelden(PW_RED), f = await anmelden('falsch');
  assert.equal(a.daten.rolle, 'admin');
  assert.equal(r.daten.rolle, 'redaktion');
  assert.equal(f.status, 401);
  assert.equal((await api(r.keks, '/ich')).daten.rolle, 'redaktion');
});

test('die Redaktion sieht nur Beitraege — und keine anderen Seiten', async () => {
  const red = (await anmelden(PW_RED)).keks, adm = (await anmelden(PW_ADMIN)).keks;
  const alle = (await api(adm, '/pages')).daten;
  const ihre = (await api(red, '/pages')).daten;
  assert.ok(alle.some((p) => p.page_type !== 'beitrag'));
  assert.ok(ihre.length > 0 && ihre.every((p) => p.page_type === 'beitrag'));
  const start = alle.find((p) => p.slug === 'start');
  assert.equal((await api(red, `/pages/${start.id}`)).status, 403);
  assert.equal((await api(red, `/pages/${start.id}`, { method: 'PUT', body: JSON.stringify({ title: 'Gehackt' }) })).status, 403);
  assert.equal((await api(adm, `/pages/${start.id}`)).status, 200);
});

test('die Redaktion kann Beitraege anlegen und aendern, aber keine anderen Seiten', async () => {
  const red = (await anmelden(PW_RED)).keks;
  assert.equal((await api(red, '/pages', { method: 'POST', body: JSON.stringify({ slug: 'x', page_type: 'standard', title: 'X' }) })).status, 403);
  const neu = await api(red, '/pages', { method: 'POST', body: JSON.stringify({ slug: 'probe-beitrag', page_type: 'beitrag', title: 'Probe' }) });
  assert.equal(neu.status, 200);
  const put = await api(red, `/pages/${neu.daten.id}`, { method: 'PUT', body: JSON.stringify({ title: 'Geaendert', art: 'club' }) });
  assert.equal(put.status, 200);
  assert.equal((await api(red, `/pages/${neu.daten.id}`)).daten.art, 'club');
});

test('alles andere ist der Redaktion verschlossen: Navigation, Fakten, Anfragen, Loeschen, Generator', async () => {
  const red = (await anmelden(PW_RED)).keks, adm = (await anmelden(PW_ADMIN)).keks;
  const start = (await api(adm, '/pages')).daten.find((p) => p.slug === 'start');
  for (const [pfad, opt] of [
    ['/navigation', {}], ['/config/facts', {}], ['/config/facts', { method: 'PUT', body: '{}' }],
    ['/submissions', {}], ['/redirects', {}], ['/generator', {}], ['/assistent', {}], ['/aufrufe', {}],
    [`/pages/${start.id}`, { method: 'DELETE' }],
  ]) {
    assert.equal((await api(red, pfad, opt)).status, 403, `${opt.method || 'GET'} ${pfad} haette gesperrt sein muessen`);
  }
  assert.equal((await api(adm, '/navigation')).status, 200);
});

test('die Rolle laesst sich nicht faelschen', async () => {
  const red = (await anmelden(PW_RED)).keks;                       // ktc_sitzung=BIS.redaktion.SIGNATUR
  const [name, wert] = [red.split('=')[0], red.split('=').slice(1).join('=')];
  const [bis, , sig] = decodeURIComponent(wert).split('.');
  const gefaelscht = `${name}=${bis}.admin.${sig}`;
  assert.equal((await api(gefaelscht, '/ich')).daten.angemeldet, false);
  assert.equal((await api(gefaelscht, '/navigation')).status, 401);
  assert.equal((await api('', '/pages')).status, 401);
});

test('die Redaktion erreicht den Ergebnisdienst: Status, Wochenenden, Ansicht, WhatsApp-Text', async () => {
  const red = (await anmelden(PW_RED)).keks;
  const status = (await api(red, '/redaktion/status')).daten;
  assert.ok(status.anzahl > 0);
  assert.equal(status.zeitplan, false);
  const wochen = (await api(red, '/redaktion/wochenenden')).daten;
  assert.ok(wochen.length > 5);
  const mai = wochen.find((w) => w.we === '2026-05-08');
  assert.equal(mai.begegnungen, 26);
  const ans = (await api(red, '/redaktion/ansicht?we=2026-05-08')).daten;
  assert.equal(ans.bilanz.begegnungen, 26);

  const wa = (await api(red, '/redaktion/whatsapp?we=2026-05-08&format=whatsapp')).daten;
  assert.match(wa.text, /^🎾 \*KTC-Spieltag · 8\. bis 10\. Mai 2026\*/);
  assert.match(wa.text, /11 Siege · 6 Remis · 9 Niederlagen/);
  assert.match(wa.text, /🟢 Herren 50 – TC Martinsee Heusenst\.  \*5:4\*/);
  assert.match(wa.wa, /^https:\/\/wa\.me\/\?text=/);
  const roh = (await api(red, '/redaktion/whatsapp?we=2026-05-08&format=text')).daten;
  assert.doesNotMatch(roh.text, /\*/);                              // ohne jede Auszeichnung
  assert.equal((await api(red, '/redaktion/whatsapp?we=1999-01-01')).status, 404);
});

test('ohne Schluessel meldet der Berichts-Knopf das, statt etwas zu erfinden', async () => {
  const red = (await anmelden(PW_RED)).keks;
  const r = await api(red, '/redaktion/bericht', { method: 'POST', body: JSON.stringify({ we: '2026-05-08' }) });
  assert.equal(r.status, 503);
  assert.match(r.daten.fehler, /nicht eingerichtet/);
});

test('das Redaktions-Passwort gilt unter beiden Variablennamen: PASSWORD und der alte PASSWORT', () => {
  const probe = (name) => {
    const code = `
      import { anmelden } from './src/auth.js';
      const mit = (pw) => { let r; anmelden({ body: { passwort: pw } },
        { status: () => ({ json: (d) => { r = d.rolle || 'abgelehnt'; } }), setHeader() {}, json: (d) => { r = d.rolle; } });
        return r; };
      console.log(JSON.stringify([mit('red-geheim'), mit('admin-geheim'), mit('falsch')]));`;
    const env = { ...process.env, ADMIN_PASSWORT: 'admin-geheim', REDAKTION_PASSWORD: '', REDAKTION_PASSWORT: '', [name]: 'red-geheim' };
    return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code], { env, encoding: 'utf8' }).trim().split('\n').pop());
  };
  assert.deepEqual(probe('REDAKTION_PASSWORD'), ['redaktion', 'admin', 'abgelehnt']);
  assert.deepEqual(probe('REDAKTION_PASSWORT'), ['redaktion', 'admin', 'abgelehnt']);
});
