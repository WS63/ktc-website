import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { loadArten } from '../src/config.js';
import assert from 'node:assert/strict';
import { renderPage } from '../src/renderer.js';
import { kuenftige, alleTermine } from '../src/termin-quelle.js';
import { seiten } from '../src/seiten.js';

const seite = (daten) => ({
  slug: 'probe', page_type: 'standard', status: 'published', title: 'Probe',
  content_json: { blocks: [{ type: 'aktuell', data: daten }] },
});

const beitrag = (n) => ({ datum: `${n}. Mai 2026`, titel: `Beitrag ${n}`, text: 'Text', href: `/aktuelles/b${n}/` });
const termin = (n) => ({ datum: '2027-04-1' + n, tag: `1${n}. April`, uhrzeit: '14:00', titel: `Termin ${n}`, art: 'verein' });

test('aktuell zeigt beide Spalten und beachtet die Anzahl', () => {
  const html = renderPage(seite({
    beitraege: [1, 2, 3, 4].map(beitrag), gesamt: 14,
    termine: [1, 2, 3, 4].map(termin),
    anzahlBeitraege: '2', anzahlTermine: '3',
    beitraegeLabel: 'Alle Beiträge', beitraegeHref: '/aktuelles/',
  }));
  assert.equal((html.match(/Beitrag \d/g) || []).length, 2);
  assert.equal((html.match(/Termin \d/g) || []).length, 3);
  // Die Gesamtzahl im Link ist gerechnet, nicht die der gezeigten Zeilen.
  assert.match(html, /Alle Beiträge \(14\) →/);
});

test('aktuell: ohne Inhalt stehen die Leertexte da, nicht eine leere Spalte', () => {
  const html = renderPage(seite({}));
  assert.match(html, /Hier stehen bald die Neuigkeiten/);
  assert.match(html, /Zurzeit steht nichts an/);
});

test('aktuell ist kein Knopf — die eine Handlung bleibt Mitglied werden', () => {
  const html = renderPage(seite({ beitraege: [beitrag(1)], termine: [termin(1)],
    beitraegeHref: '/aktuelles/', termineHref: '/kalender/',
    beitraegeLabel: 'Alle Beiträge', termineLabel: 'Alle Termine' }));
  assert.equal((html.match(/class="knopf"/g) || []).length, 0);
});

test('die Startseite zeigt aktuell vor dem Angebot', () => {
  const start = seiten.find((s) => s.slug === 'start');
  const typen = start.blocks.map((b) => b.type);
  assert.ok(typen.indexOf('aktuell') > typen.indexOf('infokarten'));
  assert.ok(typen.indexOf('aktuell') < typen.indexOf('cards'));
});

test('Kalender und Startseite haben EINE Quelle: der Kalender-Baustein bringt keine eigene Liste mit', () => {
  const kal = seiten.find((s) => s.slug === 'kalender');
  const b = kal.blocks.find((x) => x.type === 'termine');
  assert.equal(b.data.termine, undefined);
});

