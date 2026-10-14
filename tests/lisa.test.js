import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../src/renderer.js';
import { seiten } from '../src/seiten.js';

const mitSchluessel = (fn) => {
  const alt = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'nur-fuer-den-test';
  try { return fn(); } finally { if (alt === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = alt; }
};
const seite = (data) => ({ slug: 'p', page_type: 'standard', status: 'published', title: 'P',
  content_json: { blocks: [{ type: 'assistent', data }] } });

test('Lisa: was der Server einsetzt, schlägt den Inhalt, der einmal in der Seite gelandet ist', () => {
  const veraltet = { name: 'Frag den KTC', begruessung: 'Ich kenne alles.', vorschlaege: ['Alt?'] };
  const h = mitSchluessel(() => renderPage(seite(veraltet), { dynamicData: { assistent: {
    name: '{{facts.assistent.name}}', rolle: '{{facts.assistent.rolle}}', begruessung: '',
    avatar: '/bilder/lisa-400-x.jpg', vorschlaege: ['Neu?'] } } }));
  assert.match(h, /Frag Lisa/);
  assert.doesNotMatch(h, /Frag Frag|Frag den KTC|Ich kenne alles/);
  assert.match(h, /Hallo, ich bin Lisa/);
  assert.match(h, /data-vorschlag="Neu\?"/);
  assert.doesNotMatch(h, /Alt\?/);
  assert.match(h, /<img src="\/bilder\/lisa-400-x\.jpg"/);
});

test('Lisa: die Seiten tragen den Baustein ohne eigene Texte', () => {
  for (const s of seiten) {
    for (const b of s.blocks.filter((x) => x.type === 'assistent')) {
      assert.deepEqual(b.data, {}, `${s.slug}: Lisa steht in config/assistent.json, nicht in der Seite`);
    }
  }
});

test('Lisa: ohne Schlüssel erscheint kein Knopf', () => {
  // Im CSS steht der Name immer, im Markup nur mit Schlüssel.
  const alt = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    assert.doesNotMatch(renderPage(seite({})), /<button class="ass__knopf/);
  } finally {
    if (alt !== undefined) process.env.ANTHROPIC_API_KEY = alt;
  }
});
