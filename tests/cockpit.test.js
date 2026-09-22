import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

/**
 * Der Pruefstein aus Stufe 3, als Test.
 *
 * Laeuft gegen einen eigenen Server mit eigener Datenbank, damit er die
 * echte Seite nicht anfasst.
 */
const PORT = 3911;
const B = `http://localhost:${PORT}`;
const PW = 'test-passwort-nur-hier';
let server, keks = '';

async function api(pfad, opt = {}) {
  const r = await fetch(B + pfad, {
    redirect: 'manual',
    ...opt,
    headers: {
      ...(typeof opt.body === 'string' ? { 'content-type': 'application/json' } : {}),
      cookie: keks, ...(opt.headers || {}),
    },
  });
  const sc = r.headers.get('set-cookie');
  if (sc) keks = sc.split(';')[0];
  let daten = null;
  try { daten = await r.json(); } catch { /* HTML oder leer */ }
  return { status: r.status, daten, ort: r.headers.get('location') };
}

before(async () => {
  const { rmSync } = await import('node:fs');
  rmSync('data/test.db', { force: true });
  rmSync('data/test.db-wal', { force: true });
  rmSync('data/test.db-shm', { force: true });
  server = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: String(PORT), SQLITE_FILE: 'data/test.db',
           ADMIN_PASSWORT: PW, SESSION_GEHEIMNIS: 'test-geheimnis' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${B}/health`)).ok) return; } catch { /* noch nicht da */ }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error('Testserver ist nicht hochgekommen');
});

after(() => server?.kill());

test('Ohne Anmeldung kommt niemand an die Daten', async () => {
  keks = '';
  for (const pfad of ['/api/pages', '/api/navigation', '/api/media',
                      '/api/submissions', '/api/config/facts', '/api/schema']) {
    const r = await api(pfad);
    assert.equal(r.status, 401, `${pfad} war offen!`);
  }
  // Schreibend erst recht nicht
  const r = await api('/api/pages', { method: 'POST',
    body: JSON.stringify({ slug: 'einbruch', page_type: 'standard' }) });
  assert.equal(r.status, 401);
});

test('Die Oberflaeche des Cockpits ist erreichbar — sonst sperrt sie sich selbst aus', async () => {
  for (const pfad of ['/admin/', '/admin/app.js', '/admin/handbuch.js']) {
    const r = await fetch(B + pfad);
    assert.equal(r.status, 200, `${pfad} war gesperrt — das Cockpit kann sich nicht laden.`);
  }
});

test('Falsches Passwort kommt nicht durch', async () => {
  const r = await api('/api/login', { method: 'POST', body: JSON.stringify({ passwort: 'falsch' }) });
  assert.equal(r.status, 401);
});

test('Anmeldung', async () => {
  const r = await api('/api/login', { method: 'POST', body: JSON.stringify({ passwort: PW }) });
  assert.equal(r.status, 200);
  assert.ok(keks.length > 10, 'kein Sitzungs-Cookie');
});

test('Pruefstein 1 · eine Seite anlegen — mit Pflichtbausteinen und als Entwurf', async () => {
  const r = await api('/api/pages', { method: 'POST',
    body: JSON.stringify({ slug: 'probe', page_type: 'standard', title: 'Probe' }) });
  assert.equal(r.status, 200);
  const s = await api(`/api/pages/${r.daten.id}`);
  assert.equal(s.daten.status, 'draft', 'neue Seiten muessen Entwuerfe sein');
  assert.deepEqual(s.daten.content_json.blocks.map((b) => b.type), ['nav', 'footer']);
  assert.equal((await fetch(`${B}/probe/`)).status, 404, 'ein Entwurf war oeffentlich sichtbar');
});

test('Pruefstein 4 · veroeffentlichen macht sie oeffentlich', async () => {
  const id = (await api('/api/pages')).daten.find((p) => p.slug === 'probe').id;
  const s = (await api(`/api/pages/${id}`)).daten;
  s.content_json.blocks.splice(1, 0, { type: 'hero', data: { titel: 'Probe' } });
  const r = await api(`/api/pages/${id}`, { method: 'PUT',
    body: JSON.stringify({ ...s, status: 'published' }) });
  assert.equal(r.status, 200);
  assert.equal((await fetch(`${B}/probe/`)).status, 200);
});

test('Pruefstein 5 · umbenennen legt die 301 von allein an', async () => {
  const id = (await api('/api/pages')).daten.find((p) => p.slug === 'probe').id;
  await api(`/api/pages/${id}`, { method: 'PUT', body: JSON.stringify({ slug: 'probe-neu' }) });
  const r = await fetch(`${B}/probe/`, { redirect: 'manual' });
  assert.equal(r.status, 301, 'keine Umleitung nach dem Umbenennen');
  assert.equal(r.headers.get('location'), '/probe-neu/');
});

test('Pruefstein 2 · ins Menue haengen, und es steht auf der Website', async () => {
  const r = await api('/api/navigation', { method: 'PUT', body: JSON.stringify({ punkte: [
    { ort: 'kopf', label: 'Probe', href: '/probe-neu/', visible: true }] }) });
  assert.equal(r.status, 200);
  const html = await (await fetch(`${B}/probe-neu/`)).text();
  assert.match(html, />Probe</);
});

test('Ein Menuepunkt ins Leere wird gemeldet, nicht verschwiegen', async () => {
  await api('/api/navigation', { method: 'PUT', body: JSON.stringify({ punkte: [
    { ort: 'kopf', label: 'Probe', href: '/probe-neu/', visible: true },
    { ort: 'kopf', label: 'Gibt es nicht', href: '/gibtsnicht/', visible: true }] }) });
  const r = await api('/api/navigation/pruefung');
  assert.equal(r.daten.warnungen.length, 1);
  assert.match(r.daten.warnungen[0].label, /Gibt es nicht/);
});

test('Pruefstein 3 · Bild hochladen, Alt-Text, Loeschschutz', async () => {
  const bild = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64');
  let r = await api('/api/media?name=Test%20Bild.png', { method: 'POST', body: bild });
  assert.equal(r.status, 200);
  assert.match(r.daten.file_path, /^\/uploads\/test-bild-[0-9a-f]{8}\.png$/,
    'Dateiname ohne Inhalts-Hash — der Browser-Cache zeigt sonst das alte Bild');
  const m = r.daten;

  // Fremde Dateitypen bleiben draussen
  r = await api('/api/media?name=schadcode.js', { method: 'POST', body: Buffer.from('alert(1)') });
  assert.equal(r.status, 400);

  // Gleiches Bild zweimal: kein Doppel
  r = await api('/api/media?name=Test%20Bild.png', { method: 'POST', body: bild });
  assert.equal(r.daten.file_path, m.file_path);

  // Einsetzen
  const id = (await api('/api/pages')).daten.find((p) => p.slug === 'probe-neu').id;
  const s = (await api(`/api/pages/${id}`)).daten;
  s.content_json.blocks.push({ type: 'bild', data: { pfad: m.file_path, alt: 'Ein Testbild' } });
  r = await api(`/api/pages/${id}`, { method: 'PUT', body: JSON.stringify(s) });
  assert.equal(r.status, 200, r.daten?.fehler);

  // Benutzte Bilder lassen sich nicht loeschen
  r = await api(`/api/media/${m.id}`, { method: 'DELETE' });
  assert.equal(r.status, 409);
  assert.match(r.daten.fehler, /probe-neu/);
});

test('Pruefstein 8 · einen Preis aendern, ohne etwas zu deployen', async () => {
  let r = await api('/api/config/facts', { method: 'PUT',
    body: JSON.stringify({ override: { beitraege: { aktiv: '999' } } }) });
  assert.equal(r.status, 200);

  const id = (await api('/api/pages')).daten.find((p) => p.slug === 'probe-neu').id;
  const s = (await api(`/api/pages/${id}`)).daten;
  s.content_json.blocks.push({ type: 'richtext', data: {
    absaetze: ['Beitrag: {{facts.beitraege.aktiv}} Euro, Jugend: {{facts.beitraege.jugend}} Euro'] } });
  await api(`/api/pages/${id}`, { method: 'PUT', body: JSON.stringify(s) });

  const html = await (await fetch(`${B}/probe-neu/`)).text();
  assert.match(html, /999 Euro/, 'der geaenderte Wert erscheint nicht');
  // Tiefes Zusammenfuehren: der Override darf nicht den ganzen Ast verdecken
  assert.match(html, /135 Euro/,
    'der Override hat den ganzen Ast ueberschattet — genau die Falle aus 3.8');
});

test('Pruefstein 7 · eine Anfrage kommt an, der Bot nicht', async () => {
  let r = await fetch(`${B}/api/form/probe`, { method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Mensch', nachricht: 'Hallo' }) });
  assert.equal(r.status, 200);

  // Honigtopf: Bots fuellen ihn aus, Menschen nicht
  await fetch(`${B}/api/form/probe`, { method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ website: 'bot.example', name: 'Bot' }) });

  const offen = await api('/api/submissions/offen');
  assert.equal(offen.daten.offen, 1, 'der Honigtopf hat nicht gegriffen');

  const liste = await api('/api/submissions');
  assert.equal(liste.daten[0].daten.name, 'Mensch');
});

test('Eine echte Seite schlaegt eine alte Umleitung', async () => {
  // Umleitung anlegen, die auf eine Adresse zeigt, die es noch nicht gibt
  await api('/api/redirects', { method: 'POST',
    body: JSON.stringify({ from_path: '/kollision/', to_path: '/' }) });
  assert.equal((await fetch(`${B}/kollision/`, { redirect: 'manual' })).status, 301);

  // Jetzt eine echte Seite unter derselben Adresse
  const r = await api('/api/pages', { method: 'POST',
    body: JSON.stringify({ slug: 'kollision', page_type: 'standard', title: 'Kollision' }) });
  const s = (await api(`/api/pages/${r.daten.id}`)).daten;
  await api(`/api/pages/${r.daten.id}`, { method: 'PUT',
    body: JSON.stringify({ ...s, status: 'published' }) });

  assert.equal((await fetch(`${B}/kollision/`, { redirect: 'manual' })).status, 200,
    'eine alte Umleitung hat eine echte Seite ueberschattet');
  const liste = await api('/api/redirects');
  assert.equal(liste.daten.find((x) => x.from_path === '/kollision/').ueberschattet, true,
    'das Cockpit meldet die tote Umleitung nicht');
});

test('Pruefstein 6 · loeschen verlangt ein Ziel und legt die Umleitung an', async () => {
  const id = (await api('/api/pages')).daten.find((p) => p.slug === 'probe-neu').id;
  let r = await api(`/api/pages/${id}`, { method: 'DELETE' });
  assert.equal(r.status, 400, 'eine oeffentliche Seite liess sich ohne Ziel loeschen');
  assert.equal(r.daten.brauchtZiel, true);

  r = await api(`/api/pages/${id}?ziel=%2F`, { method: 'DELETE' });
  assert.equal(r.status, 200);

  const w = await fetch(`${B}/probe-neu/`, { redirect: 'manual' });
  assert.equal(w.status, 301);
  assert.equal(w.headers.get('location'), '/');

  // Der Menuepunkt zeigt nicht mehr ins Leere
  const nav = await api('/api/navigation');
  assert.ok(!nav.daten.some((p) => p.href === '/probe-neu/' && p.visible),
    'ein Menuepunkt zeigt noch auf die geloeschte Seite');
});

test('sitemap.xml und robots.txt laufen mit', async () => {
  const { readFileSync } = await import('node:fs');
  const site = JSON.parse(readFileSync('config/site.json', 'utf8'));

  const robots = await fetch(`${B}/robots.txt`);
  assert.equal(robots.status, 200);
  const txt = await robots.text();

  if (site.suchmaschinen === false) {
    // Testdomain: robots.txt sperrt alles, und es gibt keine Sitemap.
    assert.match(txt, /Disallow: \//);
    assert.equal((await fetch(`${B}/sitemap.xml`)).status, 404);
    return;
  }

  assert.match(txt, /Sitemap:/);
  const sm = await fetch(`${B}/sitemap.xml`);
  assert.equal(sm.status, 200);
  const xml = await sm.text();
  assert.match(xml, /<urlset/);
  assert.ok(!xml.includes('/probe/'), 'eine geloeschte Seite steht in der Sitemap');
});
