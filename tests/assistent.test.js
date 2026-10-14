import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { aktualisiere } from '../src/config.js';
import { runMigrations } from '../src/db.js';
import { zerlege } from '../src/assistent/zerlegen.js';
import { finde, normalisieren } from '../src/assistent/suchen.js';

before(async () => { await runMigrations(); await aktualisiere(); });

const seite = (blocks, extra = {}) => ({
  slug: 'probe', page_type: 'standard', status: 'published',
  title: 'Probe', content_json: JSON.stringify({ blocks }), ...extra,
});

test('Zerlegen · nav, footer und Assistent kommen nicht in den Index', () => {
  // Der Assistent wuerde sonst seine eigene Begruessung indizieren — sie steht
  // auf jeder Seite und passt wortwoertlich zu jeder Frage.
  const s = zerlege(seite([
    { type: 'nav', data: { marke: 'Krifteler Tennis-Club, ein sehr langer Markentext hier' } },
    { type: 'assistent', data: { begruessung: 'Ich kenne alles, was auf dieser Website steht und helfe dir gern weiter bei allen Fragen.' } },
    { type: 'richtext', data: { titel: 'Echter Inhalt',
      absaetze: ['Dies ist ein echter Absatz mit genug Text, um in den Index zu kommen.'] } },
    { type: 'footer', data: { zeile: 'Krifteler Tennis-Club e.V., Schmelzweg 6 in Kriftel' } },
  ]));
  const alles = s.map((x) => x.text).join(' ');
  assert.ok(!alles.includes('Ich kenne alles'), 'der Assistent hat sich selbst indiziert');
  assert.ok(alles.includes('echter Absatz'));
});

test('Zerlegen · jedes Stück trägt seinen Pfad mit', () => {
  // Ohne Pfad kann die Antwort nicht auf die Quelle zeigen.
  for (const s of zerlege(seite([{ type: 'richtext', data: {
    absaetze: ['Ein Absatz, der lang genug ist, um als eigenes Stück zu zählen.'] } }]))) {
    assert.equal(s.pfad, '/probe/');
    assert.equal(s.page_slug, 'probe');
  }
});

test('Zerlegen · Beiträge liegen unter /aktuelles/', () => {
  const s = zerlege(seite([{ type: 'richtext', data: {
    absaetze: ['Ein Absatz, der lang genug ist, um als eigenes Stück zu zählen.'] } }],
    { page_type: 'beitrag', slug: 'ein-beitrag' }));
  assert.equal(s[0].pfad, '/aktuelles/ein-beitrag/');
});

test('Zerlegen · Fakten stehen als Zahl im Index, nicht als Platzhalter', () => {
  // Sonst sucht jemand nach „290 Euro" und findet {{facts.beitraege.aktiv}}.
  const s = zerlege(seite([{ type: 'richtext', data: {
    absaetze: ['Der Beitrag liegt bei {{facts.beitraege.aktiv}} Euro im Jahr für Aktive.'] } }]));
  assert.match(s[0].text, /290/);
  assert.ok(!s[0].text.includes('{{facts'));
});

test('Zerlegen · Pfade und Ziele sind keine Inhalte', () => {
  const s = zerlege(seite([{ type: 'hero', data: {
    titel: 'Ein Aufmacher mit Knopf', sub: 'Ein Untertitel, der lang genug ist für den Index.',
    ctaLabel: 'Mitglied werden', ctaHref: '/mitglied-werden/',
    bild: '/uploads/foto-abc123.jpg' } }]));
  const alles = s.map((x) => x.text).join(' ');
  assert.ok(!alles.includes('/uploads/'), 'ein Bildpfad steht im Index');
  assert.ok(!alles.includes('/mitglied-werden/'), 'ein Linkziel steht im Index');
});

test('Suchen · Umlaute und Schreibweise spielen keine Rolle', () => {
  assert.equal(normalisieren('Beiträge'), normalisieren('beitraege'));
  assert.equal(normalisieren('Plätze!'), 'plaetze');
});

test('Suchen · kurze Wörter überleben den Wortstamm', async () => {
  // „Bus" wurde zu „bu" gekürzt und fiel als zu kurz weg — die Frage nach
  // der Anfahrt fand dadurch nichts.
  const treffer = await finde('Wie komme ich mit dem Bus zu euch?', 3);
  assert.ok(treffer.length > 0, 'nichts gefunden');
  assert.ok(treffer.some((t) => t.pfad === '/kontakt/'),
    `Anfahrt nicht gefunden, stattdessen: ${treffer.map((t) => t.pfad).join(', ')}`);
});

test('Suchen · Sachfragen treffen die richtige Seite', async () => {
  const erwartet = [
    ['Was kostet eine Mitgliedschaft?', ['/', '/mitglied-werden/', '/faq/']],
    ['Wer ist der Vorsitzende?',        ['/kontakt/', '/impressum/']],
    // Seit die Mannschaftstabelle aus /sport/ auf eine eigene Seite gewandert
    // ist, ist /mannschaften/ die richtige Antwort. /sport/ bleibt gueltig:
    // dort stehen die Bereiche, von denen aus verlinkt wird.
    ['In welcher Liga spielen die Herren 50?', ['/mannschaften/', '/sport/']],
    ['Was kostet ein Spind?',           ['/mitglied-werden/']],
  ];
  for (const [frage, moegliche] of erwartet) {
    const treffer = await finde(frage, 2);
    assert.ok(treffer.length, `„${frage}": nichts gefunden`);
    assert.ok(moegliche.includes(treffer[0].pfad),
      `„${frage}": bester Treffer war ${treffer[0].pfad}, erwartet eines von ${moegliche.join(', ')}`);
  }
});

test('Suchen · eine Frage ohne Antwort liefert schwache oder keine Treffer', async () => {
  // Die wichtigste Prüfung: erfindet das System etwas, oder gibt es zu,
  // dass es nichts weiß?
  const treffer = await finde('Habt ihr eine Sauna und ein Schwimmbad?', 6);
  const stark = treffer.filter((t) => /sauna|schwimm/i.test(t.text));
  assert.equal(stark.length, 0, 'es wurde etwas zu Sauna gefunden, das es nicht gibt');
});

test('Suchen · Füllwörter allein finden nichts', async () => {
  assert.deepEqual(await finde('und oder aber'), []);
  assert.deepEqual(await finde('???'), []);
});
