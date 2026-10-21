import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seiten } from '../src/seiten.js';

/**
 * Keine Gedankenstriche in Texten, die ein Besucher liest. Entschieden am 21.10.2026:
 * statt dessen ein neuer Satz, ein Semikolon, ein Komma oder ein Doppelpunkt. Zahlenbereiche
 * (11:00 – 14:30 Uhr) sind kein Gedankenstrich und bleiben; deshalb zaehlt nur, was zwischen
 * Buchstaben, Satzzeichen oder Klammern steht.
 */
const GEDANKENSTRICH = /(?:[\p{L})!?.,;:] — )|(?:[\p{L})] – \p{L})/u;

function texte(wert, pfad, aus = []) {
  if (typeof wert === 'string') aus.push([pfad, wert]);
  else if (Array.isArray(wert)) wert.forEach((w, i) => texte(w, `${pfad}[${i}]`, aus));
  else if (wert && typeof wert === 'object') {
    for (const [k, w] of Object.entries(wert)) if (!k.startsWith('_')) texte(w, `${pfad}.${k}`, aus);
  }
  return aus;
}
const pruefe = (quelle, wert) => {
  const treffer = texte(wert, quelle).filter(([, t]) => GEDANKENSTRICH.test(t));
  assert.deepEqual(treffer.map(([p, t]) => `${p}: ${t.slice(0, 90)}`), [], `${quelle}: Gedankenstrich im Text`);
};

test('Seiten, Beiträge, Termine und Fakten enthalten keinen Gedankenstrich', () => {
  pruefe('seiten', seiten);
  for (const datei of ['inhalte/beitraege.json', 'inhalte/termine.json', 'config/facts.json']) {
    pruefe(datei, JSON.parse(readFileSync(datei, 'utf8')));
  }
});

test('die Stimme sagt dem Generator, dass er keine Gedankenstriche schreibt', () => {
  assert.match(readFileSync('inhalte/stimme.md', 'utf8'), /Keine Gedankenstriche/);
});

test('der Test erkennt einen Gedankenstrich und lässt Zahlenbereiche durch', () => {
  assert.ok(GEDANKENSTRICH.test('Das Herz des Vereins — sie sorgt'));
  assert.ok(GEDANKENSTRICH.test('Mixed-Duelle – und am Ende'));
  assert.ok(!GEDANKENSTRICH.test('Öffnungszeiten 11:00 – 14:30 Uhr'));
});
