import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ergebnis, spielwochenende, letztesWochenende, bilanz, bilanzText, rohmaterial,
  unbelegteErgebnisse, ergebnisTabelle, zeitraumText,
} from '../src/spielbericht.js';

const spiel = (o) => ({ datum: '2026-05-09', uhrzeit: '09:00', mannschaft: 'Herren', gegner: 'TC A',
  zuhause: true, matchpunkte: '5:1', gespielt: true, sg: '', bericht: '', ...o });

test('das Ergebnis kommt aus Sicht des KTC, egal ob Heim oder Auswaerts', () => {
  assert.deepEqual(ergebnis(spiel({ zuhause: true, matchpunkte: '5:1' })), { wir: 5, sie: 1, ausgang: 'Sieg' });
  // 2:4 als Gast ist ein Sieg — die Verwechslung, die der Bericht nie haben darf.
  assert.deepEqual(ergebnis(spiel({ zuhause: false, matchpunkte: '2:4' })), { wir: 4, sie: 2, ausgang: 'Sieg' });
  assert.equal(ergebnis(spiel({ zuhause: true, matchpunkte: '2:4' })).ausgang, 'Niederlage');
  assert.equal(ergebnis(spiel({ matchpunkte: '3:3' })).ausgang, 'Unentschieden');
  assert.equal(ergebnis(spiel({ matchpunkte: '' })), null);
});

test('nur gespielte Begegnungen im Zeitraum, beide Randtage eingeschlossen', () => {
  const plan = { begegnungen: [
    spiel({ datum: '2026-05-07' }), spiel({ datum: '2026-05-08' }), spiel({ datum: '2026-05-10' }),
    spiel({ datum: '2026-05-11' }), spiel({ datum: '2026-05-09', gespielt: false, matchpunkte: '' }),
  ] };
  assert.deepEqual(spielwochenende(plan, '2026-05-08', '2026-05-10').map((b) => b.datum),
    ['2026-05-08', '2026-05-10']);
});

test('das juengste Wochenende: der letzte Spieltag und die zwei davor', () => {
  const plan = { begegnungen: [spiel({ datum: '2026-05-10' }), spiel({ datum: '2026-05-17' })] };
  assert.deepEqual(letztesWochenende(plan), { von: '2026-05-15', bis: '2026-05-17' });
  assert.equal(letztesWochenende({ begegnungen: [] }), null);
});

test('die Bilanz wird gerechnet, und die Mehrzahl stimmt', () => {
  const l = [spiel({}), spiel({ matchpunkte: '1:5' }), spiel({ matchpunkte: '3:3' }), spiel({ zuhause: false, matchpunkte: '2:4' })];
  assert.deepEqual(bilanz(l), { begegnungen: 4, siege: 2, unentschieden: 1, niederlagen: 1 });
  assert.equal(bilanzText(bilanz([spiel({})])), '1 Begegnung — 1 Sieg, 0 Unentschieden, 0 Niederlagen');
});

test('zeitraumText: ein Monat, zwei Monate, ein Tag', () => {
  assert.equal(zeitraumText('2026-05-08', '2026-05-10'), '8. bis 10. Mai 2026');
  assert.equal(zeitraumText('2026-05-30', '2026-06-01'), '30. Mai bis 1. Juni 2026');
  assert.equal(zeitraumText('2026-05-08', '2026-05-08'), '8. Mai 2026');
});

test('das Rohmaterial nennt jedes Ergebnis aus Sicht des KTC und die Spielgemeinschaft', () => {
  const roh = rohmaterial([spiel({ mannschaft: 'Damen', sg: 'Diedenbergen/KTC', zuhause: false, matchpunkte: '2:4' })],
    '2026-05-08', '2026-05-10');
  assert.match(roh, /Damen \(Spielgemeinschaft Diedenbergen\/KTC\): Auswärtsspiel bei TC A — Ergebnis 4:2 aus Sicht des KTC \(Sieg\)/);
  assert.match(roh, /1 Begegnung — 1 Sieg/);
});

test('ein erfundenes Ergebnis im Text wird gefunden, ein umgedrehtes nicht', () => {
  const roh = rohmaterial([spiel({ matchpunkte: '5:1' })], '2026-05-08', '2026-05-10');
  assert.deepEqual(unbelegteErgebnisse('Ein 5:1 und ein 1:5 waren drin.', roh), []);
  assert.deepEqual(unbelegteErgebnisse('Am Ende stand es 6:3.', roh), ['6:3']);
});

test('die Ergebnistabelle kommt aus den Daten: Heim links, Ausgang aus Sicht des KTC, Link zum Bericht', () => {
  const t = ergebnisTabelle([
    spiel({ mannschaft: 'Damen 40', zuhause: false, gegner: 'TV Ruppertshain', matchpunkte: '2:4',
      bericht: 'https://htv.liga.nu/x?a=1&b=2' }),
  ], '10. Oktober 2026');
  assert.equal(t.zeilen[0][2], 'TV Ruppertshain - Damen 40');
  assert.equal(t.zeilen[0][3], '2:4 (Sieg)');
  assert.deepEqual(t.zeilen[0][4], { text: 'Spielbericht', href: 'https://htv.liga.nu/x?a=1&b=2' });
  assert.match(t.hinweis, /Stand 10\. Oktober 2026/);
});
