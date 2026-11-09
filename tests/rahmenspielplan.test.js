import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { klasseText, klassenText, rahmenTermine, kalenderTermine, alleTermine, kuenftige } from '../src/termin-quelle.js';

const rahmen = JSON.parse(readFileSync('inhalte/rahmenspielplan/2027.json', 'utf8'));

test('Kürzel werden zu Klassen: Damen, Herren, Jugend', () => {
  assert.deepEqual(klasseText('D40'), { gruppe: 'Damen', text: 'Damen 40' });
  assert.deepEqual(klasseText('D'), { gruppe: 'Damen', text: 'Damen' });
  assert.deepEqual(klasseText('H60'), { gruppe: 'Herren', text: 'Herren 60' });
  assert.deepEqual(klasseText('U12'), { gruppe: 'Jugend', text: 'U12' });
  assert.deepEqual(klasseText('X9'), { gruppe: 'Weitere', text: 'X9' }, 'Unbekanntes bleibt, wie es steht');
  assert.equal(klassenText(['H50', 'U12', 'D40', 'U18', 'D50']), 'Damen 40, Damen 50 · Herren 50 · Jugend U12, U18');
});

test('Die Datei ist in Ordnung: gültige Tage, Freitag bis Sonntag, jedes Kürzel bekannt', () => {
  assert.equal(rahmen.tage.length, 27);
  for (const t of rahmen.tage) {
    assert.match(t.datum, /^2027-\d\d-\d\d$/);
    const tag = new Date(`${t.datum}T12:00:00Z`).getUTCDay();
    assert.ok([5, 6, 0].includes(tag), `${t.datum} liegt nicht auf Freitag, Samstag oder Sonntag`);
    assert.ok(t.klassen.length > 0, t.datum);
    for (const k of t.klassen) assert.notEqual(klasseText(k).gruppe, 'Weitere', `unbekanntes Kürzel „${k}“ am ${t.datum}`);
  }
});

test('Ein Eintrag je Wochenende, Ausweichtermine sind benannt, die Tage stehen im Text', () => {
  const l = rahmenTermine(rahmen, null);
  assert.equal(l.length, 9);
  assert.deepEqual(l.map((t) => t.datum), ['2027-05-21', '2027-06-04', '2027-06-11', '2027-06-18', '2027-08-06',
    '2027-08-13', '2027-08-20', '2027-08-27', '2027-09-03']);
  const erste = l[0];
  assert.equal(erste.bis, '2027-05-23');
  assert.equal(erste.titel, 'HTV-Medenspieltag');
  assert.equal(erste.art, 'spiel');
  assert.match(erste.text, /\*\*Fr:\*\* Jugend U10, U15\./);
  assert.match(erste.text, /\*\*Sa:\*\* Damen 40, Damen 50, Damen 55 · Herren 50, Herren 55, Herren 60 · Jugend U12, U18\./);
  assert.match(erste.text, /Mannschaften und Gegner folgen/);
  const ausweich = l.filter((t) => /Ausweichtermin/.test(t.titel)).map((t) => t.datum);
  assert.deepEqual(ausweich, ['2027-08-06', '2027-08-27']);
  assert.match(l[4].text, /^Ausweichtermin für verlegte Spiele/);
});

test('Der echte Spielplan ersetzt den Rahmen für sein Wochenende, die übrigen bleiben', () => {
  const plan = { begegnungen: [{ datum: '2027-06-05', mannschaft: 'Herren 50', heim: 'a', gast: 'b' }] };
  const l = rahmenTermine(rahmen, plan);
  assert.equal(l.length, 8);
  assert.ok(!l.some((t) => t.datum === '2027-06-04'), 'das Wochenende 4. bis 6. Juni ist durch echte Spiele belegt');
  assert.ok(l.some((t) => t.datum === '2027-06-11'));
});

test('Ohne Rahmen oder mit kaputten Daten bleibt die Liste leer, nichts bricht (P6)', () => {
  assert.deepEqual(rahmenTermine(null, null), []);
  assert.deepEqual(rahmenTermine({ tage: [{ datum: 'bald' }, null, {}] }, null), []);
});

test('Im Kalender und bei Lisa stehen die Rahmen-Spieltage, nicht in den Ergebnissen', () => {
  const imKalender = kalenderTermine().filter((t) => /^HTV-Medenspieltag/.test(t.titel) && t.datum.startsWith('2027-0'));
  assert.ok(imKalender.some((t) => t.datum === '2027-05-21' && t.bis === '2027-05-23'));
  assert.ok(alleTermine({ echt: true }).some((t) => t.datum === '2027-08-27' && /Ausweichtermin/.test(t.titel)));
  const mitText = kuenftige(kalenderTermine()).find((t) => t.datum === '2027-05-21');
  if (mitText) assert.equal(mitText.wochentag, 'Fr–So');
  assert.ok(!/ergebnisse/.test(imKalender.map((t) => t.mehr || '').join()), 'kein Link zu den Ergebnissen: es gibt noch keine');
});
