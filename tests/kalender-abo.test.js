import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kalenderText, vereinsEreignisse, mannschaftsEreignisse, heimspielEreignisse,
  slugVon, falten, begegnungsSchluessel, mannschaftenImPlan } from '../src/kalender-abo.js';
import { schluessel } from '../src/spielstand.js';
import { renderPage } from '../src/renderer.js';
import { seiten } from '../src/seiten.js';

const jetzt = new Date('2026-10-19T08:00:00Z');
const b = (o) => ({ mannschaft: 'Herren 40', gegner: 'TC Liederbach', heim: 'TC Kriftel', gast: 'TC Liederbach',
  gruppe: '42', lauf: 1, zuhause: true, sg: '', datum: '2026-05-09', uhrzeit: '14:00', gespielt: false, matchpunkte: '', ...o });
const ics = (ereignisse) => kalenderText({ name: 'KTC · Test', ereignisse, jetzt });
const zeilen = (text) => text.split('\r\n');
/** Die Fortsetzungszeilen wieder anhaengen, wie ein Kalender es tut. */
const entfaltet = (text) => text.replace(/\r\n /g, '');

test('Format · CRLF, Rahmen, Zeitzone, und keine Zeile ueber 75 Byte', () => {
  const t = ics(vereinsEreignisse([{ datum: '2026-10-24', uhrzeit: '09:30', titel: 'Aktionstag',
    text: 'Hecken schneiden, Plätze und Rinnen reinigen, Werkstatt und Räume aufräumen; danach Mittagessen für alle Helferinnen und Helfer.' }]));
  assert.match(t, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
  assert.match(t, /END:VCALENDAR\r\n$/);
  assert.doesNotMatch(t.replace(/\r\n/g, ''), /\n/, 'kein nacktes LF');
  assert.match(t, /BEGIN:VTIMEZONE\r\nTZID:Europe\/Berlin/);
  for (const z of zeilen(t)) assert.ok(Buffer.byteLength(z) <= 75, `zu lang: ${z}`);
  // Maskiert: Komma und Semikolon im Text
  assert.match(entfaltet(t), /DESCRIPTION:Hecken schneiden\\, Plätze .*aufräumen\\; danach/);
});

test('Falten trennt nie mitten in einem Umlaut', () => {
  const lang = `SUMMARY:${'ü'.repeat(60)}`;
  const gefaltet = falten(lang);
  for (const z of gefaltet.split('\r\n')) {
    assert.ok(Buffer.byteLength(z) <= 75);
    assert.doesNotMatch(z, /�/);
  }
  assert.equal(gefaltet.replace(/\r\n /g, ''), lang);
});

test('Vereinstermine · keine Standarddauer: es gilt, was im Termin steht', () => {
  const t = entfaltet(ics(vereinsEreignisse([
    { datum: '2026-03-16', titel: 'Mitgliederversammlung' },                                   // nur Tag
    { datum: '2026-04-18', uhrzeit: '09:30', titel: 'Putztag' },                               // nur Start
    { datum: '2026-06-12', uhrzeit: '10:00', ende: '16:00', titel: 'Tag der offenen Tür' },    // Spanne
    { datum: '2026-07-20', bis: '2026-07-24', uhrzeit: '09:00', ende: '13:00', titel: 'Sommercamp' }, // taeglich
    { datum: '2026-05-14', bis: '2026-05-16', titel: 'Turnierwochenende' },                    // mehrtaegig ganztags
  ])));
  const ev = (titel) => t.split('BEGIN:VEVENT').find((e) => e.includes(`SUMMARY:${titel}`));

  assert.match(ev('Mitgliederversammlung'), /DTSTART;VALUE=DATE:20260316\r\nDTEND;VALUE=DATE:20260317/);
  assert.match(ev('Putztag'), /DTSTART;TZID=Europe\/Berlin:20260418T093000/);
  assert.doesNotMatch(ev('Putztag'), /DTEND|RRULE/, 'nur Startzeit, keine erfundene Dauer');
  assert.match(ev('Tag der offenen Tür'), /DTEND;TZID=Europe\/Berlin:20260612T160000/);
  assert.match(ev('Sommercamp'), /DTSTART;TZID=Europe\/Berlin:20260720T090000\r\nDTEND;TZID=Europe\/Berlin:20260720T130000\r\nRRULE:FREQ=DAILY;UNTIL=20260724T235959Z/);
  assert.match(ev('Turnierwochenende'), /DTSTART;VALUE=DATE:20260514\r\nDTEND;VALUE=DATE:20260517/);
});

test('Vereinstermine · ein Ende vor dem Anfang liegt am naechsten Tag, Mehr-Link wird absolut', () => {
  const [e] = vereinsEreignisse([{ datum: '2026-12-31', uhrzeit: '20:00', ende: '01:00', titel: 'Silvester',
    mehr: '/aktuelles/silvester/', mehrLabel: 'Alles zum Abend' }], { basis: 'https://ktc.example' });
  assert.deepEqual(e.ende, { datum: '2027-01-01', uhrzeit: '01:00' });
  assert.equal(e.url, 'https://ktc.example/aktuelles/silvester/');
  assert.match(e.text, /Alles zum Abend: https:\/\/ktc\.example\/aktuelles\/silvester\//);
});

test('Mannschaft · Dauer aus den Fakten, ueber Mitternacht gerechnet, ohne Fakt nur Start', () => {
  const [e] = mannschaftsEreignisse({ saison: '2026', begegnungen: [b({ uhrzeit: '20:00' })] }, 'Herren 40', { stunden: 5 });
  assert.deepEqual(e.ende, { datum: '2026-05-10', uhrzeit: '01:00' });
  const [ohne] = mannschaftsEreignisse({ saison: '2026', begegnungen: [b({})] }, 'Herren 40', { stunden: null });
  assert.equal(ohne.ende, undefined);
  const [ganztags] = mannschaftsEreignisse({ saison: '2026', begegnungen: [b({ uhrzeit: '' })] }, 'Herren 40', { stunden: 5 });
  assert.equal(ganztags.uhrzeit, undefined);
});

test('Mannschaft · Titel vor und nach dem Spiel, aus unserer Sicht', () => {
  const plan = { saison: '2026', begegnungen: [
    b({}), b({ zuhause: false, heim: 'TC Liederbach', gast: 'TC Kriftel', lauf: 2 }),
    b({ gespielt: true, matchpunkte: '2:4', zuhause: false, heim: 'TC Liederbach', gast: 'TC Kriftel', lauf: 3 }),
    b({ mannschaft: 'Damen' })] };
  const titel = mannschaftsEreignisse(plan, 'Herren 40', { stunden: 5 }).map((e) => e.titel);
  assert.deepEqual(titel, ['Herren 40 · Heimspiel gegen TC Liederbach',
    'Herren 40 · Auswärts bei TC Liederbach', 'Herren 40 · 4:2 gegen TC Liederbach']);
});

test('Mannschaft · dieselbe ID nach einer Verlegung, gleich in Datenbank und Datei', () => {
  const vorher = mannschaftsEreignisse({ saison: '2026', begegnungen: [b({})] }, 'Herren 40')[0].uid;
  const nachher = mannschaftsEreignisse({ saison: '2026', begegnungen: [b({ datum: '2026-06-20', uhrzeit: '10:00' })] }, 'Herren 40')[0].uid;
  assert.equal(vorher, nachher);
  const ausDb = mannschaftsEreignisse({ saison: '2026', begegnungen: [b({ id: schluessel('2026', b({})) })] }, 'Herren 40')[0].uid;
  assert.equal(ausDb, vorher);
  assert.equal(begegnungsSchluessel('2026', b({})), schluessel('2026', b({})));
});

test('Ort · nur bei Spielen auf unserer Anlage, nicht beim Heimspiel einer Partner-Spielgemeinschaft', () => {
  const plan = { saison: '2026', begegnungen: [b({}), b({ lauf: 2, zuhause: false }),
    b({ lauf: 3, sg: 'Diedenbergen/KTC' })] };
  const orte = mannschaftsEreignisse(plan, 'Herren 40', { anschrift: 'Schmelzweg 6' }).map((e) => e.ort);
  assert.deepEqual(orte, ['Schmelzweg 6', '', '']);
});

test('Heimspiele · je Anwurfzeit gebuendelt, Partner-SG und Auswaerts nicht dabei', () => {
  const plan = { saison: '2026', begegnungen: [
    b({ mannschaft: 'Herren 40' }), b({ mannschaft: 'Damen', gegner: 'TC X' }),
    b({ mannschaft: 'Herren', uhrzeit: '09:00' }),
    b({ mannschaft: 'Junioren U15', sg: 'Diedenbergen/KTC' }),
    b({ mannschaft: 'Herren 50', zuhause: false })] };
  const e = heimspielEreignisse(plan, { stunden: 5, anschrift: 'Schmelzweg 6' });
  assert.deepEqual(e.map((x) => x.titel), ['Heimspiel: Herren', 'Heimspiel: Damen, Herren 40']);
  assert.match(e[1].text, /Damen gegen TC X\nHerren 40 gegen TC Liederbach/);
});

test('Adressen der Abos: aus dem Mannschaftsnamen, eindeutig fuer alle Teams', () => {
  assert.equal(slugVon('Herren 40 II'), 'herren-40-ii');
  assert.equal(slugVon('Juniorinnen U15 III'), 'juniorinnen-u15-iii');
  const { mannschaften } = { mannschaften: [...new Set(seiten.find((s) => s.slug === 'mannschaften')
    .blocks.filter((x) => x.type === 'tabelle').flatMap((t) => t.data.zeilen.map((z) => z[0])))] };
  const slugs = mannschaften.map(slugVon);
  assert.equal(new Set(slugs).size, slugs.length, 'zwei Mannschaften mit derselben Abo-Adresse');
});

test('Demo-Modus · das Abo bekommt die echten Termine, nie die verschobenen', async () => {
  // Eigener Prozess: der Schalter wird beim Laden von termin-quelle.js gelesen.
  const { execFileSync } = await import('node:child_process');
  const lauf = (env) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `
    const m = await import('./src/termin-quelle.js');
    const erst = (p) => (p?.begegnungen || []).map((x) => x.datum).filter(Boolean).sort()[0] || '';
    console.log(JSON.stringify({ echt: erst(m.echterSpielplan()), alle: m.alleTermine().filter((t) => t.art === 'spiel').map((t) => t.datum).sort()[0] || '' }));
  `], { env: { ...process.env, ...env, DATABASE_URL: '' }, encoding: 'utf8' }).trim().split('\n').pop());
  const normal = lauf({ SPIELPLAN_DEMO: '' });
  const demo = lauf({ SPIELPLAN_DEMO: '1' });
  assert.ok(normal.echt, 'kein Spielplan gefunden');
  assert.equal(demo.echt, normal.echt, 'im Demo-Modus verschoben');
  if (demo.alle !== normal.alle) assert.ok(demo.alle > demo.echt, 'Gegenprobe: die Ansicht IST verschoben');
});

