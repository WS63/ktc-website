import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from '../src/renderer.js';
import { aufhaenger, ohneBeitragsDoppel } from '../src/routes/public.js';
import { alleTermine } from '../src/termin-quelle.js';

const seite = (blocks) => ({ slug: 'p', page_type: 'home', status: 'published', title: 'P', content_json: { blocks } });

test('Aufhänger: der erste Satz, sonst am Wortende gekürzt, nie mitten im Wort', () => {
  assert.equal(aufhaenger('Am Samstag findet der Aktionstag statt. Damit unsere Anlage auch nach dem Winter schön bleibt, bitten wir um Hilfe.'),
    'Am Samstag findet der Aktionstag statt.');
  const lang = 'Ein sehr langer Satz ohne Punkt der immer weiter geht und geht und geht und kein Ende findet bis er am Ende doch irgendwann aufhören muss weil er sonst nie aufhört und niemand ihn lesen will';
  const k = aufhaenger(lang);
  assert.ok(k.endsWith('…') && k.length <= 152);
  assert.ok(lang.includes(k.slice(0, -1)) && /\s/.test(lang[k.length - 1] ?? ' '), 'endet an einer Wortgrenze');
  assert.equal(aufhaenger('Kurz und gut…'), 'Kurz und gut');
  assert.equal(aufhaenger(''), '');
  // Ordnungszahlen und Abkürzungen sind kein Satzende.
  assert.equal(aufhaenger('Am Samstag, den 24. Oktober 2026, findet von 9:30 Uhr bis ca. 13:00 Uhr unser Aktionstag statt. Damit alles klappt, helfen alle mit.'),
    'Am Samstag, den 24. Oktober 2026, findet von 9:30 Uhr bis ca. 13:00 Uhr unser Aktionstag statt.');
});

test('Ein Termin, der auf einen gezeigten Beitrag verweist, steht nicht doppelt daneben', () => {
  const termine = [{ titel: 'Aktionstag', mehr: '/aktuelles/aktionstag/' }, { titel: 'Putztag', mehr: '/aktuelles/anderer/' }, { titel: 'Ohne Link' }];
  const r = ohneBeitragsDoppel(termine, [{ href: '/aktuelles/aktionstag/' }]);
  assert.deepEqual(r.map((t) => t.titel), ['Putztag', 'Ohne Link']);
  assert.equal(ohneBeitragsDoppel(termine, []).length, 3);
});

test('Beispieltermine tragen das Zeichen „Beispiel“, kommen nicht zu Lisa und nicht in die Abos', () => {
  const html = renderPage(seite([{ type: 'aktuell', data: { termine: [
    { titel: 'Echt', tag: '1. Mai', datum: '2027-05-01' }, { titel: 'Probe', tag: '2. Mai', datum: '2027-05-02', beispiel: true }] } }]));
  assert.match(html, /Probe <span class="aktuell__beispiel">Beispiel<\/span>/);
  assert.doesNotMatch(html, /Echt <span class="aktuell__beispiel"/);
  assert.ok(alleTermine({ echt: true }).every((t) => !t.beispiel));
  assert.ok(alleTermine().some((t) => t.beispiel), 'die Seite selbst zeigt sie (mit Zeichen)');
});

test('Livegang-Sperre: sobald die Seite für Suchmaschinen frei ist, darf kein Beispieltermin mehr drinstehen', () => {
  const site = JSON.parse(readFileSync('config/site.json', 'utf8'));
  const termine = JSON.parse(readFileSync('inhalte/termine.json', 'utf8')).termine;
  const beispiele = termine.filter((t) => t.beispiel);
  if (site.suchmaschinen === true) assert.equal(beispiele.length, 0, `Beispieltermine vor dem Livegang entfernen: ${beispiele.map((t) => t.titel).join(', ')}`);
  else assert.ok(true);
});

test('Menü: „Mitglied werden“ steht als Pille am Ende, ohne passendes Ziel bleibt alles beim Alten', () => {
  const baum = [{ label: 'Club', href: '/' }, { label: 'Mitglied werden', href: '/mitglied-werden/' }, { label: 'Kontakt', href: '/kontakt/' }];
  const h = renderPage(seite([{ type: 'nav', data: { marke: 'X', baum } }]));
  const menue = h.slice(h.indexOf('<nav class="kopf__menue"'), h.indexOf('</nav>', h.indexOf('<nav class="kopf__menue"')));
  const reihe = [...menue.matchAll(/<a([^>]*)>([^<]*)<\/a>/g)].map((m) => `${m[2]}${m[1].includes('kopf__pille') ? '*' : ''}`);
  assert.deepEqual(reihe, ['Club', 'Kontakt', 'Mitglied werden*']);
  const ohne = renderPage(seite([{ type: 'nav', data: { marke: 'X', baum, pilleHref: '' } }]));
  assert.doesNotMatch(ohne.slice(ohne.indexOf('<nav class="kopf__menue"')), /class="kopf__pille" href/);
});

