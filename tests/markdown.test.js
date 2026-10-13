import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markdownInline } from '../src/blocks/_util.js';

test('markdownInline: ein Link mit Parametern behält sein & (nicht &amp;amp;)', () => {
  const h = markdownInline('[Karte](https://www.google.com/maps/search/?api=1&query=Kriftel)').value;
  assert.match(h, /href="https:\/\/www\.google\.com\/maps\/search\/\?api=1&amp;query=Kriftel"/);
  assert.doesNotMatch(h, /&amp;amp;/);
});

test('markdownInline: Skript-Ziele werden weiter verworfen', () => {
  const h = markdownInline('[x](javascript:alert(1))').value;
  assert.doesNotMatch(h, /<a /);
});