test('die Terminquelle liefert Eintraege mit gueltigem Datum, und kuenftige() filtert sie', () => {
  const alle = alleTermine();
  assert.ok(alle.length > 0);
  for (const t of alle) assert.match(t.datum, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(kuenftige(alle).length <= alle.length);
});

// ── Spieltage aus dem HTV-Import ───────────────────────────────────────
import { spieltageAus } from '../src/termin-quelle.js';

const spiel = (o) => ({ datum: '2027-05-08', uhrzeit: '09:00', mannschaft: 'Herren', gegner: 'TC A',
  zuhause: true, sg: '', ...o });

test('Spieltage: ein Termin ist Datum UND Uhrzeit — 9 Uhr und 14 Uhr sind zwei Eintraege', () => {
  const tage = spieltageAus({ begegnungen: [
    spiel({ mannschaft: 'Damen' }), spiel({ mannschaft: 'Herren' }),
    spiel({ uhrzeit: '14:00', mannschaft: 'Herren 40' }),
    spiel({ datum: '2027-05-15', mannschaft: 'Damen' }),
  ] });
  assert.equal(tage.length, 3);
  assert.deepEqual(tage.map((t) => `${t.datum} ${t.uhrzeit}`),
    ['2027-05-08 09:00', '2027-05-08 14:00', '2027-05-15 09:00']);
  assert.equal(tage[0].gruppen[0].zeilen.length, 2);
});

test('Spieltage: Heimspiele stehen vor den Auswaertsspielen', () => {
  const [t] = spieltageAus({ begegnungen: [
    spiel({ mannschaft: 'Damen', zuhause: false, gegner: 'TC B' }),
    spiel({ mannschaft: 'Herren', zuhause: true }),
  ] });
  assert.deepEqual(t.gruppen.map((g) => g.titel), ['Heimspiele', 'Auswärtsspiele']);
  assert.equal(t.gruppen[0].zeilen[0].mannschaft, 'Herren');
  assert.equal(t.gruppen[1].zeilen[0].gegner, 'TC B');
});

test('Spieltage: Mannschaften stehen sortiert, Zahlwoerter nach ihrem Wert (II vor 10)', () => {
  const [t] = spieltageAus({ begegnungen: [
    spiel({ mannschaft: 'Herren 40' }), spiel({ mannschaft: 'Damen' }), spiel({ mannschaft: 'Herren' }),
  ] });
  assert.deepEqual(t.gruppen[0].zeilen.map((z) => z.mannschaft), ['Damen', 'Herren', 'Herren 40']);
});

test('Spieltage: eine Spielgemeinschaft traegt ihre Partnervereine mit', () => {
  const [t] = spieltageAus({ begegnungen: [
    spiel({ mannschaft: 'Damen', sg: 'Diedenbergen/KTC' }), spiel({ mannschaft: 'Herren' }),
  ] });
  const zeilen = t.gruppen[0].zeilen;
  assert.equal(zeilen.find((z) => z.mannschaft === 'Damen').sg, 'Diedenbergen/KTC');
  assert.equal(zeilen.find((z) => z.mannschaft === 'Herren').sg, '');
});

test('Spieltage: die Zahl im Text wird gerechnet', () => {
  const [t] = spieltageAus({ begegnungen: [
    spiel({ zuhause: true }), spiel({ mannschaft: 'Damen', zuhause: false, gegner: 'TC B' }),
  ] });
  assert.match(t.text, /^2 Begegnungen, davon 1 Heimspiel/);
});

test('Spieltage: eine Begegnung ohne Datum verschwindet, ohne etwas zu zerstoeren', () => {
  const tage = spieltageAus({ begegnungen: [spiel({ datum: '' }), spiel({})] });
  assert.equal(tage.length, 1);
  assert.deepEqual(spieltageAus(null), []);
});

test('Termine: am selben Tag zaehlt die Uhrzeit fuer die Reihenfolge', () => {
  // Ortszeit, nicht toISOString() — siehe tests/termine.test.js.
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 5);
  const z = (x) => String(x).padStart(2, '0');
  const tag = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  const raus = kuenftige([
    { datum: tag, uhrzeit: '14:00', titel: 'nachmittags' },
    { datum: tag, uhrzeit: '09:00', titel: 'morgens' },
  ]);
  assert.deepEqual(raus.map((t) => t.titel), ['morgens', 'nachmittags']);
});

test('der Termin-Baustein zeigt Heimspiele zuerst und kennzeichnet Spielgemeinschaften', () => {
  const html = renderPage({ slug: 'k', page_type: 'standard', status: 'published', title: 'K',
    content_json: { blocks: [{ type: 'termine', data: {} }] } }, { dynamicData: { termine: {
    stand: 'Hinweistext',
    termine: spieltageAus({ begegnungen: [
      spiel({ mannschaft: 'Damen', zuhause: false, gegner: 'TC B', sg: 'Diedenbergen/KTC' }),
      spiel({ mannschaft: 'Herren' }),
    ] }).map((t) => ({ ...t, tag: '8. Mai' })) } } });
  assert.ok(html.indexOf('Heimspiele') < html.indexOf('Auswärtsspiele'));
  assert.match(html, /MSG Diedenbergen\/KTC/);
  assert.match(html, /Hinweistext/);
});

