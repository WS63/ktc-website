import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { berlinEpoch, berlinTag, tagPlus, berlinWann, berlinUhr } from '../src/zeit.js';
import { begegnungen } from '../src/htv.js';
import { stufenZeiten, faelligeStufe, faelligeGruppen } from '../src/spielstand.js';

// ── Zeit ───────────────────────────────────────────────────────────────
test('Berliner Zeit: Sommer +2, Winter +1, und die Umstellung stimmt', () => {
  assert.equal(new Date(berlinEpoch('2026-05-09', '09:00')).toISOString(), '2026-05-09T07:00:00.000Z');
  assert.equal(new Date(berlinEpoch('2026-01-10', '09:00')).toISOString(), '2026-01-10T08:00:00.000Z');
  // Letzter Sonntag im Maerz 2026 ist der 29.: um 3 Uhr springt die Uhr von 2 auf 3.
  assert.equal(new Date(berlinEpoch('2026-03-29', '12:00')).toISOString(), '2026-03-29T10:00:00.000Z');
  assert.equal(new Date(berlinEpoch('2026-03-28', '12:00')).toISOString(), '2026-03-28T11:00:00.000Z');
  assert.ok(Number.isNaN(berlinEpoch('', '09:00')));
});

test('Berliner Tag und Uhrzeit, auch wenn UTC schon im naechsten Tag steht', () => {
  const spaet = berlinEpoch('2026-05-09', '23:30');            // 21:30 UTC
  assert.equal(berlinTag(spaet), '2026-05-09');
  assert.equal(berlinUhr(spaet), '23:30');
  assert.equal(tagPlus('2026-05-31', 1), '2026-06-01');
  assert.equal(tagPlus('2026-01-01', -1), '2025-12-31');
});

test('berlinWann: heute, gestern, sonst Datum', () => {
  const jetzt = berlinEpoch('2026-05-10', '15:00');
  assert.equal(berlinWann(berlinEpoch('2026-05-10', '09:05'), jetzt), 'Heute, 09:05 Uhr');
  assert.equal(berlinWann(berlinEpoch('2026-05-09', '22:10'), jetzt), 'Gestern, 22:10 Uhr');
  assert.equal(berlinWann(berlinEpoch('2026-05-07', '08:00'), jetzt), '7. Mai, 08:00 Uhr');
});

// ── Wann wird abgefragt ────────────────────────────────────────────────
const spiel = (o) => ({ id: 'a', gruppe: '1', datum: '2026-05-09', uhrzeit: '09:00', gespielt: false, stufe: 0, ...o });
const std = 3600 * 1000;

test('vier Abfragen: 8, 16, 24 Stunden nach Beginn und am Folgetag um 14 Uhr', () => {
  const z = stufenZeiten('2026-05-09', '09:00');
  const start = berlinEpoch('2026-05-09', '09:00');
  assert.deepEqual(z, [start + 8 * std, start + 16 * std, start + 24 * std, berlinEpoch('2026-05-10', '14:00')]);
});

test('vor acht Stunden ist nichts faellig, danach Stufe fuer Stufe', () => {
  const start = berlinEpoch('2026-05-09', '09:00');
  assert.equal(faelligeStufe(spiel(), start + 7 * std), 0);
  assert.equal(faelligeStufe(spiel(), start + 8 * std), 1);
  assert.equal(faelligeStufe(spiel(), start + 17 * std), 2);
  assert.equal(faelligeStufe(spiel(), start + 25 * std), 3);
  assert.equal(faelligeStufe(spiel(), berlinEpoch('2026-05-10', '14:01')), 4);
});

test('eine schon erledigte Stufe wird nicht noch einmal faellig', () => {
  const start = berlinEpoch('2026-05-09', '09:00');
  assert.equal(faelligeStufe(spiel({ stufe: 1 }), start + 9 * std), 0);
  assert.equal(faelligeStufe(spiel({ stufe: 1 }), start + 17 * std), 2);
  assert.equal(faelligeStufe(spiel({ stufe: 4 }), start + 99 * std), 0);
});

