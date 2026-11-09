import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { rundeVon, inHalle, ansicht } from '../src/ergebnisse.js';
import { wochenendTermine, spieltageAus } from '../src/termin-quelle.js';
import { mannschaftsEreignisse, heimspielEreignisse, kalenderText } from '../src/kalender-abo.js';
import { saison, mannschaften, winterMannschaften } from '../src/mannschaften.js';
import { gruppenUrl, teamRunde } from '../src/htv.js';
import { berlinEpoch } from '../src/zeit.js';
import { renderPage } from '../src/renderer.js';
import { seiten } from '../src/seiten.js';

/**
 * Die Winterrunde 2026/27: gleiche Struktur wie die Medenrunde im Sommer (Heim und Gast, erstgenannt ist Heim),
 * aber in einer Halle. Sie gehoert zum Jahr 2026 und steht chronologisch zwischen den anderen Terminen; die Runde
 * ist nur ein Marker zur Orientierung.
 */
const W = 'Winter 2026/27';
const spiel = (o) => ({ saison: '2026', gruppe: '100', mannschaft: 'Herren 30', sg: '', heim: 'TC Kriftel', gast: 'TC A',
  zuhause: true, gegner: 'TC A', datum: '2026-11-15', uhrzeit: '17:30', matchpunkte: '', gespielt: false, lauf: 1,
  bericht: '', runde: W, ...o });
const sommer = (o) => spiel({ runde: 'Sommer 2026', datum: '2026-05-09', uhrzeit: '14:00', gruppe: '281', ...o });

test('Runde: ohne Angabe war es die Medenrunde im Sommer der Saison, nur Winter gilt als Halle', () => {
  assert.equal(rundeVon(spiel({})), W);
  assert.equal(rundeVon({ saison: '2026' }), 'Sommer 2026');
  assert.equal(rundeVon({}), '');
  assert.equal(inHalle(spiel({})), true);
  assert.equal(inHalle(sommer({})), false);
  assert.equal(inHalle({ saison: '2026' }), false);
});

test('Kalender: ein Winterwochenende heisst Winterspieltag, traegt den Marker und kennt keine Anlage', () => {
  const [w] = wochenendTermine({ begegnungen: [spiel({}), spiel({ zuhause: false, datum: '2026-11-14' })] });
  assert.equal(w.titel, 'HTV-Winterspieltag');
  assert.match(w.text, /^Winter 2026\/27: 2 Begegnungen\.$/);
  assert.doesNotMatch(w.text, /Anlage/);
  // Sommer bleibt, wie es war, und traegt jetzt auch den Marker.
  const [s] = wochenendTermine({ begegnungen: [sommer({})] });
  assert.equal(s.titel, 'HTV-Medenspieltag');
  assert.match(s.text, /^Sommer 2026: 1 Begegnung, davon 1 Heimspiel auf unserer Anlage\.$/);
});

test('Kalender: Sommer und Winter stehen chronologisch in einer Liste', () => {
  const w = wochenendTermine({ begegnungen: [spiel({}), sommer({}), spiel({ datum: '2027-02-20' })] });
  assert.deepEqual(w.map((t) => t.datum), ['2026-05-09', '2026-11-15', '2027-02-20']);
  assert.deepEqual(w.map((t) => t.titel), ['HTV-Medenspieltag', 'HTV-Winterspieltag', 'HTV-Winterspieltag']);
});

test('Assistent: ein Winterspieltag behaelt Heim und Auswaerts, nennt aber keine Heimspiele auf unserer Anlage', () => {
  const [t] = spieltageAus({ begegnungen: [spiel({}), spiel({ mannschaft: 'Herren 40', zuhause: false, gegner: 'TC B' })] });
  assert.equal(t.titel, 'Spieltag der HTV-Winterrunde');
  assert.match(t.text, /^Winter 2026\/27: 2 Begegnungen\.$/);
  assert.deepEqual(t.gruppen.map((g) => g.titel), ['Heimspiele', 'Auswärtsspiele']);
});

test('Abo: Winterspiele haben keinen Ort, die Dauer der Winterrunde, Heim und Gast und die Runde', () => {
  const plan = { saison: '2026', begegnungen: [spiel({})] };
  const [e] = mannschaftsEreignisse(plan, 'Herren 30', { stunden: 5, stundenWinter: 4, anschrift: 'Schmelzweg 6' });
  assert.equal(e.titel, 'Herren 30 · Heimspiel gegen TC A');
  assert.equal(e.ort, '');
  // 2er-Mannschaften: hoechstens vier Stunden, nicht die fuenf der Medenrunde.
  assert.deepEqual(e.ende, { datum: '2026-11-15', uhrzeit: '21:30' });
  assert.match(e.text, /TC Kriftel – TC A\nWinter 2026\/27/);
  assert.match(e.text, /Ende ist geschätzt/);
  // Ohne den Fakt der Winterrunde nur der Anfang, nichts wird erfunden; die Sommerdauer gilt hier nicht.
  const [ohne] = mannschaftsEreignisse(plan, 'Herren 30', { stunden: 5, anschrift: 'Schmelzweg 6' });
  assert.equal(ohne.ende, undefined);
  assert.doesNotMatch(ohne.text, /Ende ist geschätzt/);
  // Dieselbe Mannschaft im Sommer: Ort und Ende wie bisher.
  const [s] = mannschaftsEreignisse({ saison: '2026', begegnungen: [sommer({})] }, 'Herren 30', { stunden: 5, anschrift: 'Schmelzweg 6' });
  assert.equal(s.ort, 'Schmelzweg 6');
  assert.deepEqual(s.ende, { datum: '2026-05-09', uhrzeit: '19:00' });
});

