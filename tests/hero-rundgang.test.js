import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../src/renderer.js';
import { seiten } from '../src/seiten.js';

const seite = (data) => ({ slug: 'p', page_type: 'home', status: 'published', title: 'P',
  content_json: { blocks: [{ type: 'hero', data }] } });
const th = (n, kicker, extra = {}) => ({ src: `/bilder/${n}.jpg`, alt: `Bild ${n}`, kicker, text: `Aussage ${n}`, ...extra });
const grund = { titel: 'Lust auf Tennis', aufbau: 'rundgang', bild: '/bilder/a.jpg', bildAlt: 'A',
  bilder: [th('a', 'Ort', { fakten: [{ wert: '7', label: 'Plätze' }], links: [{ label: 'Mehr', href: '/clubhaus/' }] }),
    th('b', 'Spielen'), th('c', 'Jugend')] };

test('Rundgang: je Bild ein Thema mit Kicker, Aussage, Zahl und Link, die Frage bleibt Überschrift', () => {
  const h = renderPage(seite(grund));
  assert.equal((h.match(/<div class="hero__thema" data-i="\d"/g) || []).length, 3);
  assert.match(h, /hero__thema-kicker hero__t-teil hero__intro"[^>]*>Ort</);
  assert.match(h, /hero__thema-text hero__t-teil hero__intro" style="--k: 1[^>]*>Aussage a<\/p>/);
  assert.match(h, /nur-vorleser">7<\/span><span aria-hidden="true"><span class="hero__zahl" data-von="0" data-bis="7">7<\/span>/);
  assert.match(h, /<a class="hero__thema-link" href="\/clubhaus\/">Mehr →/);
  assert.match(h, /<h1 class="hero__titel">Lust auf Tennis/);
  assert.equal((h.match(/<figure class="hero__slide" data-i="\d"/g) || []).length, 3);
});

test('Rundgang: die Leiste hat einen Reiter je Thema, Antippen braucht kein Skript', () => {
  const h = renderPage(seite(grund));
  assert.equal((h.match(/<input type="radio" name="hero-thema"/g) || []).length, 3);
  assert.match(h, /<label class="hero__reiter" for="hero-t1">/);
  assert.match(h, /hero__reiter-name">Spielen</);
  assert.match(h, /<button type="reset" class="hero__auto">Automatisch<\/button>/);
  assert.match(h, /:has\(#hero-t2:checked\) \.hero__slide\[data-i="2"\]/);
  const aufmacher = h.slice(h.indexOf('hero--rundgang"'), h.indexOf('</section>', h.indexOf('hero--rundgang"')));
  assert.doesNotMatch(aufmacher, /onclick|onchange|javascript:/, 'Bedienen und Anhalten brauchen kein Skript, nur das Zählen');
});

test('Rundgang: Takt, Zoom, Strich und Anhalten sind da, Anhalten auch beim Darüberfahren der Leiste', () => {
  const h = renderPage(seite(grund));
  for (const k of ['hero-rg-blende-3', 'hero-rg-zoom-3', 'hero-rg-text-3', 'hero-rg-fuell-3-0', 'hero-rg-fuell-3-2'])
    assert.match(h, new RegExp(`@keyframes ${k}\\{`));
  assert.match(h, /--slot: 9s/);
  assert.match(h, /<input type="checkbox" id="hero-pause" class="hero__pause" aria-label="Bildwechsel anhalten">/);
  assert.match(h, /:has\(\.hero__leiste:hover, :focus-visible\)/);
  assert.doesNotMatch(h, /\.hero__themen:hover/, 'eine ruhende Maus über dem Text hält nichts an');
  assert.match(h, /visibility:hidden/, 'ein ausgeblendetes Thema fängt keine Klicks ab');
});

test('Rundgang: für Vorleser das erste Thema; Bewegung aus = erstes Thema und erstes Bild', () => {
  const h = renderPage(seite(grund));
  assert.match(h, /alt="Bild a"/);
  assert.equal((h.match(/class="hero__thema" data-i="[1-9]"[^>]*aria-hidden="true"/g) || []).length, 2);
  assert.match(h, /prefers-reduced-motion: reduce\) \{\s*\.hero--rundgang \.hero__slide/);
});

test('Rundgang: der nächste Vereinstermin kommt vom Server, ohne Termin fällt die Zahl weg', () => {
  const mit = th('d', 'Dabei sein', { fakten: [{ wert: '225 €', label: 'erstes Jahr' }, { quelle: 'termin' }] });
  const daten = { ...grund, bilder: [...grund.bilder, mit] };
  const a = renderPage(seite({ ...daten, naechsterTermin: { tag: '24. Okt ’26', titel: 'Herbst-Aktionstag' } }));
  assert.match(a, /hero__thema-wert">24\. Okt ’26</);
  assert.match(a, /hero__thema-label">Herbst-Aktionstag</);
  const b = renderPage(seite(daten));
  assert.doesNotMatch(b, /Herbst-Aktionstag/);
  assert.match(b, /nur-vorleser">225 €</);
});

test('Rundgang: ein einzelnes Bild bewegt nichts und zeigt keine Leiste; ohne Bild die schlichte Fassung', () => {
  const eins = renderPage(seite({ titel: 'X', aufbau: 'rundgang', bild: '/bilder/g.jpg', bildAlt: 'G' }));
  assert.doesNotMatch(eins, /class="hero__leiste"|hero-pause|@keyframes hero-rg/);
  assert.doesNotMatch(renderPage(seite({ titel: 'X', aufbau: 'rundgang' })), /class="hero__slide"/);
});

test('Rundgang: der einfache Aufmacher bleibt unverändert', () => {
  const alt = renderPage(seite({ titel: 'X', aufbau: 'zeile', bild: '/bilder/g.jpg', bilder: ['/bilder/a.jpg'] }));
  assert.match(alt, /@keyframes hero-blende-2\{/);
  assert.doesNotMatch(alt, /class="hero__slide"|class="hero__leiste"/);
});

test('Rundgang: die Startseite nutzt ihn, alle Texte kommen aus den Fakten', () => {
  const hero = seiten.find((s) => s.slug === 'start').blocks.find((x) => x.type === 'hero').data;
  assert.equal(hero.aufbau, 'rundgang');
  assert.ok(hero.bilder.length >= 4, 'mindestens vier Themen');
  assert.ok(hero.bilder.every((x) => x.src && x.kicker && x.text && x.links?.length), 'jedes Thema ist vollständig');
  const texte = hero.bilder.flatMap((x) => [x.text, ...x.fakten.flatMap((f) => [f.wert, f.label])]).filter(Boolean);
  assert.ok(!texte.some((z) => /\d/.test(z.replace(/\{\{[^}]+\}\}/g, ''))), 'keine getippten Zahlen (P2)');
});

test('Kapitel (für Unterseiten): Teaser mit Zahlen und Link, ohne Auskünfte; zwei Hälften', () => {
  const einfach = renderPage({ slug: 'p', page_type: 'home', status: 'published', title: 'P',
    content_json: { blocks: [{ type: 'kapitel', data: { anker: 'ort', grund: 'ruhig', titel: 'T', text: 'S',
      fakten: [{ wert: '1', label: 'a' }, { wert: '2', label: 'b' }, { wert: '3', label: 'c' }, { wert: '4', label: 'd' }],
      links: [{ label: 'Mehr', href: '/clubhaus/' }] } }] } });
  assert.match(einfach, /<section class="section kapitel section--ruhig" id="ort">/);
  assert.equal((einfach.match(/class="kapitel__wert"/g) || []).length, 3);
  const zwei = renderPage({ slug: 'p', page_type: 'home', status: 'published', title: 'P',
    content_json: { blocks: [{ type: 'kapitel', data: { anker: 'spielen', titel: 'T',
      haelften: [{ label: 'Wettkampf', titel: 'A' }, { label: 'Hobby', titel: 'B' }] } }] } });
  assert.match(zwei, /kapitel kapitel--zwei" id="spielen"/);
  assert.equal((zwei.match(/<article class="kapitel__haelfte/g) || []).length, 2);
});

test('Rundgang: Schlüsselwörter zwischen Sternen stehen im Akzent, alles andere wird maskiert', () => {
  const h = renderPage(seite({ ...grund, bilder: [th('a', 'Ort', { text: 'Zum *Spielen* und <b>zum</b> *Bleiben*' }), th('b', 'Spielen')] }));
  assert.match(h, /Zum <span class="hero__stich">Spielen<\/span> und &lt;b&gt;zum&lt;\/b&gt; <span class="hero__stich">Bleiben<\/span>/);
  assert.match(h, /--titel-akzent: #ffbe00/);
  assert.match(h, /\.hero__stich \{ color: var\(--titel-akzent\)/);
});

test('Rundgang: der laufende Strich ist gelb, der durchlaufene hellgrau; die Reiter tragen ihren eigenen Namen', () => {
  const h = renderPage(seite({ ...grund, bilder: [th('a', 'Ort', { reiter: 'Der Club' }), th('b', 'Spielen')] }));
  assert.match(h, /@keyframes hero-rg-fuell-2-0\{0%\{transform:scaleX\(0\);background:var\(--titel-akzent\)\}/);
  assert.match(h, /background:var\(--text-hell-leise\)\}100%\{transform:scaleX\(1\);background:var\(--text-hell-leise\)/);
  assert.match(h, /hero__reiter-name">Der Club</);
  assert.match(h, /hero__reiter-name">Spielen</, 'ohne eigenen Namen gilt das Thema');
});

test('Rundgang: Zahlen zählen per Skript mit dem Einblenden; Vorwörter werden zum Plus, keine zählt herunter', () => {
  const fakten = [{ wert: 'rund 20', label: 'a' }, { wert: 'über 500', label: 'a2' }, { wert: '225 €', label: 'd' }];
  const h = renderPage(seite({ ...grund, bilder: [th('a', 'Ort', { fakten }), th('b', 'Spielen', { fakten: [
    { wert: 'keine', ab: 100, einheit: '€', label: 'Gebühr' }, { wert: '24. Okt ’26', label: 'b' }, { wert: 'Hobby', label: 'c' }] })] }));
  // Im Markup steht der Endwert (ohne Skript bleibt es dabei), das Skript zählt von data-von nach data-bis.
  assert.match(h, /<span class="nur-vorleser">rund 20<\/span><span aria-hidden="true"><span class="hero__zahl" data-von="0" data-bis="20">20<\/span><span class="hero__plus">\+<\/span><\/span>/);
  assert.match(h, /data-bis="500">500<\/span><span class="hero__plus">\+<\/span>/, 'über 500 wird 500+');
  assert.match(h, /data-bis="225">225<\/span> €</);
  assert.match(h, /data-von="100" data-bis="0">0<\/span> €</, 'keine zählt von 100 auf 0 Euro');
  assert.match(h, /nur-vorleser">keine</, 'Vorleser hören "keine"');
  assert.match(h, /hero__thema-wert">24\. Okt ’26</, 'ein Datum bleibt stehen');
  assert.match(h, /hero__thema-wert">Hobby</);
  assert.doesNotMatch(h, /@property|--zahl/, 'kein CSS-Zähler mehr: der lief nicht in jedem Browser');
  // Das Skript hängt am Themenbeginn und am Antippen, und es beachtet "Bewegung reduzieren".
  const skript = h.split('<script>').find((x) => x.includes("querySelector('.hero--rundgang')"));
  assert.match(skript, /addEventListener\('animationstart'/);
  assert.match(skript, /addEventListener\('animationiteration'/);
  assert.match(skript, /addEventListener\('change'/);
  assert.match(skript, /plus\.style\.opacity = '0'/, 'das Plus erscheint erst, wenn die Zahl angekommen ist');
  assert.match(skript, /plus\.style\.opacity = '1'/);
  assert.doesNotMatch(skript, /__fertig/, 'die Zahlen zählen in jeder Runde neu');
  assert.match(skript, /classList\.add\('hero__feder'\)/, 'am Ende federt die Zahl');
  assert.match(h, /@keyframes hero-feder \{ 0% \{ transform: scale\(1\); \} 40% \{ transform: scale\(1\.14\)/);
  assert.match(skript, /prefers-reduced-motion: reduce/);
});

test('Rundgang: die Zahlenzeile steht im Akzent, die Aussage weiß', () => {
  const h = renderPage(seite(grund));
  assert.match(h, /\.hero__thema-wert \{[^}]*color: var\(--titel-akzent\)/);
  assert.doesNotMatch(h, /\.hero__thema-text \{[^}]*titel-akzent/);
});

test('Rundgang: das Zähl-Skript ist für die Content-Security-Policy gemeldet', async () => {
  const { default: hero } = await import('../src/blocks/hero.js');
  assert.equal(hero.skripte.length, 1);
  assert.match(hero.skripte[0], /\.hero--rundgang/);
});

test('Aktuelles: die Wege zu den Listen stehen als Pillen in einer Zeile, keine Knöpfe', () => {
  const h = renderPage({ slug: 'p', page_type: 'home', status: 'published', title: 'P', content_json: { blocks: [{ type: 'aktuell',
    data: { beitraegeHref: '/aktuelles/', termineHref: '/kalender/', gesamt: 24, beitraege: [{ titel: 'T', datum: 'd', href: '/x/' }],
      termine: [{ titel: 'U', tag: '1. Mai', datum: '2027-05-01' }] } }] } });
  const zeile = h.slice(h.indexOf('<div class="aktuell__pillen">'));
  assert.equal((zeile.match(/class="pille"/g) || []).length, 2);
  assert.match(zeile, /Alle Beiträge \(24\) →/);
  assert.doesNotMatch(h, /class="knopf"/);
});

test('Rundgang: das Thema ist ein dunkles Etikett (kein Link, kein Gelb); der Block liegt mittig zwischen Claim und Knöpfen', () => {
  const h = renderPage(seite(grund));
  const kicker = h.match(/\.hero__thema-kicker \{[^}]*\}/)[0];
  assert.match(kicker, /background: var\(--etikett-grund\)/);
  assert.match(kicker, /border-radius: var\(--r-pill\)/);
  assert.doesNotMatch(kicker, /titel-akzent/, 'Gelb gehört den Zahlen, dem Balken und dem Knopf');
  assert.doesNotMatch(h, /\.hero__thema-kicker::before/);
  assert.match(h, /\.hero__themen \{[^}]*margin: clamp\(28px, 5.5vh, 60px\) 0;/, 'gleicher Abstand oben und unten');
  assert.match(h, /\.hero--rundgang \.hero__knoepfe \{[^}]*margin-top: 0;/);
});

test('Rundgang: Dabei sein zeigt dreimal null (Gebühr, Arbeitsstunden, Verzehrgutscheine), der Beitrag steht in der Aussage', () => {
  const hero = seiten.find((s) => s.slug === 'start').blocks.find((x) => x.type === 'hero').data;
  const dabei = hero.bilder.find((b) => b.kicker === 'Dabei sein');
  assert.equal(dabei.fakten.length, 3);
  assert.ok(dabei.fakten.every((f) => f.ab > 0 && /^\{\{facts\.beitraege\./.test(f.wert)), 'jede Null kommt aus den Fakten');
  assert.match(dabei.text, /neumitglied_erstes_jahr/);
  assert.ok(!hero.bilder.some((b) => b.fakten.some((f) => f.quelle === 'termin')), 'der nächste Termin steht schon unter dem Aufmacher');
});

test('Rundgang: der Preis für Neue nennt seine Bedingung im selben Block, und die Leiste schreibt in Großbuchstaben', () => {
  const hero = seiten.find((s) => s.slug === 'start').blocks.find((x) => x.type === 'hero').data;
  const dabei = hero.bilder.find((b) => b.kicker === 'Dabei sein');
  assert.match(dabei.text, /Als Neumitglied/);
  assert.match(dabei.fussnote, /neumitglied_voraussetzung/);
  const h = renderPage(seite({ ...grund, bilder: [th('a', 'Ort', { fussnote: 'Voraussetzung: x.' }), th('b', 'Spielen')] }));
  assert.match(h, /<p class="hero__thema-fuss hero__t-teil hero__intro" [^>]*>Voraussetzung: x\.<\/p>/);
  assert.match(h, /\.hero__reiter span\.hero__reiter-name \{[^}]*text-transform: uppercase/);
});

test('Rundgang: Vorleser bekommen eine Zusammenfassung mit Überschrift je Thema, der Wechsel selbst ist stumm', () => {
  const h = renderPage(seite({ ...grund, bilder: [
    th('a', 'Ort', { text: 'Sieben *Sandplätze*', fakten: [{ wert: '7', label: 'Plätze' }], links: [{ label: 'Mehr', href: '/clubhaus/' }], fussnote: 'Gilt im ersten Jahr' }),
    th('b', 'Spielen'), th('c', 'Jugend')] }));
  const ueberblick = h.slice(h.indexOf('<section class="nur-vorleser"'), h.indexOf('</section>', h.indexOf('<section class="nur-vorleser"')));
  assert.equal((ueberblick.match(/<h2>/g) || []).length, 3);
  assert.match(ueberblick, /<h2>Ort<\/h2>/);
  assert.match(ueberblick, /<p>Sieben Sandplätze<\/p>/, 'ohne Sternchen und ohne Hervorhebung');
  assert.match(ueberblick, /<li>7 Plätze<\/li>/);
  assert.match(ueberblick, /Gilt im ersten Jahr/);
  // Die Textteile der Themen sind für Vorleser stumm, damit nichts doppelt gelesen wird; die Links bleiben.
  assert.match(h, /hero__thema-text hero__t-teil hero__intro" style="[^"]*" aria-hidden="true"/);
  assert.doesNotMatch(h, /<div class="hero__thema-links[^>]*aria-hidden/);
  assert.match(h, /<a class="hero__thema-link" href="\/clubhaus\/">/);
});

test('Rundgang mit nur einem Thema bleibt wie er war: keine Zusammenfassung, nichts stumm', () => {
  const h = renderPage(seite({ ...grund, bilder: [th('a', 'Ort')] }));
  assert.doesNotMatch(h, /class="nur-vorleser"/);
  assert.doesNotMatch(h, /hero__thema-text[^>]*aria-hidden/);
});

test('Cockpit: das Schema nennt die Felder eines Themas, daraus macht der Editor die Vorlage für ein neues', async () => {
  const hero = (await import('../src/blocks/hero.js')).default;
  // Dieselbe Regel wie vorlageSchluessel() in admin/app.js: alles nach dem ersten Doppelpunkt, getrennt am Komma.
  const felder = hero.schema.bilder.label.match(/:\s*(.+)$/)[1].split(',').map((s) => s.trim());
  assert.deepEqual(felder, ['src', 'reiter', 'alt', 'kicker', 'text', 'text2', 'fakten', 'text3', 'links', 'fussnote']);
  for (const f of felder) assert.match(f, /^[a-zA-Z][a-zA-Z0-9]*$/, `${f}: sonst lässt der Editor das Feld weg`);
});

test('Rundgang: die zweite Zeile (text2) steht unter der Aussage, nur wenn sie da ist, und Vorleser hören sie', () => {
  const h = renderPage(seite({ ...grund, bilder: [th('a', 'Ort', { text2: 'Gemütlich *und* sonnig' }), th('b', 'Spielen')] }));
  assert.equal((h.match(/class="hero__thema-text2 /g) || []).length, 1);
  assert.match(h, /hero__thema-text hero__t-teil[^>]*>Aussage a<\/p>\s*<p class="hero__thema-text2/);
  assert.match(h, /<span class="hero__stich">und<\/span>/);
  assert.match(h, /<p>Gemütlich und sonnig<\/p>/, 'Vorleser: ohne Hervorhebung');
});

test('Der Club: Zahlen 7 / 4 / 200 Tage, die Gastronomie steht im Satz darunter und nicht an einer Zahl', async () => {
  const { seiten: alle } = await import('../src/seiten.js');
  const th1 = alle.find((x) => x.slug === 'start').blocks.find((b) => b.type === 'hero').data.bilder[0];
  assert.deepEqual(th1.fakten.map((f) => f.wert),
    ['{{facts.anlage.plaetze}}', '{{facts.anlage.plaetze_led}}', '{{facts.anlage.saison_tage}}']);
  assert.match(th1.fakten[2].label, /^Tage Freiluft-Tennis, \{\{facts\.anlage\.saison\}\}$/);
  assert.match(th1.text2, /Clubhaus.*Terrasse.*Gastronomie/);
  assert.doesNotMatch(JSON.stringify(th1), /Spice|Restaurant/, 'der Wirt und das Restaurant stehen auf der Clubhaus-Seite');
});

test('Alle vier Themen der Startseite haben das gleiche Format: Aussage, zweite Zeile, mindestens zwei Zahlen, Links', async () => {
  const { seiten: alle } = await import('../src/seiten.js');
  const themen = alle.find((x) => x.slug === 'start').blocks.find((b) => b.type === 'hero').data.bilder;
  assert.equal(themen.length, 4);
  for (const t of themen) {
    assert.ok(t.text, `${t.kicker}: Aussage`);
    assert.ok(t.text2, `${t.kicker}: zweite Zeile`);
    assert.ok(t.fakten.length >= 2, `${t.kicker}: mindestens zwei Zahlen`);
    assert.ok(t.links.length >= 1, `${t.kicker}: Links`);
    for (const f of t.fakten) assert.match(f.wert, /^\{\{facts\./, `${t.kicker}: Zahlen kommen aus den Fakten, nie getippt`);
  }
  const sport = themen.find((t) => t.kicker === 'Sport');
  assert.equal(sport.fakten.length, 3);
  assert.match(sport.text2, /Schnupperkurs.*Hobbyrunde.*Medenspiele/);
  assert.doesNotMatch(JSON.stringify(themen), /ohne Anmeldung/, 'auch wer reinschnuppert, meldet sich an');
});

test('Rundgang: der Strich des letzten Themas bleibt gelb, kein Schlüsselbild liegt jenseits von 100 %', () => {
  const css = renderPage(seite(grund)).match(/<style>([^<]*hero-rg-fuell[^<]*)<\/style>/)[1];
  for (const m of css.matchAll(/(\d+(?:\.\d+)?)%\{/g)) assert.ok(Number(m[1]) <= 100, `${m[1]} % ist kein gültiges Schlüsselbild`);
  const letzter = css.match(/@keyframes hero-rg-fuell-3-2\{[^@]*\}\}?/)[0];
  assert.doesNotMatch(letzter, /text-hell-leise/, 'beim letzten Thema wird der Strich nicht hellgrau');
  assert.match(letzter, /100%\{transform:scaleX\(1\);background:var\(--titel-akzent\)\}/);
  assert.match(css.match(/@keyframes hero-rg-fuell-3-0\{[^@]*\}\}?/)[0], /text-hell-leise/, 'frühere Themen werden hellgrau');
});

test('Keine Seite verspricht „ohne Anmeldung“: auch wer nur reinschnuppert, meldet sich an', async () => {
  const { seiten: alle } = await import('../src/seiten.js');
  assert.doesNotMatch(JSON.stringify(alle), /ohne (vorherige )?Anmeldung|Anmeldung ist nicht nötig/i);
});

test('Dabei sein: der Preis für Kinder und Jugendliche steht als eigene, normal große Zeile unter den Zahlen', async () => {
  const { seiten: alle } = await import('../src/seiten.js');
  const dabei = alle.find((x) => x.slug === 'start').blocks.find((b) => b.type === 'hero').data.bilder.find((t) => t.kicker === 'Dabei sein');
  assert.equal(dabei.text2, 'Nur das Training kommt dazu.');
  assert.match(dabei.text3, /Kinder und Jugendliche zahlen \{\{facts\.beitraege\.jugend\}\} €, mit einem aktiven Elternteil \{\{facts\.beitraege\.jugend_familie\}\} €/);
  assert.match(dabei.fussnote, /^Voraussetzung für den Neumitglieder-Preis: \{\{facts\.beitraege\.neumitglied_voraussetzung\}\}\.$/);
  const h = renderPage(seite({ ...grund, bilder: [th('a', 'Ort', { text3: 'Eine Zeile unter den Zahlen' }), th('b', 'Spielen')] }));
  assert.match(h, /<p class="hero__thema-text3 [^>]*>Eine Zeile unter den Zahlen<\/p>/);
  assert.match(h, /<p>Eine Zeile unter den Zahlen<\/p>/, 'Vorleser hören sie');
});
