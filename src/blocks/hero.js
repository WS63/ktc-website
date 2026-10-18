import { html, raw, escapeAttr, ziel, istExtern } from './_util.js';

export default {
  name: 'hero',
  label: 'Aufmacher',
  schema: {
    pill:      { type: 'text',     default: '', label: 'Kleine Zeile darüber' },
    titel:     { type: 'text',     default: '', label: 'Überschrift' },
    sub:       { type: 'longtext', default: '', label: 'Untertitel' },
    ctaLabel:  { type: 'text',     default: '', label: 'Beschriftung des Knopfs' },
    ctaHref:   { type: 'text',     default: '', label: 'Knopf-Ziel' },
    zweitLabel:{ type: 'text',     default: '', label: 'Zweiter Knopf, leiser' },
    zweitHref: { type: 'text',     default: '', label: 'Ziel des zweiten Knopfs' },
    bild:      { type: 'image',    default: '', label: 'Hintergrundbild' },
    bildAlt:   { type: 'text',     default: '', label: 'Alt-Text des Bildes' },
    bilder:    { type: 'liste',    default: [], label: 'Weitere Bilder — blenden nacheinander durch' },
    marke:     { type: 'auswahl',  default: 'nein', label: 'Logo ins Bild',
                 optionen: ['nein', 'ja'] },
    aufbau:    { type: 'auswahl',  default: 'bild', label: 'Aufbau mit Bild',
                 optionen: ['bild', 'zeile'] },
    wortmarke: { type: 'text',     default: '', label: 'Vereinsname neben dem Zeichen' },
  },
  css: `
    .hero { padding: var(--raum-6) 0 var(--raum-5); position: relative; }
    .hero__pill { display: inline-block; font-size: 12px; letter-spacing: .1em;
      text-transform: uppercase; color: var(--signal); border: 1px solid var(--signal);
      border-radius: 3px; padding: 4px 10px; margin-bottom: var(--raum-3); }
    .hero__titel { font-size: clamp(34px, 6vw, 60px); margin: 0 0 var(--raum-2); max-width: 15ch; }
    .hero__sub { font-size: 19px; color: var(--text-leise); max-width: 46ch; }
    .hero__knoepfe { margin-top: var(--raum-4); display: flex; gap: 12px; flex-wrap: wrap; }
    .knopf { display: inline-block; text-decoration: none; font-weight: 500; font-size: 16px;
      padding: 14px 30px; border-radius: var(--radius-knopf);
      background: var(--handlung); color: var(--handlung-text);
      transition: transform .12s ease, background .12s ease; }
    .knopf:hover { background: var(--handlung-hover); color: var(--handlung-text);
      transform: translateY(-1px); }
    .knopf:active { transform: translateY(0); }
    .knopf--leise { background: transparent; color: var(--signal);
      border: 1px solid var(--signal); padding: 13px 28px; font-weight: 400; }
    .knopf--leise:hover { background: var(--signal-leise); color: var(--signal); }

    /* Mit Bild: der Text steht auf dem Bild, nicht daneben. Ein Verlauf sorgt
       dafuer, dass er lesbar bleibt, egal wie hell das Foto an der Stelle ist. */
    /* Zwei Klassen statt einer: sonst gewinnt die Regel fuer schmale Schirme
       weiter unten, weil sie spaeter im Stylesheet steht. */
    .hero.hero--bild { padding: 0; }
    .hero--bild .hero__rahmen { position: relative; min-height: min(72vh, 620px);
      display: flex; align-items: flex-end; overflow: hidden; }
    /* Eine Klasse, kein Elementselektor: '.hero--bild img' ist spezifischer
       als '.hero__marke' und hat das Logo auf volle Bildgroesse aufgeblasen.
       Hier gebaut und im Browser gesehen. */
    .hero__foto { position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; z-index: 0; }

    /* Mehrere Bilder liegen uebereinander und blenden durch. Reines CSS: kein
       Skript, nichts zu laden, und der Render-Cache bleibt wirksam, weil die
       Seite fuer jeden gleich aussieht — nur die Uhr laeuft im Browser.
       Die Keyframes kann der Baustein nicht fest mitbringen: wie lange ein
       Bild steht, haengt an ihrer Anzahl. Sie stehen deshalb im Markup, unter
       einem Namen, der die Anzahl traegt. */
    /* Kein fill-mode: 'backwards' wuerde waehrend der Wartezeit schon den
       0-%-Zustand setzen — und der ist opacity 1. Dann deckt das letzte Bild
       im Stapel alle anderen zu und nichts wechselt. Hier gebaut und gesehen. */
    .hero__foto--wechsel { opacity: 0; animation-duration: calc(var(--n) * var(--slot));
      animation-delay: calc(var(--i) * var(--slot)); animation-iteration-count: infinite;
      animation-timing-function: ease-in-out; }
    /* Wer Bewegung abgestellt hat, bekommt keine: dann steht das erste Bild. */
    @media (prefers-reduced-motion: reduce) {
      .hero__foto--wechsel { animation: none; opacity: 0; }
      .hero__foto--wechsel:first-of-type { opacity: 1; }
    }
    .hero--bild .hero__schleier { position: absolute; inset: 0; z-index: 1;
      /* Der Verlauf hat zwei Aufgaben und nur eine davon ist Lesbarkeit: oben
         darf das Foto hell bleiben, unten muss der Text tragen. Die erste
         Fassung verdunkelte durchgehend und nahm dem Bild das Licht. Jetzt
         bleibt die obere Haelfte fast frei und der Druck sitzt da, wo die
         Schrift steht. */
      background: linear-gradient(180deg, rgba(30,30,24,.06) 0%, rgba(30,30,24,.16) 40%,
        rgba(30,30,24,.46) 72%, rgba(30,30,24,.66) 100%); }
    .hero--bild .container { position: relative; z-index: 2;
      padding-top: var(--raum-5); padding-bottom: var(--raum-5); }
    .hero--bild .hero__titel, .hero--bild .hero__sub { color: #fff;
      text-shadow: 0 1px 12px rgba(30,30,24,.45); }
    .hero--bild .hero__sub { color: rgba(255,255,255,.88); }
    .hero--bild .hero__pill { color: #fff; border-color: rgba(255,255,255,.65);
      background: rgba(255,255,255,.10); backdrop-filter: blur(2px); }
    .hero--bild .knopf--leise { color: #fff; border-color: rgba(255,255,255,.75); }
    .hero--bild .knopf--leise:hover { background: rgba(255,255,255,.14); color: #fff; }

    /* Das Logo im Bild. Die Fassung mit halbdurchlaessigem Grund ist genau
       dafuer gemacht — sie traegt sich selbst, egal wie unruhig das Foto an
       der Stelle ist. Rechts oben, gegenueber dem Text. */
    .hero__marke { position: absolute; top: var(--raum-4); right: var(--raum-4);
      z-index: 2; width: clamp(96px, 13vw, 190px); height: auto; display: block; }
    @media (max-width: 760px) {
      .hero__marke { width: 92px; top: var(--raum-3); right: var(--raum-3); }
    }

    /* Fassung 'zeile': das Zeichen steht links neben dem Wortblock, die
       Handlungen darunter. Erst standen sie rechts an der Bildkante — mit dem
       breiten Vereinsnamen daneben brachen sie je nach Schirmbreite um und
       sprangen von rechts nach links. Fest darunter ist langweiliger und auf
       jedem Schirm dieselbe Stelle. */
    .hero--zeile .hero__unten { display: block; }
    /* Die zwei Schriftgroessen stehen als Variablen da, weil das Logo seine
       Hoehe daraus rechnet. 'align-self: stretch' waere der naheliegende Weg
       gewesen — ein SVG ohne feste Masse nimmt dabei aber seine max-content-
       Breite und blaeht sich auf den halben Aufmacher auf. Hier gesehen. */
    /* Die Obergrenzen sind an der Vorlage gemessen und an der Containerbreite
       geprueft: Logo plus Wortmarke muessen bei 1120 px nebeneinander passen,
       sonst bricht die Zeile um und der ganze Aufbau faellt auseinander. */
    /* Die Zeile und die Handlungen sitzen etwas hoeher: unten bleibt mehr vom Foto, und der
       Aufmacher wirkt nicht bodenlastig. */
    .hero--bild.hero--zeile .container { padding-bottom: calc(var(--raum-5) + var(--raum-4)); }
    .hero--zeile { --wort-gr: clamp(30px, 5vw, 70px);
                   --titel-gr: clamp(22px, 3.7vw, 52px);
                   /* Der Textblock aus beiden Zeilen — das Mass, an dem das
                      Logo haengt. */
                   --block-h: calc(var(--wort-gr) * 1.05 + var(--titel-gr) * 1.15
                                   + var(--raum-0)); }
    .hero__zeile { display: flex; align-items: center; gap: var(--raum-3); }
    /* Die Logofassung fuer das Bild: teildurchlaessiger weisser Grund, kein
       Rahmen. Sie traegt sich selbst, egal wie unruhig das Foto an der Stelle
       ist — und sie traegt die Wortmarke bereits, deshalb steht daneben nur
       noch die Ueberschrift und nicht ein zweites Mal der Vereinsname. */
    .hero__zeichen { flex: none; display: block; border-radius: var(--r-sm);
      /* Genau die Hoehe des Textblocks: oben und unten schliesst das Logo mit
         den zwei Zeilen ab. Deshalb haengt es an --block-h und nicht an einem
         eigenen Mass — aendert sich eine der Schriftgroessen, zieht es mit. */
      height: var(--block-h); width: auto; }
    /* Zwei Zeilen, umgekehrt gewichtet: der Vereinsname fuehrt, die
       Ueberschrift antwortet leiser. Das ist eine Setzung fuer das Auge, nicht
       fuer das Dokument — semantisch bleibt die Ueberschrift die h1. */
    .hero--bild .hero__wort { color: #fff; font-size: var(--wort-gr);
      font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
      line-height: 1.05; margin: 0 0 var(--raum-0);
      text-shadow: 0 1px 14px rgba(30,30,24,.55); }
    .hero--zeile .hero__titel { font-size: var(--titel-gr);
      font-weight: 300; text-transform: uppercase; letter-spacing: .03em;
      line-height: 1.15; max-width: none; margin: 0;
      /* Von .82 auf .92: mit dem helleren Schleier steht diese Zeile jetzt
         gelegentlich auf blauem Himmel, und dort trug .82 nicht mehr. */
      color: rgba(255,255,255,.92); text-shadow: 0 1px 14px rgba(30,30,24,.5); }
    /* Rechts, aber nicht an der Kante: ein Knopf, der die Bildkante beruehrt,
       sieht aus, als waere er abgeschnitten. Der Abstand ist derselbe Raum wie
       zwischen den Abschnitten. */
    .hero--zeile .hero__knoepfe { margin-top: var(--raum-4);
      justify-content: flex-end; padding-right: var(--raum-5); }
    @media (max-width: 760px) {
      .hero--zeile .hero__knoepfe { justify-content: flex-start; padding-right: 0; }
    }
    /* Zweite Handlung als Link, nicht als Knopf: zwei Knoepfe nebeneinander
       rufen gleich laut, und laut sein darf hier genau einer.
       align-self, weil '.hero__knoepfe' ein Flex-Kasten ist — ohne das wird der
       Link auf Knopfhoehe gestreckt und seine Unterlinie rutscht nach unten weg. */
    .hero--bild .hero__nebenbei { align-self: center; color: #fff;
      text-decoration: none; font-size: 16px; padding-bottom: 2px;
      border-bottom: 1px solid rgba(255,255,255,.5); }
    .hero--bild .hero__nebenbei:hover { border-bottom-color: #fff; }
    @media (max-width: 560px) {
      .hero__zeile { gap: var(--raum-2); }
    }
    @media (max-width: 640px) {
      .hero { padding: var(--raum-5) 0 var(--raum-4); }
      .hero.hero--bild { padding: 0; }
      .hero--bild .hero__rahmen { min-height: 72vh; }
      .hero--bild .hero__titel { max-width: 100%; }
    }
  `,
  render(data) {
    const z1 = ziel(data.ctaHref), z2 = ziel(data.zweitHref);
    const bild = ziel(data.bild);

    const zeile = bild && data.aufbau === 'zeile';

    const knoepfe = (data.ctaLabel && z1) || (data.zweitLabel && z2)
      ? html`<div class="hero__knoepfe">
          ${data.zweitLabel && z2 && zeile
            ? html`<a class="hero__nebenbei" href="${raw(escapeAttr(z2))}">${data.zweitLabel} →</a>`
            : ''}
          ${data.ctaLabel && z1 ? html`<a class="knopf" href="${raw(escapeAttr(z1))}"${neuesFenster(z1)}>${data.ctaLabel}</a>` : ''}
          ${data.zweitLabel && z2 && !zeile
            ? html`<a class="knopf knopf--leise" href="${raw(escapeAttr(z2))}"${neuesFenster(z2)}>${data.zweitLabel}</a>`
            : ''}
        </div>`
      : '';

    const wortblock = html`
        ${data.wortmarke ? html`<p class="hero__wort">${data.wortmarke}</p>` : ''}
        ${data.pill ? html`<p class="hero__pill">${data.pill}</p>` : ''}
        <h1 class="hero__titel">${data.titel}</h1>
        ${data.sub ? html`<p class="hero__sub">${data.sub}</p>` : ''}`;

    const inhalt = zeile
      ? html`<div class="container"><div class="hero__unten">
          <div class="hero__zeile">
            ${data.marke === 'ja'
              ? html`<img class="hero__zeichen" src="/assets/ktc-logo-bild-2026.svg"
                          alt="" aria-hidden="true" decoding="async">`
              : ''}
            <div>${wortblock}</div>
          </div>
          ${knoepfe}
        </div></div>`
      : html`<div class="container">${wortblock}${knoepfe}</div>`;

    // P6: kein Bild haelt nichts auf — dann eben die schlichte Fassung.
    if (!bild) return html`<section class="section hero">${inhalt}</section>`;

    // Das Hauptbild zuerst, dann die weiteren. Doppelte fliegen raus — sonst
    // steht dasselbe Foto zweimal im Lauf und wirkt wie ein Haenger.
    const alle = [bild];
    for (const b of data.bilder || []) {
      const z = ziel(typeof b === 'string' ? b : b && b.src);
      if (z && !alle.includes(z)) alle.push(z);
    }
    const n = alle.length;

    // Die Groessenreihe kommt beim Ausliefern dazu (src/routes/public.js, 'srcsets').
    // Fehlt sie, bleibt es bei der einen Adresse (P6). Der Aufmacher ist immer
    // schirmbreit, deshalb 100vw.
    const reihe = (src) => {
      const s = data.srcsets?.[src];
      return s ? raw(` srcset="${escapeAttr(s)}" sizes="100vw"`) : '';
    };

    // Das erste Bild ist das, was man sieht: es kommt zuerst. Die weiteren
    // tauchen fruehestens nach einem Platz von SLOT_S Sekunden auf und duerfen
    // warten — 'low' laesst ihnen die Leitung erst, wenn das erste da ist.
    const fotos = n === 1
      ? html`<img class="hero__foto" src="${raw(escapeAttr(bild))}"${reihe(bild)}
                  alt="${raw(escapeAttr(data.bildAlt || ''))}"
                  fetchpriority="high" decoding="async">`
      : alle.map((src, i) => html`<img class="hero__foto hero__foto--wechsel"
             style="--i: ${raw(String(i))}; animation-name: hero-blende-${raw(String(n))}"
             src="${raw(escapeAttr(src))}"${reihe(src)}
             alt="${raw(i === 0 ? escapeAttr(data.bildAlt || '') : '')}"
             ${raw(i === 0 ? 'fetchpriority="high"' : 'aria-hidden="true" fetchpriority="low"')} decoding="async">`);

    return html`
      <section class="section hero hero--bild${raw(zeile ? ' hero--zeile' : '')}"
               style="--n: ${raw(String(n))}; --slot: ${raw(String(SLOT_S))}s">
        ${n > 1 ? raw(`<style>${keyframes(n)}</style>`) : ''}
        <div class="hero__rahmen">
          ${fotos}
          <div class="hero__schleier"></div>
          ${!zeile && data.marke === 'ja'
            ? html`<img class="hero__marke" src="/assets/ktc-logo-bild-2026.svg"
                        alt="" aria-hidden="true" decoding="async">`
            : ''}
          ${inhalt}
        </div>
      </section>`;
  },
};