test('Abo: das Heimspiel-Abo (auf unserer Anlage) enthaelt kein Winterspiel', () => {
  const plan = { saison: '2026', begegnungen: [spiel({}), sommer({ mannschaft: 'Herren 40' })] };
  const e = heimspielEreignisse(plan, { stunden: 5, anschrift: 'Schmelzweg 6' });
  assert.deepEqual(e.map((x) => x.titel), ['Heimspiel: Herren 40']);
  const ics = kalenderText({ name: 'x', ereignisse: mannschaftsEreignisse(plan, 'Herren 30', { anschrift: 'Schmelzweg 6' }) });
  assert.doesNotMatch(ics, /LOCATION/);
});

test('Ergebnisse: das Fenster nennt die Runde, die Seite zeigt den Marker', () => {
  const jetzt = berlinEpoch('2026-11-15', '20:00');
  const a = ansicht([spiel({ id: 'a' })], { jetzt });
  assert.equal(a.fenster.runde, W);
  assert.equal(a.eintraege[0].runde, W);
  const html = renderPage({ slug: 'e', page_type: 'standard', status: 'published', title: 'E',
    content_json: { blocks: [{ type: 'ergebnisse', data: {} }] } }, { dynamicData: { ergebnisse: { ansicht: a } } });
  assert.match(html, /<span class="erg__runde">Winter 2026\/27<\/span>/);
  // Heim und Gast bleiben als Blasen stehen.
  assert.match(html, /erg__blase--heim/);
});

test('Mannschaften: die Winterrunde gehoert zur Jahresdatei und hat ihren eigenen Wettbewerb beim HTV', () => {
  assert.ok(saison.winter, 'inhalte/mannschaften/<jahr>.json braucht den Abschnitt "winter"');
  assert.equal(saison.runden.winter, W);
  assert.equal(saison.wettbewerbe.winter, 'Winterrunde+26%2F27');
  assert.equal(winterMannschaften.length, 6);
  assert.ok(winterMannschaften.every((t) => t.wettbewerb === 'winter'));
  assert.ok(winterMannschaften.every((t) => t.staerke === '2er'));
  // Die Spielgemeinschaft der Jugend heisst, wie der HTV sie nennt.
  assert.deepEqual(saison.winter.jugend.map((t) => [t.name, t.sg]),
    [['Junioren U15', 'KTC/Diedenbergen'], ['Junioren U15 II', 'KTC/Diedenbergen']]);
  // Sommer und Winter werden zusammen beim HTV geholt.
  assert.ok(mannschaften.length >= saison.erwachsene.length + saison.jugend.length + 6);
  const herren30 = winterMannschaften.find((t) => t.name === 'Herren 30');
  assert.equal(gruppenUrl(saison, herren30),
    'https://htv.liga.nu/cgi-bin/WebObjects/nuLigaTENDE.woa/wa/groupPage?championship=Winterrunde+26%2F27&group=100');
  assert.equal(teamRunde(saison, herren30), W);
  assert.equal(teamRunde(saison, saison.erwachsene[0]), `Sommer ${saison.saison}`);
});

test('Seite Mannschaften: eigene Tabelle fuer die Winterrunde, die Links fuehren in die Winter-Gruppen', () => {
  const tabellen = seiten.find((s) => s.slug === 'mannschaften').blocks.filter((b) => b.type === 'tabelle');
  const winter = tabellen.find((t) => /Winterrunde/.test(t.data.titel));
  assert.ok(winter, 'keine Tabelle der Winterrunde');
  assert.equal(winter.data.titel, 'Mannschaften der Winterrunde 2026/27');
  const links = winter.data.spalten.flat().flatMap((g) => g.zeilen).filter(Array.isArray).map((z) => z[2].href);
  assert.equal(links.length, 6);
  assert.ok(links.every((h) => /championship=Winterrunde\+26%2F27&group=\d+$/.test(h)));
  // Die Sommer-Tabellen bleiben ohne Winter.
  const sommerLinks = tabellen.filter((t) => t !== winter).flatMap((t) => t.data.spalten.flat()).flatMap((g) => g.zeilen)
    .filter(Array.isArray).map((z) => z[2].href);
  assert.ok(sommerLinks.length > 20 && sommerLinks.every((h) => !/Winterrunde/.test(h)));
});

