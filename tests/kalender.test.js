import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wochenendTermine, tagText, monatText, wochentagText, kuenftige, vergangene, spieltageAus } from '../src/termin-quelle.js';

const b = (o) => ({ mannschaft: 'Herren', gegner: 'TC A', zuhause: true, datum: '2026-05-09', uhrzeit: '14:00', ...o });

test('tagText: kurz und mit Jahr, auch ueber mehrere Tage', () => {
  assert.equal(tagText('2027-04-17'), '17. Apr ’27');
  assert.equal(tagText('2026-05-09', '2026-05-10'), '9.–10. Mai ’26');
  assert.equal(tagText('2026-05-30', '2026-06-01'), '30. Mai–1. Jun ’26');
  assert.equal(tagText('2026-12-30', '2027-01-02'), '30. Dez ’26–2. Jan ’27');
  assert.equal(tagText('kaputt'), 'kaputt');
});

test('Monat und Wochentag als fertiger Text', () => {
  assert.equal(monatText('2026-10-24'), 'Oktober ’26');
  assert.equal(wochentagText('2026-10-24'), 'Sa');
  assert.equal(wochentagText('2026-05-08', '2026-05-10'), 'Fr–So');
});

test('Kalender: ein Eintrag je Spielwochenende, mit gerechneter Zahl und Link zu den Ergebnissen', () => {
  const plan = { begegnungen: [
    b({ datum: '2026-05-08' }), b({ datum: '2026-05-09' }), b({ datum: '2026-05-09', zuhause: false }),
    b({ datum: '2026-05-10', zuhause: false }), b({ datum: '2026-05-16' }) ] };
  const w = wochenendTermine(plan);
  assert.equal(w.length, 2);
  assert.equal(w[0].titel, 'HTV-Medenspieltag');
  assert.equal(w[0].bis, '2026-05-10');
  assert.match(w[0].text, /^4 Begegnungen, davon 2 Heimspiele/);
  assert.equal(w[0].mehr, '/ergebnisse/?we=2026-05-08');
  assert.match(w[1].text, /^1 Begegnung, davon 1 Heimspiel/);
});

test('Der Assistent behaelt die Einzelspiele: spieltageAus buendelt nicht je Wochenende', () => {
  const plan = { begegnungen: [b({ uhrzeit: '09:00' }), b({ uhrzeit: '14:00' })] };
  assert.equal(spieltageAus(plan).length, 2);
  assert.equal(wochenendTermine(plan).length, 1);
});

test('kuenftige und vergangene teilen die Termine sauber, mehrtaegige gelten bis zum letzten Tag', () => {
  const tag = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const liste = [{ datum: tag(-10), titel: 'alt' }, { datum: tag(-1), bis: tag(1), titel: 'laeuft' },
    { datum: tag(5), titel: 'neu' }, { datum: 'kaputt', titel: 'ohne Datum' }];
  assert.deepEqual(kuenftige(liste).map((t) => t.titel).sort(), ['laeuft', 'neu', 'ohne Datum']);
  assert.deepEqual(vergangene(liste).map((t) => t.titel), ['alt']);
});

test('vergangene: das juengste zuerst', () => {
  const v = vergangene([{ datum: '2020-01-01', titel: 'a' }, { datum: '2021-01-01', titel: 'b' }]);
  assert.deepEqual(v.map((t) => t.titel), ['b', 'a']);
});

import { renderPage } from '../src/renderer.js';

const kalenderSeite = (dyn) => renderPage({ slug: 'kalender', page_type: 'standard', status: 'published', title: 'K',
  content_json: { blocks: [{ type: 'termine', data: { suche: 'an' } }] } }, { dynamicData: { termine: dyn } });
const kategorien = [{ key: 'spiel', label: 'Sport', symbol: 'S' }, { key: 'club', label: 'Clubleben', symbol: 'C' }];
const term = (o) => ({ datum: '2026-10-24', tag: '24. Okt ’26', wochentag: 'Sa', monat: 'Oktober ’26', uhrzeit: '09:30', art: 'club', titel: 'Aktionstag', ...o });

test('Kalender: Monatsüberschrift einmal je Monat, Wochentag, Uhrzeit und Mehr-Link', () => {
  const h = kalenderSeite({ basis: '/kalender/', kategorien, art: '', zeit: 'kommend', termine: [
    term({ mehr: '/aktuelles/x/', mehrLabel: 'Aufgaben ansehen' }), term({ titel: 'Zweiter' }), term({ monat: 'November ’26', titel: 'Dritter' })] });
  assert.equal((h.match(/class="termine__monat"/g) || []).length, 2);
  assert.match(h, /Sa · 09:30 Uhr/);
  assert.match(h, /<a class="termin__mehr" href="\/aktuelles\/x\/">Aufgaben ansehen →<\/a>/);
});

test('Kalender: die Auswahl besteht aus Adressen, die gewählte ist markiert, der Suchtext bleibt', () => {
  const h = kalenderSeite({ basis: '/kalender/', kategorien, art: 'club', zeit: 'vergangen', q: 'mai', termine: [term({})] });
  assert.match(h, /href="\/kalender\/\?art=club&amp;q=mai"[^>]*>Kommend</);            // zurueck zu kommend, Art und Suche bleiben
  assert.match(h, /href="\/kalender\/\?art=club&amp;zeit=vergangen&amp;q=mai" aria-current="true">Vergangen</);
  assert.match(h, /href="\/kalender\/\?zeit=vergangen&amp;q=mai">Alle</);
  assert.match(h, /aria-current="true">C Clubleben</);
});

