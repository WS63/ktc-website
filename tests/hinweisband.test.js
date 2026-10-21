import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../src/renderer.js';
import { seiten } from '../src/seiten.js';

test('hinweisband: Marke, Text mit Links; ohne Marke nur der Text', () => {
  const seite = (d) => ({ slug: 'p', page_type: 'standard', status: 'published', title: 'P',
    content_json: { blocks: [{ type: 'hinweisband', data: d }] } });
  const mit = renderPage(seite({ titel: 'Erst kurz nachschauen?', text: 'Siehe [FAQ](/faq/).' }));
  assert.match(mit, /<p class="hinweisband__titel">Erst kurz nachschauen\?<\/p>/);
  assert.match(mit, /<a href="\/faq\/">FAQ<\/a>/);
  assert.doesNotMatch(renderPage(seite({ text: 'Nur Text.' })), /<p class="hinweisband__titel">/);
});

test('Kontaktseite: der Hinweis auf FAQ und Assistent steht im Formular, kein eigenes Band mehr', () => {
  const k = seiten.find((x) => x.slug === 'kontakt').blocks;
  assert.equal(k.filter((b) => b.type === 'hinweisband').length, 0);
  const f = k.find((b) => b.type === 'formular').data;
  assert.equal(f.aufbau, 'kompakt');
  assert.match(f.vorspann, /\(\/faq\/\)/);
  assert.match(f.vorspann, /\(#frag-lisa\)/);
  assert.deepEqual(f.kontakte.map((x) => x.label), ['Anschrift', 'Telefon', 'E-Mail']);
  assert.match(f.kontakte[1].href, /^tel:\{\{facts\.vorstand\.erster\.telefon_waehlen\}\}$/);
});
