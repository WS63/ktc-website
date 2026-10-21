import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../src/renderer.js';

const seite = (daten) => ({
  slug: 'probe', page_type: 'standard', status: 'published', title: 'Probe',
  content_json: { blocks: [{ type: 'infokarten', data: daten }] },
});
const karten = [{ label: 'Erwachsene', wert: '290 €', zusatz: 'pro Jahr' }];

test('infokarten zeigen das Angebotsband nur, wenn eine Zahl dafür da ist', () => {
  const mit = renderPage(seite({ karten, grund: 'weiss', angebotWert: '225 €',
    angebotText: '**Neu dabei?** So viel zahlst du im ersten Jahr.' }));
  assert.match(mit, /class="info__angebot"/);
  assert.match(mit, />225 €</);
  assert.match(mit, /<strong>Neu dabei\?<\/strong>/);
  const ohne = renderPage(seite({ karten, grund: 'weiss' }));
  assert.doesNotMatch(ohne, /class="info__angebot"/);
});

test('die Seite Mitglied werden hat kein Angebotsband mehr: Aufmacher und Tabelle tragen den Preis für Neue, den Partnerbeitrag nennt die Tabelle', async () => {
  const { seiten } = await import('../src/seiten.js');
  const s = seiten.find((x) => x.slug === 'mitglied-werden');
  assert.equal(s.blocks.filter((b) => b.type === 'infokarten' && b.data.angebotWert).length, 0);
  const tabelle = s.blocks.find((b) => b.type === 'preise').data;
  assert.ok(tabelle.zeilen.some((z) => /Lebenspartner/.test(z.label) && /facts\.beitraege\.aktiv_partner/.test(z.wert)));
  assert.ok(tabelle.zeilen.some((z) => /Neumitglied/.test(z.label) && /neumitglied_erstes_jahr/.test(z.wert)));
});

test('infokarten zählen nur mit zaehlen: ja, und der Endwert steht immer da', () => {
  const k = [{ label: 'Mitglieder', wert: 'über 500', zusatz: 'x' }, { label: 'Plätze', wert: '7' }];
  const ja = renderPage(seite({ karten: k, zaehlen: 'ja' }));
  assert.match(ja, /data-bis="500"/);
  assert.match(ja, /data-bis="7"/);
  assert.match(ja, /<span class="nur-vorleser">über 500<\/span>/);   // fertig fuer Vorleser
  assert.match(ja, /class="info__zahl"[^>]*>500</);                  // ohne Skript steht der Endwert
  assert.match(ja, /prefers-reduced-motion/);                        // das Skript beachtet es
  const nein = renderPage(seite({ karten: k }));
  assert.doesNotMatch(nein, /data-bis/);
  assert.doesNotMatch(nein, /IntersectionObserver/);
});

test('die Beitragskarten zählen nicht hoch, die Startseite hat keine Eckdaten mehr', async () => {
  // Das Hochzählen kann der Baustein weiter (siehe oben); die Startseite zeigt ihre Zahlen im Aufmacher.
  const { seiten } = await import('../src/seiten.js');
  assert.equal(seiten.find((x) => x.slug === 'start').blocks.filter((b) => b.type === 'infokarten').length, 0);
  const mw = seiten.find((x) => x.slug === 'mitglied-werden').blocks.filter((b) => b.type === 'infokarten');
  assert.ok(mw.length > 0 && mw.every((b) => b.data.zaehlen !== 'ja'));
});

// ── Kontaktseite: Formular zuerst, zweispaltig ─────────────────────────
const formularSeite = (daten) => ({
  slug: 'probe', page_type: 'standard', status: 'published', title: 'Probe',
  content_json: { blocks: [{ type: 'formular', data: { name: 'anfrage', titel: 'Schreib uns', felder: [], ...daten } }] },
});

