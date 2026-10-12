import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../src/renderer.js';

const seite = (daten) => ({
  slug: 'probe', page_type: 'standard', status: 'published', title: 'Probe',
  content_json: { blocks: [{ type: 'infokarten', data: daten }] },
});
const karten = [{ label: 'Erwachsene', wert: '290 €', zusatz: 'pro Jahr' }];

test('infokarten zeigen das Angebotsband nur, wenn eine Zahl dafür da ist', () => {
  const mit = renderPage(seite({ karten, grund: 'weiss', angebotWert: '225 €',
    angebotText: '**Neu dabei?** So viel zahlst du im ersten Jahr.' }));
  assert.match(mit, /class="info__angebot"/);
  assert.match(mit, />225 €</);
  assert.match(mit, /<strong>Neu dabei\?<\/strong>/);
  const ohne = renderPage(seite({ karten, grund: 'weiss' }));
  assert.doesNotMatch(ohne, /class="info__angebot"/);
});

test('die Seite Mitglied werden nennt das Angebot und den Partnerbeitrag aus den Fakten', async () => {
  const { seiten } = await import('../src/seiten.js');
  const s = seiten.find((x) => x.slug === 'mitglied-werden');
  const band = s.blocks.find((b) => b.type === 'infokarten' && b.data.angebotWert);
  assert.match(band.data.angebotWert, /facts\.beitraege\.neumitglied_erstes_jahr/);
  assert.match(band.data.angebotText, /facts\.beitraege\.aktiv_partner/);
});

test('infokarten zählen nur mit zaehlen: ja, und der Endwert steht immer da', () => {
  const k = [{ label: 'Mitglieder', wert: 'über 500', zusatz: 'x' }, { label: 'Plätze', wert: '7' }];
  const ja = renderPage(seite({ karten: k, zaehlen: 'ja' }));
  assert.match(ja, /data-bis="500"/);
  assert.match(ja, /data-bis="7"/);
  assert.match(ja, /<span class="nur-vorleser">über 500<\/span>/);   // fertig fuer Vorleser
  assert.match(ja, /class="info__zahl"[^>]*>500</);                  // ohne Skript steht der Endwert
  assert.match(ja, /prefers-reduced-motion/);                        // das Skript beachtet es
  const nein = renderPage(seite({ karten: k }));
  assert.doesNotMatch(nein, /data-bis/);
  assert.doesNotMatch(nein, /IntersectionObserver/);
});

test('die Startseite zählt ihre drei Zahlen, die Beitragskarten nicht', async () => {
  const { seiten } = await import('../src/seiten.js');
  const start = seiten.find((x) => x.slug === 'start').blocks.find((b) => b.type === 'infokarten');
  assert.equal(start.data.zaehlen, 'ja');
  const mw = seiten.find((x) => x.slug === 'mitglied-werden').blocks.filter((b) => b.type === 'infokarten');
  assert.ok(mw.every((b) => b.data.zaehlen !== 'ja'));
});