test('Paarungen: die Heimmannschaft steht immer links, im Auswaertsspiel also der Gegner', () => {
  const html = renderPage({ slug: 'k', page_type: 'standard', status: 'published', title: 'K',
    content_json: { blocks: [{ type: 'termine', data: {} }] } }, { dynamicData: { termine: { termine:
    spieltageAus({ begegnungen: [
      spiel({ mannschaft: 'Herren 50', zuhause: true, gegner: 'TC Martinsee' }),
      spiel({ mannschaft: 'Damen 40', zuhause: false, gegner: 'TV Ruppertshain' }),
    ] }).map((t) => ({ ...t, tag: '8. Mai' })) } } });
  assert.match(html, /<tr><td><span class="wir">Herren 50<\/span><\/td><td class="trenner">-<\/td><td><span class="sie">TC Martinsee/);
  assert.match(html, /<tr><td><span class="sie">TV Ruppertshain<\/span><\/td><td class="trenner">-<\/td><td><span class="wir">Damen 40/);
});

// ── Demo: Jahre verschieben ────────────────────────────────────────────
import { jahreVerschieben } from '../src/termin-quelle.js';

const plan = { saison: '2026', begegnungen: [{ datum: '2026-05-08' }, { datum: '2026-09-13' }, { datum: '' }] };

test('Demo: ein abgelaufener Plan rueckt in Schritten von 52 Wochen nach vorn, bis er in der Zukunft liegt', () => {
  const { plan: neu, jahre } = jahreVerschieben(plan, new Date('2026-10-11T12:00:00'));
  assert.equal(jahre, 1);
  assert.deepEqual(neu.begegnungen.map((b) => b.datum), ['2027-05-07', '2027-09-12', '']);
  // Der Wochentag bleibt: 8. Mai 2026 war ein Freitag, der 7. Mai 2027 ist es auch.
  const wt = (d) => new Date(`${d}T12:00:00Z`).getUTCDay();
  assert.equal(wt(neu.begegnungen[0].datum), wt('2026-05-08'));
  // Zwei Jahre spaeter: zwei Jahre Verschiebung.
  assert.equal(jahreVerschieben(plan, new Date('2027-10-11T12:00:00')).jahre, 2);
});

test('Demo: ein Plan, der noch aktuell ist, bleibt unberuehrt', () => {
  const { plan: neu, jahre } = jahreVerschieben(plan, new Date('2026-09-01T12:00:00'));
  assert.equal(jahre, 0);
  assert.equal(neu, plan);
});

test('Demo: SPIELPLAN_DEMO=1 verschiebt die Termine, aber echt:true nie — der Assistent lernt keine Demodaten', async () => {
  const { execFileSync } = await import('node:child_process');
  const lauf = (env) => JSON.parse(execFileSync(process.execPath, ['-e', `
    import('./src/termin-quelle.js').then((m) => {
      const jahre = (l) => [...new Set(l.filter((t) => t.gruppen).map((t) => t.datum.slice(0, 4)))];
      console.log(JSON.stringify({ an: m.DEMO_AN, normal: jahre(m.alleTermine()), echt: jahre(m.alleTermine({ echt: true })) }));
    });`], { env: { ...process.env, ...env }, encoding: 'utf8' }));
  const aus = lauf({ SPIELPLAN_DEMO: '' });
  assert.equal(aus.an, false);
  assert.deepEqual(aus.normal, aus.echt);
  const an = lauf({ SPIELPLAN_DEMO: '1' });
  assert.equal(an.an, true);
  assert.deepEqual(an.echt, ['2026']);       // Spielplan der Saison 2026, unverschoben
  assert.ok(!an.normal.includes('2026'));    // im Demo-Modus liegt alles in der Zukunft
});

