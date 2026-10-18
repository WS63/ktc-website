import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { renderPage } from '../src/renderer.js';
import { seiten } from '../src/seiten.js';
import { inhaltsrichtlinie, sicherheitsKoepfe } from '../src/sicherheit.js';
import { bremseFuer } from '../src/bremse.js';

const mitSchluessel = (fn) => {
  const alt = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'nur-fuer-den-test';
  try { return fn(); } finally { if (alt === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = alt; }
};
const alsSeite = (s) => ({ slug: s.slug, page_type: s.page_type, status: 'published',
  title: s.title, description: s.description, content_json: { blocks: s.blocks } });
const seite = (blocks) => ({ slug: 't', page_type: 'standard', status: 'published', title: 'T',
  content_json: { blocks } });
const hashVon = (t) => `'sha256-${createHash('sha256').update(t, 'utf8').digest('base64')}'`;
const inlineSkripte = (h) => [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

test('CSP · jedes Inline-Skript, das eine Seite ausliefert, ist ueber seinen Hash erlaubt', () => {
  const csp = inhaltsrichtlinie();
  const html = mitSchluessel(() => [
    ...seiten.map((s) => renderPage(alsSeite(s))),
    // Die drei Bausteine mit Skript ausdruecklich, auch wenn keine Seite sie gerade so nutzt.
    renderPage(seite([{ type: 'assistent', data: {} },
      { type: 'formular', data: { felder: [{ name: 'n', label: 'Name' }] } },
      { type: 'infokarten', data: { zaehlen: 'ja', karten: [{ label: 'Plätze', wert: '7' }] } }])),
  ]);
  const skripte = new Set(html.flatMap(inlineSkripte));
  assert.ok(skripte.size >= 3, `nur ${skripte.size} Inline-Skripte gefunden`);
  for (const s of skripte) {
    assert.ok(csp.includes(hashVon(s)),
      `Inline-Skript ohne Hash in der CSP — fehlt es unter 'skripte' im Baustein? Anfang: ${s.trim().slice(0, 60)}`);
  }
});

test('CSP · kein unsafe-inline fuer Skripte, nichts von fremden Servern', () => {
  const csp = inhaltsrichtlinie();
  const skript = csp.split('; ').find((d) => d.startsWith('script-src'));
  assert.doesNotMatch(skript, /unsafe-inline|unsafe-eval|https?:/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /https?:\/\//);
});

/** Die Middleware einmal durchlaufen lassen und die gesetzten Kopfzeilen einsammeln. */
function koepfe({ secure }) {
  const gesetzt = {};
  const res = { set(k, v) { if (typeof k === 'object') Object.assign(gesetzt, k); else gesetzt[k] = v; return this; } };
  let weiter = false;
  sicherheitsKoepfe()({ secure }, res, () => { weiter = true; });
  return { gesetzt, weiter };
}

test('Kopfzeilen · auf jeder Antwort, HSTS nur ueber HTTPS', () => {
  const http = koepfe({ secure: false });
  assert.equal(http.weiter, true);
  assert.equal(http.gesetzt['X-Content-Type-Options'], 'nosniff');
  assert.equal(http.gesetzt['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.ok(http.gesetzt['Content-Security-Policy']);
  assert.ok(http.gesetzt['Permissions-Policy']);
  assert.equal(http.gesetzt['Strict-Transport-Security'], undefined);
  assert.match(koepfe({ secure: true }).gesetzt['Strict-Transport-Security'], /max-age=\d+/);
});

test('Bremse · je Adresse, ab der ersten Anfrage ueber der Grenze', () => {
  const zuSchnell = bremseFuer({ fensterMs: 60_000, hoechstens: 5 });
  for (let i = 0; i < 5; i++) assert.equal(zuSchnell('1.1.1.1'), false, `Anfrage ${i + 1}`);
  assert.equal(zuSchnell('1.1.1.1'), true);
  assert.equal(zuSchnell('2.2.2.2'), false, 'eine andere Adresse ist nicht betroffen');
});

test('Aufmacher · Groessenreihe, wenn es eine gibt, und nur das erste Bild mit Vorrang', () => {
  const h = renderPage(seite([{ type: 'hero', data: {
    titel: 'T', bild: '/bilder/a-1600-x.jpg', bilder: [{ src: '/bilder/b-1600-y.jpg' }, { src: '/uploads/c.jpg' }] } }]),
  { dynamicData: { hero: { srcsets: {
    '/bilder/a-1600-x.jpg': '/bilder/a-400-x.jpg 400w, /bilder/a-1600-x.jpg 1600w',
    '/bilder/b-1600-y.jpg': '/bilder/b-400-y.jpg 400w, /bilder/b-1600-y.jpg 1600w' } } } });
  assert.match(h, /src="\/bilder\/a-1600-x\.jpg" srcset="\/bilder\/a-400-x\.jpg 400w, \/bilder\/a-1600-x\.jpg 1600w" sizes="100vw"/);
  assert.match(h, /src="\/uploads\/c\.jpg"\s+alt=""/, 'ein hochgeladenes Bild ohne Reihe bleibt, wie es ist');
  assert.equal((h.match(/fetchpriority="high"/g) || []).length, 1);
  assert.equal((h.match(/fetchpriority="low"/g) || []).length, 2);
});

test('Jede Seite nennt ihr Zeichen fuer den Browser-Tab', () => {
  assert.match(renderPage(seite([])), /<link rel="icon" type="image\/svg\+xml" href="\/assets\/ktc-logo-rahmen\.svg">/);
});