const alsHtml = (slug) => {
  const s = seiten.find((x) => x.slug === slug);
  return renderPage({ ...s, status: 'published', content_json: { blocks: s.blocks } });
};

test('Kalenderseite · Weg zum Abo im Aufmacher, keine Suche, kein gelber Knopf', () => {
  const h = alsHtml('kalender');
  assert.match(h, /<a class="knopf knopf--leise" href="#abo"[^>]*>Kalender abonnieren<\/a>/);
  assert.match(h, /<section class="section section--ruhig abo" id="abo">/);
  assert.doesNotMatch(h, /role="search"/, 'die Kalenderseite hat keine Suche mehr');
  assert.equal((h.match(/class="knopf"/g) || []).length, 0);
});

test('Abo-Baustein · Mannschaft per Formular, nach Erwachsenen und Jugend gruppiert', () => {
  const h = alsHtml('kalender');
  assert.match(h, /<form class="abo__form" method="get" action="\/kalender\/abo\/">/);
  assert.match(h, /<select id="abo-mannschaft" name="mannschaft" required>/);
  assert.match(h, /<optgroup label="Erwachsene">.*<option value="herren-40">Herren 40<\/option>/s);
  assert.match(h, /<optgroup label="Jugend">.*<option value="junioren-u15-ii">Junioren U15 II<\/option>/s);
  assert.match(h, /name="weg" value="apple"/);
  assert.match(h, /name="weg" value="google"/);
  // Die festen Abos als Links, beide Wege
  assert.match(h, /href="\/kalender\/abo\/heimspiele\/\?google=1"/);
  assert.match(h, /href="\/kalender\/abo\/club\/"/);
});