test('Kalender: ohne Treffer sagt die Seite, was zu tun ist', () => {
  const h = kalenderSeite({ basis: '/kalender/', kategorien, art: 'club', zeit: 'kommend', termine: [] });
  assert.match(h, /Probier eine andere Auswahl/);
});

import { sgArt } from '../src/ergebnisse.js';

test('sgArt: der KTC im Namen zuerst heisst vom KTC gemeldet, sonst Partnerverein, ohne sg keine MSG', () => {
  assert.equal(sgArt('KTC/Diedenb./Kelkh.'), 'ktc');
  assert.equal(sgArt('KTC/Diedenbergen'), 'ktc');
  assert.equal(sgArt('Diedenbergen/KTC'), 'partner');
  assert.equal(sgArt('Diedenb./KTC/Kelkh.'), 'partner');
  assert.equal(sgArt(''), '');
});

test('Ergebnisliste: MSG in zwei Ausführungen mit Legende', () => {
  const ein = (o) => ({ tag: '2026-05-09', wochentag: 'Samstag', uhrzeit: '14:00', mannschaft: 'M', sg: '', sgart: '', gegner: 'G',
    zuhause: true, status: 'kommt', ausgang: '', matchpunkte: '', bericht: '', ...o });
  const a = { leer: false, fenster: { text: '9. Mai', jahr: 2026 }, bilanz: { begegnungen: 0 }, offen: 0, zuletzt: [], vorher: null, nachher: null,
    eintraege: [ein({ mannschaft: 'Damen', sg: 'Diedenbergen/KTC', sgart: 'partner' }), ein({ mannschaft: 'Gemischt U12', sg: 'KTC/Diedenbergen', sgart: 'ktc' })] };
  const h = renderPage({ slug: 'e', page_type: 'standard', status: 'published', title: 'E',
    content_json: { blocks: [{ type: 'ergebnisse', data: {} }] } }, { dynamicData: { ergebnisse: { ansicht: a, stand: '' } } });
  assert.match(h, /class="erg__msg erg__msg--partner"[^>]*title="Spielgemeinschaft, gemeldet von einem Partnerverein"/);
  assert.match(h, /class="erg__msg"\s+title="Spielgemeinschaft, gemeldet vom KTC"/);
  assert.match(h, /class="erg__legende"/);
});

// ── Zuklappen und kompakte Spielwochenenden ──────────────────────────────
import hero from '../src/blocks/hero.js';

const liste = (dyn, data = {}) => renderPage({ slug: 'kalender', page_type: 'standard', status: 'published', title: 'K',
  content_json: { blocks: [{ type: 'termine', data: { zuklappen: 'an', ...data } }] } },
{ dynamicData: { termine: { basis: '/kalender/', kategorien, art: '', zeit: 'kommend', ...dyn } } });

test('Kommend: die naechsten zwei Monate offen, spaetere zu und mit Zahl', () => {
  const h = liste({ termine: [term({ monat: 'Oktober ’26' }), term({ monat: 'November ’26' }),
    term({ monat: 'Dezember ’26' }), term({ monat: 'Dezember ’26', titel: 'Zweiter' })] });
  const gruppen = h.match(/<details class="termine__gruppe"( open)?>/g);
  assert.deepEqual(gruppen.map((g) => g.includes(' open')), [true, true, false]);
  assert.match(h, /Dezember ’26<\/h3>\s*<span class="termine__zahl">2 Termine<\/span>/);
});

test('Vergangen: nur offen, was die Route als frisch markiert', () => {
  const h = liste({ zeit: 'vergangen', termine: [term({ monat: 'Oktober ’26', frisch: true }),
    term({ monat: 'September ’26' }), term({ monat: 'August ’26' })] });
  const gruppen = h.match(/<details class="termine__gruppe"( open)?>/g);
  assert.deepEqual(gruppen.map((g) => g.includes(' open')), [true, false, false]);
});

test('Ohne zuklappen bleibt die Liste, wie sie war', () => {
  const h = liste({ termine: [term({}), term({ monat: 'November ’26' })] }, { zuklappen: 'aus' });
  assert.doesNotMatch(h, /<details class="termine__gruppe"/);
  assert.equal((h.match(/class="termine__monat"/g) || []).length, 2);
});

test('Spielwochenende kompakt: der Titel ist der Link, keine Extrazeile', () => {
  const h = liste({ termine: [term({ art: 'spiel', kompakt: true, titel: 'HTV-Medenspieltag',
    text: '26 Begegnungen, davon 11 Heimspiele auf unserer Anlage.', mehr: '/ergebnisse/?we=2027-05-07' })] });
  assert.match(h, /<article class="termin termin--kompakt">/);
  assert.match(h, /<a class="termin__link" href="\/ergebnisse\/\?we=2027-05-07">HTV-Medenspieltag<\/a><span class="termin__kurz"> · 26 Begegnungen/);
  assert.doesNotMatch(h, /class="termin__mehr"/);
});

test('Wochenendtermine sind als kompakt markiert', () => {
  const [w] = wochenendTermine({ begegnungen: [b({})] });
  assert.equal(w.kompakt, true);
});

test('Der leise Knopf hat auf Fotos eine eigene Flaeche, nicht nur eine Kontur', () => {
  const regel = hero.css.match(/\.hero--bild \.knopf--leise \{[^}]*\}/)?.[0] || '';
  assert.match(regel, /background: rgba\(30,30,24,\.45\)/);
  assert.match(regel, /backdrop-filter/);
});
