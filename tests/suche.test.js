import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normal, suchtext, begriffe, trifft, beitragstext, beitraegeFiltern, termineFiltern } from '../src/suche.js';
import { renderPage } from '../src/renderer.js';

test('Gross-/Kleinschreibung und Umlaute zaehlen nicht', () => {
  assert.equal(normal('Männer Fußball ÄÖÜ'), 'maenner fussball aeoeue');
  assert.ok(trifft('Die Männer gewannen', begriffe('maenner')));
  assert.ok(trifft('Die Männer gewannen', begriffe('MÄNNER')));
  assert.ok(trifft('Fußball', begriffe('fussball')));
});

test('mehrere Woerter gelten zusammen, ein einzelner Buchstabe sucht nichts', () => {
  assert.ok(trifft('Herren 50 Heimspiel', begriffe('herren heimspiel')));
  assert.ok(!trifft('Herren 50 Auswärtsspiel', begriffe('herren heimspiel')));
  assert.deepEqual(begriffe('a'), []);
  assert.ok(!trifft('alles', begriffe('a')));
  assert.ok(!trifft('alles', begriffe('')));
});

test('der Suchtext wird bereinigt und begrenzt, auch wenn er als Liste ankommt', () => {
  assert.equal(suchtext('  zwei   Wörter '), 'zwei Wörter');
  assert.equal(suchtext(['a', 'b']), 'a');
  assert.equal(suchtext(undefined), '');
  assert.equal(suchtext('x'.repeat(500)).length, 80);
});

const beitrag = (titel, text, extra = {}) => ({ title: titel, description: '', content_json: JSON.stringify({ blocks: [
  { type: 'nav', data: { marke: 'Impressum' } }, { type: 'richtext', data: { absaetze: [text] } },
  { type: 'tabelle', data: { zeilen: [['Geheim']] } }, { type: 'footer', data: {} }] }), ...extra });

test('Beitraege: Titel und Text zaehlen, Kopfzeile, Fusszeile und Tabelle nicht', () => {
  const liste = [beitrag('Sieg', 'Die Herren 40 gewannen.'), beitrag('Fest', 'Grillen am Clubhaus.')];
  assert.deepEqual(beitraegeFiltern(liste, 'herren').map((b) => b.title), ['Sieg']);
  assert.deepEqual(beitraegeFiltern(liste, 'fest').map((b) => b.title), ['Fest']);
  assert.deepEqual(beitraegeFiltern(liste, 'impressum'), []);       // steht nur in der Kopfzeile
  assert.deepEqual(beitraegeFiltern(liste, 'geheim'), []);          // steht nur in der Tabelle
  assert.match(beitragstext(liste[0].content_json), /Herren 40/);
});

test('Links im Text werden nicht mit ihrer Adresse durchsucht', () => {
  const b = beitrag('X', 'Mehr dazu auf [der Seite](https://beispiel.de/geheimwort).');
  assert.deepEqual(beitraegeFiltern([b], 'geheimwort'), []);
  assert.equal(beitraegeFiltern([b], 'seite').length, 1);
});

test('Termine: Titel, Ort und die Mannschaften eines Spieltags werden gefunden', () => {
  const t = [
    { titel: 'Saisoneröffnung', text: 'Grillen', ort: 'Clubhaus', datum: '2027-04-17' },
    { titel: 'Spieltag', datum: '2027-05-08', gruppen: [{ titel: 'Heimspiele', zeilen: [
      { mannschaft: 'Herren 50', sg: '', gegner: 'TC Martinsee' }] }] },
  ];
  assert.equal(termineFiltern(t, 'grillen').length, 1);
  assert.equal(termineFiltern(t, 'martinsee')[0].titel, 'Spieltag');
  assert.equal(termineFiltern(t, 'herren 50').length, 1);
  assert.equal(termineFiltern(t, 'heimspiele').length, 1);
  assert.equal(termineFiltern(t, 'gibtesnicht').length, 0);
});

const seite = (blocks, extra = {}) => ({ slug: 'aktuelles', page_type: 'standard', status: 'published', title: 'A',
  content_json: { blocks }, ...extra });

test('Suchfeld: Eingabe wird maskiert, Treffer werden gezaehlt, ohne Suche kein Ergebnissatz', () => {
  const mit = renderPage(seite([{ type: 'beitragsliste', data: { suche: 'an' } }]), { dynamicData: { beitragsliste: {
    q: '"><script>x</script>', basis: '/aktuelles/', gesamt: 1, eintraege: [{ datum: '1.', titel: 'T', href: '/a/' }] } } });
  assert.doesNotMatch(mit, /<script>x<\/script>/);
  assert.match(mit, /1 Treffer für/);
  const ohne = renderPage(seite([{ type: 'beitragsliste', data: { suche: 'an' } }]), { dynamicData: { beitragsliste: {
    basis: '/aktuelles/', eintraege: [{ datum: '1.', titel: 'T', href: '/a/' }] } } });
  assert.match(ohne, /name="q"/);
  assert.doesNotMatch(ohne, /Treffer für/);
});

test('eine Suche ohne Treffer sagt es und laesst das Feld stehen', () => {
  const html = renderPage(seite([{ type: 'beitragsliste', data: { suche: 'an' } }]), { dynamicData: { beitragsliste: {
    q: 'nichts', basis: '/aktuelles/', eintraege: [] } } });
  assert.match(html, /Dazu gibt es keinen Beitrag/);
  assert.match(html, /name="q"/);
});

test('ein Suchergebnis wird nicht von Suchmaschinen aufgenommen', () => {
  const html = renderPage(seite([{ type: 'footer', data: {} }], { suche: 'tennis' }));
  assert.match(html, /noindex/);
});

test('das Suchfeld ist kein Knopf — es gibt hoechstens einen je Seite', () => {
  const html = renderPage(seite([{ type: 'beitragsliste', data: { suche: 'an' } }]), { dynamicData: { beitragsliste: {
    basis: '/aktuelles/', eintraege: [] } } });
  assert.doesNotMatch(html, /class="knopf"/);
});