test('formular: zweispaltig zeigt die Adresse neben dem Formular, einfach bleibt wie es war', () => {
  const zwei = renderPage(formularSeite({ aufbau: 'zweispaltig', grund: 'ruhig', mailLabel: 'Oder per E-Mail', mailAdresse: 'info@x.de' }));
  assert.match(zwei, /class="formular__zwei"/);
  assert.match(zwei, /<a class="formular__mail" href="mailto:info@x.de">info@x.de<\/a>/);
  assert.match(zwei, /section--ruhig/);
  assert.equal((zwei.match(/<form/g) || []).length, 1);
  const einfach = renderPage(formularSeite({}));
  assert.doesNotMatch(einfach, /class="formular__zwei"/);   // im CSS steht der Name immer, im Markup nur zweispaltig
  assert.equal((einfach.match(/<form/g) || []).length, 1);
});

test('formular: der leise Knopf ist nur auf Wunsch leise', () => {
  assert.match(renderPage(formularSeite({ knopfStil: 'leise' })), /<button type="submit" class="formular__knopf--leise">/);
  assert.doesNotMatch(renderPage(formularSeite({})), /formular__knopf--leise">/);
});

test('Kontaktseite: erst das Formular, dann der Vorstand mit Sprungmarke; Mitglied werden hat nur einen gelben Knopf', async () => {
  const { seiten } = await import('../src/seiten.js');
  const k = seiten.find((x) => x.slug === 'kontakt').blocks.map((b) => b.type);
  assert.ok(k.indexOf('formular') < k.indexOf('personen'));
  assert.equal(k.filter((t) => t === 'formular').length, 1);
  const kb = seiten.find((x) => x.slug === 'kontakt').blocks;
  assert.equal(kb.find((b) => b.type === 'personen').data.anker, 'vorstand');
  assert.equal(kb.find((b) => b.type === 'hero').data.zweitHref, '#vorstand');
  const mw = seiten.find((x) => x.slug === 'mitglied-werden').blocks.find((b) => b.type === 'formular');
  assert.equal(mw.data.knopfStil, 'leise');
});

test('Mitglied werden: die Voraussetzung für den Neumitglieder-Preis steht im Aufmacher und an der Tabellenzeile, sonst nirgends', async () => {
  const { seiten } = await import('../src/seiten.js');
  const mw = seiten.find((x) => x.slug === 'mitglied-werden');
  assert.equal((JSON.stringify(mw.blocks).match(/neumitglied_voraussetzung/g) || []).length, 2);
});

test('Mitglied werden: ein gelber Knopf im Aufmacher, unter der Tabelle nur der Hinweis zur Anmeldung', async () => {
  const { seiten } = await import('../src/seiten.js');
  const mw = seiten.find((x) => x.slug === 'mitglied-werden');
  const tabelle = mw.blocks.find((b) => b.type === 'preise').data;
  assert.equal(tabelle.knopfLabel, undefined);
  assert.match(tabelle.knopfHinweis, /\[eBuSy\]\(\{\{facts\.links\.buchung\}\}\)/);
  const h = renderPage({ slug: mw.slug, page_type: mw.page_type, status: 'published', title: mw.title, content_json: { blocks: mw.blocks } });
  assert.equal((h.match(/class="knopf"/g) || []).length, 1);
});

test('formular: kompakt setzt Frage links und das Formular rechts, Name und E-Mail nebeneinander; Mitglied werden nutzt es', async () => {
  const h = renderPage(formularSeite({ aufbau: 'kompakt', grund: 'ruhig',
    felder: [{ name: 'name', label: 'Name', typ: 'text' }, { name: 'email', label: 'E-Mail', typ: 'email' },
      { name: 'nachricht', label: 'Nachricht', typ: 'mehrzeilig' }] }));
  assert.match(h, /class="section section--ruhig section--kompakt"/);
  assert.match(h, /<div class="formular__kompakt">/);
  assert.match(h, /<form class="formular formular--offen formular--kompakt"/);
  assert.match(h, /<div class="feld feld--breit">\s*<label[^>]*>Nachricht/, 'nur die Nachricht läuft über die ganze Breite');
  assert.equal((h.match(/<form/g) || []).length, 1);
  const { seiten } = await import('../src/seiten.js');
  const mw = seiten.find((x) => x.slug === 'mitglied-werden').blocks.find((b) => b.type === 'formular');
  assert.equal(mw.data.aufbau, 'kompakt');
  assert.equal(mw.data.knopfStil, 'leise');
});