test('Mannschaftsseite · ruhige Tabelle ohne Abo-Spalte, ein Hinweis aufs Abo', () => {
  const h = alsHtml('mannschaften');
  assert.doesNotMatch(h, /kalender\/abo\//);
  assert.match(h, /href="\/kalender\/#abo">Kalender abonnieren<\/a>/);
});

test('Saison · ein Jugend-Abo zeigt nur seine Saison, ein Erwachsenen-Abo alle', () => {
  const plan = { saison: '2027', begegnungen: [
    b({ mannschaft: 'Junioren U15', saison: '2026', datum: '2026-05-09' }),
    b({ mannschaft: 'Junioren U15', saison: '2027', datum: '2027-05-08', lauf: 2 }),
    b({ mannschaft: 'Junioren U15', datum: '2027-05-15', lauf: 3 }),     // ohne eigene Saison: die des Plans
  ] };
  assert.equal(mannschaftsEreignisse(plan, 'Junioren U15', { saison: '2026' }).length, 1);
  assert.equal(mannschaftsEreignisse(plan, 'Junioren U15', { saison: '2027' }).length, 2);
  assert.equal(mannschaftsEreignisse(plan, 'Junioren U15').length, 3);
});

test('Saison · auch aufgeloeste Mannschaften stehen im Spielstand', () => {
  const plan = { begegnungen: [b({ mannschaft: 'Herren 40 II' }), b({ mannschaft: 'Damen' }), b({ mannschaft: 'Damen' })] };
  assert.deepEqual(mannschaftenImPlan(plan), ['Herren 40 II', 'Damen']);
});
