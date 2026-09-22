import { test } from 'node:test';
import assert from 'node:assert/strict';
import { holeJson } from '../src/generator.js';

/**
 * Der JSON-Parser muss gehaertet sein. Modelle liefern gelegentlich Text um
 * das JSON herum, Code-Zaeune oder ein Komma zu viel. Ein Generator, der
 * daran scheitert, wird nicht benutzt.
 */

test('Parser · sauberes JSON', () => {
  assert.deepEqual(holeJson('{"a":1}'), { a: 1 });
});

test('Parser · Code-Zäune um das JSON', () => {
  assert.deepEqual(holeJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(holeJson('```\n{"a":1}\n```'), { a: 1 });
});

test('Parser · Text davor und danach', () => {
  assert.deepEqual(
    holeJson('Gern! Hier ist die Seite:\n{"a":1}\nSag Bescheid, wenn etwas fehlt.'),
    { a: 1 });
});

test('Parser · geschweifte Klammern INNERHALB von Zeichenketten', () => {
  // Der haeufigste Fallstrick: {{facts.…}} steht ueberall in unseren Texten.
  // Ein naiver Klammer-Zaehler bricht hier ab und liefert kaputtes JSON.
  const roh = 'Hier:\n{"t":"Der Beitrag liegt bei {{facts.beitraege.aktiv}} Euro"}\nFertig.';
  assert.deepEqual(holeJson(roh), { t: 'Der Beitrag liegt bei {{facts.beitraege.aktiv}} Euro' });
});

test('Parser · verschachtelte Objekte mit Text drumherum', () => {
  const roh = 'Text {"blocks":[{"type":"hero","data":{"titel":"Hallo"}}]} Text';
  assert.deepEqual(holeJson(roh), { blocks: [{ type: 'hero', data: { titel: 'Hallo' } }] });
});

test('Parser · ein Komma zu viel vor der schließenden Klammer', () => {
  assert.deepEqual(holeJson('{"a":1,"b":[1,2,],}'), { a: 1, b: [1, 2] });
});

test('Parser · maskierte Anführungszeichen in Zeichenketten', () => {
  assert.deepEqual(holeJson('{"t":"Er sagte \\"hallo\\" und ging"}'),
    { t: 'Er sagte "hallo" und ging' });
});

test('Parser · gibt auf, statt Unsinn zu liefern', () => {
  assert.throws(() => holeJson('Tut mir leid, das kann ich nicht.'), /kein brauchbares JSON/);
  assert.throws(() => holeJson(''), /kein brauchbares JSON/);
});