test('Sport im Aufmacher: „Vom ersten Schläger bis zum Punktspiel“ nennt Einsteiger und Wettkämpfer', async () => {
  const { seiten } = await import('../src/seiten.js');
  const hero = seiten.find((s) => s.slug === 'start').blocks.find((b) => b.type === 'hero').data;
  assert.equal(hero.bilder.find((b) => b.kicker === 'Sport').text, 'Du entscheidest, wie ernst es wird');
});

test('Aufmacher: ein Hinweis nach unten führt zu Aktuelles, und der Aufmacher lässt den Rand von Aktuelles sehen', () => {
  const h = renderPage(seite([
    { type: 'hero', data: { titel: 'X', aufbau: 'rundgang', bild: '/bilder/a.jpg', bilder: [{ src: '/bilder/a.jpg', kicker: 'A', text: 'x' }, { src: '/bilder/b.jpg', kicker: 'B', text: 'y' }],
      weiterLabel: 'Aktuelles', weiterHref: '#aktuell' } },
    { type: 'aktuell', data: {} }]));
  assert.match(h, /<a class="hero__weiter" href="#aktuell">Aktuelles <span class="hero__weiter-pfeil" aria-hidden="true">↓<\/span><\/a>/);
  assert.match(h, /<section class="section aktuell[^"]*" id="aktuell">/);
  assert.match(h, /\.hero--rundgang \.hero__rahmen \{ min-height: min\(84vh, 800px\); \}/);
  assert.match(h, /prefers-reduced-motion: no-preference\) \{\s*\.hero__weiter-pfeil \{ animation/);
});

test('Links: die Pille ist EINE gemeinsame Form, die weiterführende Wege am Blockende nutzen sie, Text-Links bleiben Text', () => {
  const css = renderPage(seite([{ type: 'aktuell', data: {} }]));
  assert.match(css, /\.pille \{ display: inline-block; padding: 11px 24px; border-radius: var\(--r-pill\); background: var\(--signal-leise\)/);
  const streifen = renderPage(seite([{ type: 'streifen', data: { titel: 'T', linkLabel: 'Mehr', linkHref: '/clubhaus/' } }]));
  assert.match(streifen, /<a class="pille streifen__mehr" href="\/clubhaus\/">Mehr →<\/a>/);
  const termine = renderPage(seite([{ type: 'termine', data: { termine: [{ titel: 'U', tag: '1. Mai', datum: '2027-05-01' }], mehrLabel: 'Zum Kalender', mehrHref: '/kalender/' } }]));
  assert.match(termine, /<a class="pille termine__mehr" href="\/kalender\/">Zum Kalender →<\/a>/);
  const kapitel = renderPage(seite([{ type: 'kapitel', data: { titel: 'T', links: [{ label: 'Mehr', href: '/x/' }] } }]));
  assert.match(kapitel, /<a class="pille kapitel__link" href="\/x\/">Mehr →<\/a>/);
  // Im Aufmacher bleiben die Themen-Links Text, Termin-Links in einer Zeile ebenfalls.
  const hero = renderPage(seite([{ type: 'hero', data: { titel: 'X', aufbau: 'rundgang', bild: '/bilder/a.jpg', bilder: [
    { src: '/bilder/a.jpg', kicker: 'A', text: 'x', links: [{ label: 'L', href: '/y/' }] }, { src: '/bilder/b.jpg', kicker: 'B' }] } }]));
  assert.match(hero, /<a class="hero__thema-link" href="\/y\/">L →<\/a>/);
  assert.doesNotMatch(hero, /<a class="pille hero__thema-link/);
  // Nie mehr als ein gelber Knopf je Seite: die Pille ist keiner.
  assert.doesNotMatch(streifen + termine + kapitel, /class="knopf"/);
});

test('Menü: die Pille ist dezent (16 px, feiner Rand), die Abstände geben den Einträgen Luft zur Marke', () => {
  const h = renderPage(seite([{ type: 'nav', data: { marke: 'X', baum: [{ label: 'Club', href: '/' }] } }]));
  assert.match(h, /\.kopf__menue a\.kopf__pille \{ border: 1px solid var\(--signal\);[^}]*font-size: 16px; font-weight: 500;/);
  assert.match(h, /\.kopf__menue \{ display: flex; gap: var\(--raum-3\); align-items: center;\s*font-size: 19px; margin-left: var\(--raum-4\); \}/);
});
