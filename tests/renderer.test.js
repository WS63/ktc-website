import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { renderPage } from '../src/renderer.js';
import { validateContent } from '../src/archetypes.js';

const seite = (blocks, extra = {}) => ({
  slug: 'test', page_type: 'home', status: 'published',
  title: 'Test', description: '', content_json: JSON.stringify({ blocks }), ...extra,
});

test('P1 · reine Funktion: gleiche Daten, gleiches HTML', () => {
  const s = seite([{ type: 'hero', data: { titel: 'Hallo' } }]);
  assert.equal(renderPage(s), renderPage(s));
});

test('P2 · Fakt wird eingestempelt', () => {
  const html = renderPage(seite([{ type: 'hero', data: { titel: '{{facts.beitraege.aktiv}} Euro' } }]));
  assert.match(html, /290 Euro/);
});

test('P2 · fehlender Fakt wird sichtbar, nicht erfunden', () => {
  // Ein Pfad, den es nie geben wird. Vorher stand hier 'verein.registernummer'
  // — ein echter Fakt, der nur zufaellig leer war. Sobald jemand ihn
  // eintraegt, schlug der Test fehl, obwohl nichts kaputt war.
  const html = renderPage(seite([{ type: 'hero', data: { titel: 'X{{facts.test.nie_gesetzt}}X' } }]));
  assert.match(html, /X\[…\]X/);
});

test('P2 · Fakt in einem Link ueberlebt die ziel()-Pruefung', () => {
  const html = renderPage(seite([{ type: 'nav', data: {
    marke: 'KTC', baum: [], aktionLabel: 'Buchen', aktionHref: '{{facts.links.buchung}}' } }]));
  assert.match(html, /href="https:\/\/tennisclub-kriftel\.ebusy\.de"/);
});

test('P3 · die Zahl wird gerechnet, nicht getippt', () => {
  const eintraege = [
    { datum: '1. Mai', titel: 'A', href: '/a/' },
    { datum: '2. Mai', titel: 'B', href: '/b/' },
  ];
  const html = renderPage(seite([{ type: 'beitragsliste', data: { titel: 'Neu' } }]),
    { dynamicData: { beitragsliste: { eintraege } } });
  assert.match(html, /2 Beiträge/);
  const eins = renderPage(seite([{ type: 'beitragsliste', data: {} }]),
    { dynamicData: { beitragsliste: { eintraege: [eintraege[0]] } } });
  assert.match(eins, /1 Beitrag(?!e)/);
});

test('Sicherheit · Modell-Text kann kein Skript einschleusen', () => {
  const html = renderPage(seite([{ type: 'hero', data: { titel: '<script>alert(1)</script>' } }]));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.match(html, /&lt;script&gt;/);
});

test('Sicherheit · javascript: als Link-Ziel wird verworfen', () => {
  const html = renderPage(seite([{ type: 'hero', data: {
    titel: 'T', ctaLabel: 'Klick', ctaHref: 'javascript:alert(1)' } }]));
  assert.ok(!html.includes('javascript:'));
  assert.ok(!html.includes('>Klick<'));
});

test('Ein Entwurf bekommt immer noindex', () => {
  assert.match(renderPage(seite([], { status: 'draft' })), /noindex/);
});

test('Veroeffentlichtes ist freigegeben — ausser auf einer Testdomain', () => {
  const { readFileSync } = require('node:fs');
  const site = JSON.parse(readFileSync('config/site.json', 'utf8'));
  const html = renderPage(seite([]));
  if (site.suchmaschinen === false) {
    // Testdomain: NICHTS darf in den Suchindex, auch nichts Veroeffentlichtes.
    assert.match(html, /noindex, nofollow/);
  } else {
    assert.ok(!html.includes('noindex'));
  }
});

test('Vertrag · unerlaubter Baustein faellt durch', () => {
  const r = validateContent('home', { blocks: [{ type: 'gibtsnicht', data: {} }] });
  assert.equal(r.ok, false);
  assert.match(r.fehler.join(' '), /nicht erlaubt/);
});

test('Vertrag · fehlender Pflicht-Baustein faellt durch', () => {
  const r = validateContent('home', { blocks: [{ type: 'hero', data: {} }] });
  assert.equal(r.ok, false);
  assert.match(r.fehler.join(' '), /Pflicht-Baustein fehlt/);
});

test('Vertrag · gueltiger Inhalt geht durch', () => {
  const r = validateContent('home', { blocks: [
    { type: 'nav', data: {} }, { type: 'hero', data: {} }, { type: 'footer', data: {} }] });
  assert.equal(r.ok, true, r.fehler.join(' '));
});