/**
 * Die Keyframes fuer n durchblendende Bilder.
 *
 * Jedes Bild haelt einen Platz von 100/n Prozent der Runde und blendet an
 * dessen Ende weich aus; das naechste kommt mit seinem Versatz darunter hervor.
 * Die Blendzeit ist fest in Sekunden gedacht und hier in Prozent der Runde
 * umgerechnet, damit sie bei zwei wie bei zwanzig Bildern gleich lang dauert.
 *
 * Der Name traegt die Anzahl: zwei Aufmacher mit derselben Anzahl erzeugen
 * dieselbe Regel zweimal, was folgenlos ist — zwei mit verschiedener Anzahl
 * wuerden sich sonst gegenseitig ueberschreiben.
 */
function keyframes(n) {
  const platz = 100 / n;
  const blende = (BLENDE_S / (n * SLOT_S)) * 100;
  const r = (x) => Math.round(x * 100) / 100;
  return `@keyframes hero-blende-${n}{`
    + `0%{opacity:1}`
    + `${r(platz - blende)}%{opacity:1}`
    + `${r(platz)}%{opacity:0}`
    + `${r(100 - blende)}%{opacity:0}`
    + `100%{opacity:1}}`;
}

// Wie lange ein Bild steht und wie lange die Blende dauert. Beide Werte gehen
// als CSS-Variable --slot in das Markup, damit Rechnung und Darstellung nicht
// auseinanderlaufen koennen.
const SLOT_S = 7;
const BLENDE_S = 1.4;

/**
 * Ein Ziel ausserhalb der Website oeffnet im neuen Fenster.
 *
 * Die Kopfzeile und der Fliesstext taten das schon; nur die Knoepfe im
 * Aufmacher nicht. 'Jetzt anmelden' fuehrte deshalb aus der Website HINAUS und
 * liess keinen Weg zurueck als die Zurueck-Taste — an der Stelle, an der jemand
 * gerade entschieden hat, Mitglied zu werden.
 */
function neuesFenster(z) {
  return istExtern(z) ? raw(' target="_blank" rel="noopener noreferrer"') : '';
}
