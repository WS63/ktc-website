import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { themeCss } from '../src/blocks/_theme.js';

const theme = JSON.parse(readFileSync('config/theme.json', 'utf8'));
const css = themeCss();

const bausteine = readdirSync('src/blocks')
  .filter((f) => f.endsWith('.js') && !f.startsWith('_'))
  .map((f) => ({ name: f, quelle: readFileSync(`src/blocks/${f}`, 'utf8') }));

test('jeder Token aus theme.json wird zu einer CSS-Variable', () => {
  for (const [gruppe, werte] of Object.entries(theme)) {
    if (gruppe.startsWith('_') || gruppe === 'dunkel-abschnitt') continue;
    const praefix = gruppe === 'schriften' ? 'font-' : '';
    for (const schluessel of Object.keys(werte)) {
      if (schluessel.startsWith('_')) continue;
      assert.match(css, new RegExp(`--${praefix}${schluessel}:`),
        `${gruppe}.${schluessel} fehlt im erzeugten CSS`);
    }
  }
});

test('Hinweise aus der JSON werden keine CSS-Variablen', () => {
  assert.doesNotMatch(css, /--_/);
});

test('der dunkle Abschnitt kippt die Tokens, nicht die Bausteine', () => {
  // Ohne diese Umdeutung waere Signalblau auf dunklem Grund mit 2,9:1 unlesbar.
  const block = css.match(/\.section--dunkel \{[^}]*\}/)?.[0] ?? '';
  assert.match(block, /--signal: #5b8cff/);
  assert.match(block, /--text: #ffffff/);

  // Wer stattdessen eine zweite Klasse je Baustein einfuehrt, hat den
  // Mechanismus verfehlt — dann muss jeder neue Baustein nachziehen.
  for (const { name, quelle } of bausteine) {
    assert.doesNotMatch(quelle, /--dunkel(?![-\w])/,
      `${name} greift direkt auf --dunkel zu statt .section--dunkel zu nutzen`);
  }
});

test('der Akzent ist nie Textfarbe — Gelb hat auf Weiss 1,66:1', () => {
  for (const { name, quelle } of bausteine) {
    assert.doesNotMatch(quelle, /(?<!-)color: *var\(--handlung\)/,
      `${name} faerbt Text mit dem Akzent`);
  }
});
