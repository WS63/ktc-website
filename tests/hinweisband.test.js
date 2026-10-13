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

test('Kontaktseite: der Hinweis auf FAQ und Assistent steht vor dem Formular', () => {
  const k = seiten.find((x) => x.slug === 'kontakt').blocks;
  const typen = k.map((b) => b.type);
  assert.ok(typen.indexOf('hinweisband') < typen.indexOf('formular'));
  const t = k.find((b) => b.type === 'hinweisband').data.text;
  assert.match(t, /\(\/faq\/\)/);
  assert.match(t, /\(#frag-den-ktc\)/);
});