test('ein Spiel mit Ergebnis ist fertig, ein Spiel ohne Termin wird nie abgefragt', () => {
  const spaet = berlinEpoch('2026-05-11', '12:00');
  assert.equal(faelligeStufe(spiel({ gespielt: true }), spaet), 0);
  assert.equal(faelligeStufe(spiel({ datum: '' }), spaet), 0);
});

test('abgefragt wird je GRUPPE, nicht je Spiel — und nur, wo etwas fehlt', () => {
  const nach = berlinEpoch('2026-05-09', '09:00') + 9 * std;
  const g = faelligeGruppen([
    spiel({ id: 'a', gruppe: '1' }), spiel({ id: 'b', gruppe: '1' }),
    spiel({ id: 'c', gruppe: '2', gespielt: true }), spiel({ id: 'd', gruppe: '3', datum: '2026-05-10' }),
  ], nach);
  assert.deepEqual([...g.keys()], ['1']);
  assert.equal(g.get('1').spiele.length, 2);
});

// ── Der HTV-Parser ─────────────────────────────────────────────────────
const tabelle = (kopf, zeilen) => `<table><tr><th>Login</th></tr></table><table><tr>${kopf.map((k) => `<th>${k}</th>`).join('')}</tr>${
  zeilen.map((z) => `<tr>${z.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;

test('Parser: Gruppe OHNE Spielort-Spalte, Datum nur in der ersten Zeile des Tages', () => {
  const html = tabelle(['Datum', 'Heimmannschaft', 'Gastmannschaft', 'Matchpunkte', 'Sätze', 'Spiele', 'Spielbericht'], [
    ['Sa', '09.05.2026 14:00', '', 'TC Kriftel', 'SKG Frankfurt', '6:3', '14:6', '96:56', '<a href="/x/meetingReport?meeting=1&amp;f=HTV">anzeigen</a>'],
    ['', '', '', 'BW Bensheim', 'TG Crumstadt', '1:8', '3:16', '60:97', 'anzeigen'],
    ['', '', '', 'TV Ruppertshain', 'TC Kriftel', '', '', '', ''],
  ]);
  const r = begegnungen(html, 'Herren');
  assert.equal(r.length, 2);                       // BW Bensheim spielt nicht gegen uns
  assert.deepEqual([r[0].datum, r[0].uhrzeit, r[0].zuhause, r[0].gespielt, r[0].matchpunkte], ['2026-05-09', '14:00', true, true, '6:3']);
  assert.equal(r[1].zuhause, false);
  assert.equal(r[1].gespielt, false);              // noch kein Ergebnis
  assert.equal(r[1].datum, '2026-05-09');          // das Datum wird geerbt
  assert.match(r[0].bericht, /meetingReport\?meeting=1&f=HTV$/);   // '&amp;' ist zurueck in '&'
});

test('Parser: Gruppe MIT Spielort-Spalte — dieselbe Auswertung, andere Spaltenzahl', () => {
  const html = tabelle(['Datum', 'Spielort', 'Heimmannschaft', 'Gastmannschaft', 'Matchpunkte', 'Sätze', 'Spiele', 'Spielbericht'], [
    ['Sa', '09.05.2026 09:00', '', '', 'TC Schwanheim', 'TC Kriftel', '0:6', '0:12', '25:73', 'anzeigen'],
  ]);
  const [b] = begegnungen(html, 'Herren 60');
  assert.deepEqual([b.heim, b.gast, b.zuhause, b.matchpunkte], ['TC Schwanheim', 'TC Kriftel', false, '0:6']);
});

test('Parser: dieselbe Paarung zweimal in einer Gruppe bekommt zwei Durchlaeufe', () => {
  const html = tabelle(['Datum', 'Heimmannschaft', 'Gastmannschaft', 'Matchpunkte', 'Sätze', 'Spiele', 'Spielbericht'], [
    ['Sa', '09.05.2026 14:00', '', 'TC Kriftel', 'TC A', '', '', '', ''],
    ['Sa', '05.09.2026 14:00', '', 'TC Kriftel', 'TC A', '', '', '', ''],
  ]);
  assert.deepEqual(begegnungen(html, 'X').map((b) => b.lauf), [1, 2]);
});

test('Parser: eine Seite ohne Spielplan-Tabelle ist ein Fehler, kein leeres Ergebnis', () => {
  assert.throws(() => begegnungen('<table><tr><th>Login</th></tr></table>', 'X'), /Spielplan-Tabelle/);
});

// ── Speichern: gegen eine eigene Datenbank ─────────────────────────────
test('Speichern: neu gemeldete Ergebnisse werden gezaehlt, die erste Meldung bleibt stehen', () => {
  const skript = `
    import { runMigrations, query } from './src/db.js';
    import { speichern, laden, spielstand } from './src/spielstand.js';
    await runMigrations();
    const b = (o) => ({ gruppe: '7', mannschaft: 'Damen', heim: 'TC Kriftel', gast: 'TC A', lauf: 1, zuhause: true,
      gegner: 'TC A', datum: '2026-05-09', uhrzeit: '09:00', matchpunkte: '', gespielt: false, ...o });
    const r1 = await speichern([b({})], '2026', '2026-05-09T10:00:00Z');                        // angelegt, ohne Ergebnis
    const r2 = await speichern([b({ matchpunkte: '5:1', gespielt: true })], '2026', '2026-05-09T15:00:00Z'); // Ergebnis kommt
    const r3 = await speichern([b({ matchpunkte: '5:1', gespielt: true })], '2026', '2026-05-09T23:00:00Z'); // nichts Neues
    await laden();
    const [s] = spielstand();
    console.log(JSON.stringify({ r1, r2, r3, n: spielstand().length, gespielt: s.gespielt, zuhause: s.zuhause,
      gemeldet: s.gemeldet_um, geprueft: s.geprueft_um }));
  `;
  const ausgabe = execFileSync(process.execPath, ['--input-type=module', '-e', skript], {
    env: { ...process.env, SQLITE_FILE: 'data/test-spielstand.db', DATABASE_URL: '' }, encoding: 'utf8',
  });
  execFileSync('rm', ['-f', 'data/test-spielstand.db', 'data/test-spielstand.db-wal', 'data/test-spielstand.db-shm']);
  const r = JSON.parse(ausgabe.trim().split('\n').pop());
  assert.deepEqual([r.r1.neu, r.r2.neu, r.r3.neu], [0, 1, 0]);
  assert.equal(r.n, 1);                                    // ein Spiel, nicht drei
  assert.equal(r.gespielt, true);
  assert.equal(r.zuhause, true);
  assert.equal(r.gemeldet, '2026-05-09T15:00:00Z');        // der Zeitpunkt der ERSTEN Meldung
  assert.equal(r.geprueft, '2026-05-09T23:00:00Z');        // geprueft wird jedes Mal
});

// ── Die Ergebnisseite ──────────────────────────────────────────────────
import { wochenenden, ansicht, wochenendeText } from '../src/ergebnisse.js';
import { renderPage } from '../src/renderer.js';

const sp = (o) => ({ id: Math.random().toString(36), mannschaft: 'Herren', sg: '', heim: 'TC Kriftel', gast: 'TC A', zuhause: true,
  gegner: 'TC A', datum: '2026-05-09', uhrzeit: '14:00', matchpunkte: '', gespielt: false, gemeldet_um: null, bericht: '', ...o });

test('Spielwochenenden: Freitag bis Sonntag sind eines, ein Mittwoch danach ein eigenes', () => {
  const w = wochenenden([sp({ datum: '2026-05-08' }), sp({ datum: '2026-05-10' }), sp({ datum: '2026-05-13' }), sp({ datum: '2026-05-16' })]);
  assert.deepEqual(w, [{ von: '2026-05-08', bis: '2026-05-10' }, { von: '2026-05-13', bis: '2026-05-13' }, { von: '2026-05-16', bis: '2026-05-16' }]);
  assert.equal(wochenendeText({ von: '2026-05-08', bis: '2026-05-10' }), '8. bis 10. Mai');
  assert.equal(wochenendeText({ von: '2026-05-30', bis: '2026-06-01' }), '30. Mai bis 1. Juni');
});

test('Ansicht: standardmaessig das juengste Wochenende, das schon angefangen hat', () => {
  const spiele = [sp({ datum: '2026-05-09' }), sp({ datum: '2026-05-16' }), sp({ datum: '2026-05-23' })];
  const jetzt = berlinEpoch('2026-05-17', '10:00');
  const a = ansicht(spiele, { jetzt });
  assert.equal(a.fenster.von, '2026-05-16');
  assert.equal(a.vorher.we, '2026-05-09');
  assert.equal(a.nachher, null);                         // das naechste liegt noch in der Zukunft
  assert.equal(ansicht(spiele, { jetzt, we: '2026-05-09' }).fenster.von, '2026-05-09');
});

test('Ansicht: Bilanz aus Sicht des KTC, offene Spiele gezaehlt, Status je Spiel', () => {
  const jetzt = berlinEpoch('2026-05-09', '16:00');
  const a = ansicht([
    sp({ mannschaft: 'A', matchpunkte: '5:1', gespielt: true, gemeldet_um: new Date(jetzt - 3600e3).toISOString() }),
    sp({ mannschaft: 'B', zuhause: false, matchpunkte: '2:4', gespielt: true }),      // auswaerts 2:4 = Sieg
    sp({ mannschaft: 'C', uhrzeit: '09:00' }),                                         // angepfiffen, Ergebnis fehlt
    sp({ mannschaft: 'D', uhrzeit: '18:00' }),                                         // noch nicht angepfiffen
  ], { jetzt });
  assert.deepEqual([a.bilanz.siege, a.bilanz.niederlagen, a.offen], [2, 0, 2]);
  assert.deepEqual(a.eintraege.map((e) => e.status), ['offen', 'gespielt', 'gespielt', 'kommt']);
  assert.equal(a.zuletzt.length, 1);                     // nur das gerade gemeldete
  assert.match(a.zuletzt[0].wann, /^Heute, /);
});

test('Ansicht ohne Spiele ist leer, und die Seite sagt es', () => {
  assert.equal(ansicht([], {}).leer, true);
  const html = renderPage({ slug: 'e', page_type: 'standard', status: 'published', title: 'E',
    content_json: { blocks: [{ type: 'ergebnisse', data: {} }] } }, { dynamicData: { ergebnisse: { ansicht: { leer: true } } } });
  assert.match(html, /Zurzeit liegen keine Spiele vor/);
});

test('Ergebnisseite: Heimmannschaft links, Ausgang als WORT, MSG-Etikett, keine Spielernamen', () => {
  const jetzt = berlinEpoch('2026-05-09', '20:00');
  const a = ansicht([
    sp({ mannschaft: 'Damen 40', zuhause: false, gegner: 'TV Ruppertshain', heim: 'TV Ruppertshain', gast: 'TC Kriftel',
      matchpunkte: '5:1', gespielt: true, sg: 'Diedenbergen/KTC' })], { jetzt });
  const html = renderPage({ slug: 'e', page_type: 'standard', status: 'published', title: 'E',
    content_json: { blocks: [{ type: 'ergebnisse', data: {} }] } }, { dynamicData: { ergebnisse: { ansicht: a, stand: 'Heute, 19:40 Uhr' } } });
  assert.match(html, /<span class="sie">TV Ruppertshain<\/span> - <span class="wir">Damen 40<\/span>/);
  assert.match(html, /Niederlage/);                    // 5:1 fuer den Gastgeber, wir waren Gast
  assert.match(html, /erg__msg/);
  assert.match(html, /Stand: Heute, 19:40 Uhr/);
});