test('Speichern: die Runde bleibt stehen, eine alte Datei ohne Runde war der Sommer', () => {
  const skript = `
    import { runMigrations } from './src/db.js';
    import { speichern, laden, spielstand } from './src/spielstand.js';
    await runMigrations();
    const b = (o) => ({ gruppe: '7', mannschaft: 'Herren 30', heim: 'TC Kriftel', gast: 'TC A', lauf: 1, zuhause: true,
      gegner: 'TC A', datum: '2026-11-15', uhrzeit: '17:30', matchpunkte: '', gespielt: false, ...o });
    await speichern([b({ runde: 'Winter 2026/27' }), b({ gruppe: '8', datum: '2026-05-09' })], '2026');
    await laden();
    console.log(JSON.stringify(spielstand().map((s) => [s.gruppe, s.runde])));
  `;
  const db = 'data/test-winterrunde.db';
  const aus = execFileSync(process.execPath, ['--input-type=module', '-e', skript], {
    env: { ...process.env, SQLITE_FILE: db, DATABASE_URL: '' }, encoding: 'utf8' });
  execFileSync('rm', ['-f', db, `${db}-wal`, `${db}-shm`]);
  const zeilen = JSON.parse(aus.trim().split('\n').pop());
  assert.deepEqual(zeilen.sort(), [['7', 'Winter 2026/27'], ['8', 'Sommer 2026']]);
});

// ── Ergebnisse: die Zukunft ist erreichbar, in derselben Methode wie im Sommer ──────────────────────────
test('Ergebnisse: der Pfeil fuehrt in die Zukunft, "Als Naechstes" zeigt das naechste Wochenende mit Terminen', () => {
  const jetzt = berlinEpoch('2026-11-09', '12:00');
  const spiele = [
    spiel({ id: 'a', datum: '2026-11-08', uhrzeit: '16:00', gespielt: true, matchpunkte: '0:3', zuhause: false, mannschaft: 'Herren 40' }),
    spiel({ id: 'b', datum: '2026-11-15', uhrzeit: '17:30' }),
    spiel({ id: 'c', datum: '2026-11-15', uhrzeit: '17:30', mannschaft: 'Herren 40', zuhause: false, gegner: 'TC B' }),
    spiel({ id: 'd', datum: '2026-11-21', uhrzeit: '12:00', mannschaft: 'Junioren U15' }),
  ];
  const a = ansicht(spiele, { jetzt });
  assert.equal(a.fenster.von, '2026-11-08');                          // das juengste angefangene Wochenende
  assert.equal(a.nachher.we, '2026-11-15');                           // der Pfeil geht weiter
  assert.equal(a.naechste.we, '2026-11-15');
  assert.equal(a.naechste.runde, W);
  assert.equal(a.naechste.eintraege.length, 2);
  assert.ok(a.naechste.eintraege.every((e) => e.status === 'kommt'));
  // Das kuenftige Wochenende selbst zeigt keinen Kasten, wohl aber den Pfeil zum uebernaechsten.
  const z = ansicht(spiele, { jetzt, we: '2026-11-15' });
  assert.equal(z.naechste, null);
  assert.equal(z.nachher.we, '2026-11-21');
  assert.equal(z.vorher.we, '2026-11-08');
  // Ein altes Wochenende: der Kasten zeigt trotzdem das naechste, das noch nicht angefangen hat.
  const alt = ansicht([sommer({ id: 'x' }), ...spiele], { jetzt, we: '2026-05-09' });
  assert.equal(alt.naechste.we, '2026-11-15');
});

test('Ergebnisse: der Kasten steht unter dem Wochenende, mit Link und Uhrzeit, ohne zweiten Kopf', () => {
  const jetzt = berlinEpoch('2026-11-09', '12:00');
  const a = ansicht([spiel({ id: 'a', datum: '2026-11-08', gespielt: true, matchpunkte: '3:0' }),
    spiel({ id: 'b', datum: '2026-11-15', uhrzeit: '17:30' })], { jetzt });
  const html = renderPage({ slug: 'e', page_type: 'standard', status: 'published', title: 'E',
    content_json: { blocks: [{ type: 'ergebnisse', data: {} }] } }, { dynamicData: { ergebnisse: { ansicht: a } } });
  assert.match(html, /Als Nächstes: 15\. November 2026 <span class="erg__runde">Winter 2026\/27<\/span>/);
  assert.match(html, /href="\/ergebnisse\/\?we=2026-11-15">Zum Wochenende →<\/a>/);
  assert.match(html, /17:30 Uhr<\/td>/);
  assert.ok(html.indexOf('8. November 2026') < html.indexOf('Als Nächstes'));
  // Ohne naechstes Wochenende (alles gespielt) kein Kasten.
  const fertig = ansicht([spiel({ id: 'a', datum: '2026-11-08', gespielt: true, matchpunkte: '3:0' })], { jetzt });
  assert.equal(fertig.naechste, null);
  assert.doesNotMatch(renderPage({ slug: 'e', page_type: 'standard', status: 'published', title: 'E',
    content_json: { blocks: [{ type: 'ergebnisse', data: {} }] } }, { dynamicData: { ergebnisse: { ansicht: fertig } } }), /Als Nächstes/);
});