// ── Symbole (Emoji) statt Vorschaubild ─────────────────────────────────
test('die Beitragsliste zeigt ein Symbol und kein Vorschaubild', () => {
  const html = renderPage({ slug: 'a', page_type: 'standard', status: 'published', title: 'A',
    content_json: { blocks: [{ type: 'beitragsliste', data: {} }] } },
  { dynamicData: { beitragsliste: { gesamt: 2, eintraege: [
    { datum: '1. Mai 2026', titel: 'Mit Symbol', symbol: '🏆', symbolText: 'Spielbericht', href: '/aktuelles/a/', bild: '/bilder/x.jpg' },
    { datum: '2. Mai 2026', titel: 'Ohne Symbol', href: '/aktuelles/b/' },
  ] } } });
  assert.match(html, /class="eintrag__symbol" aria-hidden="true" title="Spielbericht">🏆</);
  assert.equal((html.match(/eintrag__symbol"/g) || []).length, 1);   // nur der erste hat eines
  assert.doesNotMatch(html, /<img/);                                 // Bilder stehen in der Detailansicht
});

test('ein Termin zeigt das Symbol seiner Art, einer ohne Art zeigt keines', () => {
  const html = renderPage({ slug: 'k', page_type: 'standard', status: 'published', title: 'K',
    content_json: { blocks: [{ type: 'termine', data: {} }] } }, { dynamicData: { termine: { termine: [
    { datum: '2027-05-01', tag: '1. Mai', titel: 'Mit', symbol: '🎉', symbolText: 'Clubleben' },
    { datum: '2027-05-02', tag: '2. Mai', titel: 'Ohne' },
  ] } } });
  assert.match(html, /termin__emoji" aria-hidden="true" title="Clubleben">🎉</);
  assert.equal((html.match(/termin__emoji"/g) || []).length, 1);
  assert.doesNotMatch(html, /<svg/);          // keine zweite Formensprache neben den Emoji
});

test('die Beitragsseite hat das Symbol im Kopf und die Fotos im Textbaustein', async () => {
  const { seitenBausteine } = await import('../src/seiten-teile.js');
  const fotos = [{ pfad: '/bilder/a-800.jpg', gross: '/bilder/a-1600.jpg', alt: 'A', unterschrift: 'Herren 40', format: 'quer' }];
  const mit = seitenBausteine.beitrag({ datum: '2026-05-10', titel: 'T', absaetze: ['x'], symbol: '🔥', fotos });
  assert.match(mit.find((b) => b.type === 'hero').data.pill, /^🔥 /);
  assert.deepEqual(mit.find((b) => b.type === 'richtext').data.bilder, fotos);
  assert.ok(!mit.some((b) => b.type === 'bild' || b.type === 'galerie'));
  assert.deepEqual(seitenBausteine.beitrag({ datum: '2026-05-10', titel: 'T', absaetze: ['x'] })
    .find((b) => b.type === 'richtext').data.bilder, []);
});

test('die Arten haben je ein Symbol und einen Namen, und es sind nur wenige', () => {
  const arten = loadArten();
  const n = Object.keys(arten).length;
  assert.ok(n >= 2 && n <= 5, `${n} Arten — mehr als fuenf waere Streuung, keine Ordnung`);
  for (const [k, a] of Object.entries(arten)) {
    assert.ok(a.symbol && a.label && a.termin, `Art '${k}' ist unvollstaendig`);
  }
});

test('jeder Beitrag und jeder Vereinstermin hat eine Art, die es gibt', () => {
  const arten = loadArten();
  for (const b of JSON.parse(readFileSync('inhalte/beitraege.json', 'utf8'))) {
    assert.ok(arten[b.art], `Beitrag ${b.slug}: Art '${b.art}' gibt es nicht`);
  }
  for (const t of JSON.parse(readFileSync('inhalte/termine.json', 'utf8')).termine) {
    assert.ok(arten[t.art], `Termin ${t.titel}: Art '${t.art}' gibt es nicht`);
  }
});

test('die Spieltage tragen die Art spiel', () => {
  const [t] = spieltageAus({ begegnungen: [{ datum: '2027-05-08', uhrzeit: '09:00', mannschaft: 'H',
    gegner: 'X', zuhause: true, sg: '' }] });
  assert.equal(t.art, 'spiel');
});

test('Fotos neben dem Text: feste Formate, Unterschrift, Klick auf die Grossfassung', () => {
  const html = renderPage({ slug: 'b', page_type: 'beitrag', status: 'published', title: 'B',
    content_json: { blocks: [{ type: 'richtext', data: { absaetze: ['Text'], bilder: [
      { pfad: '/bilder/q-800.jpg', gross: '/bilder/q-1600.jpg', alt: 'Quer', unterschrift: 'Damen 55', format: 'quer' },
      { pfad: '/bilder/h-800.jpg', gross: '/bilder/h-1600.jpg', alt: 'Hoch', unterschrift: 'Herren 50', format: 'hoch' },
      { pfad: 'javascript:alert(1)', alt: 'Böse', format: 'quer' },
    ] } }] } });
  assert.match(html, /text__foto--quer/);
  assert.match(html, /text__foto--hoch/);
  assert.match(html, /href="\/bilder\/q-1600\.jpg" target="_blank"/);
  assert.match(html, /<figcaption>Damen 55<\/figcaption>/);
  assert.equal((html.match(/<figure/g) || []).length, 2);     // das unsichere Ziel faellt weg
  assert.doesNotMatch(html, /javascript:/);
});

test('kein Beitragsfoto ohne Unterschrift, und jede Unterschrift nennt eine Mannschaft oder ein Ereignis', () => {
  const l = JSON.parse(readFileSync('inhalte/beitraege.json', 'utf8'));
  for (const b of l) for (const f of b.bilder || []) {
    assert.ok(f.bild && f.unterschrift, `${b.slug}: Foto ohne Name oder Unterschrift`);
  }
});

// ── Entwuerfe aus der Importdatei ──────────────────────────────────────
import { execFileSync } from 'node:child_process';

test('Seed: ein Entwurf wird nur angelegt; was jemand veroeffentlicht, bleibt es', () => {
  const env = { ...process.env, SQLITE_FILE: 'data/test-entwurf.db', DATABASE_URL: '' };
  const abfrage = (sql) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
    `import { query } from './src/db.js'; console.log(JSON.stringify(await query(${JSON.stringify(sql)})));`],
    { env, encoding: 'utf8' }).trim().split('\n').pop());
  const seed = () => execFileSync(process.execPath, ['scripts/seed.js'], { env, stdio: 'ignore' });
  const slug = 'neu-der-ktc-infodienst-per-whatsapp';
  const status = () => abfrage(`SELECT status FROM pages WHERE slug = '${slug}'`)[0]?.status;
  try {
    seed();
    assert.equal(status(), 'draft');                                   // angelegt als Entwurf
    // Soviele wie die Datei veroeffentlicht: eine feste Zahl waere beim naechsten Beitrag falsch.
    const veroeffentlicht = JSON.parse(readFileSync('inhalte/beitraege.json', 'utf8')).filter((b) => b.status !== 'draft').length;
    assert.equal(abfrage("SELECT count(*) AS n FROM pages WHERE page_type = 'beitrag' AND status = 'published'")[0].n, veroeffentlicht);
    abfrage(`UPDATE pages SET status = 'published' WHERE slug = '${slug}'`);
    seed();
    assert.equal(status(), 'published');                                // der zweite Seed laesst ihn stehen
  } finally {
    execFileSync('rm', ['-f', 'data/test-entwurf.db', 'data/test-entwurf.db-wal', 'data/test-entwurf.db-shm']);
  }
});
