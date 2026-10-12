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
