import { html, raw, escapeAttr, ziel } from './_util.js';

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
    .hero--bild .hero__schleier { position: absolute; inset: 0; z-index: 1;
      /* Kraeftig genug, dass Schrift auch auf einem hellen Bild traegt.
         Gemessen an der Terrasse mit den weissen Sonnenschirmen: bei .30 in
         der Mitte war der Untertitel kaum zu lesen. */
      background: linear-gradient(180deg, rgba(30,30,24,.18) 0%, rgba(30,30,24,.42) 45%,
        rgba(30,30,24,.72) 70%, rgba(30,30,24,.88) 100%); }
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
    .hero__zeile { display: flex; align-items: center; gap: var(--raum-3); }
    /* Die Logofassung fuer das Bild: teildurchlaessiger weisser Grund, kein
       Rahmen. Sie traegt sich selbst, egal wie unruhig das Foto an der Stelle
       ist — und sie traegt die Wortmarke bereits, deshalb steht daneben nur
       noch die Ueberschrift und nicht ein zweites Mal der Vereinsname. */
    .hero__zeichen { width: clamp(110px, 14vw, 180px); height: auto; flex: none;
      display: block; border-radius: var(--r-sm); }
    /* Zwei Zeilen, umgekehrt gewichtet: der Vereinsname fuehrt, die
       Ueberschrift antwortet leiser. Das ist eine Setzung fuer das Auge, nicht
       fuer das Dokument — semantisch bleibt die Ueberschrift die h1. */
    .hero--bild .hero__wort { color: #fff; font-size: clamp(28px, 4.6vw, 52px);
      font-weight: 700; text-transform: uppercase; letter-spacing: .035em;
      line-height: 1.05; margin: 0 0 var(--raum-0);
      text-shadow: 0 1px 14px rgba(30,30,24,.55); }
    .hero--zeile .hero__titel { font-size: clamp(19px, 2.8vw, 34px);
      font-weight: 300; text-transform: uppercase; letter-spacing: .03em;
      line-height: 1.15; max-width: none; margin: 0;
      color: rgba(255,255,255,.82); }
    .hero--zeile .hero__knoepfe { margin-top: var(--raum-4); }
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
          ${data.ctaLabel && z1 ? html`<a class="knopf" href="${raw(escapeAttr(z1))}">${data.ctaLabel}</a>` : ''}
          ${data.zweitLabel && z2 && !zeile
            ? html`<a class="knopf knopf--leise" href="${raw(escapeAttr(z2))}">${data.zweitLabel}</a>`
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
              ? html`<img class="hero__zeichen" src="/assets/ktc-logo-auf-bild.svg"
                          alt="" aria-hidden="true" decoding="async">`
              : ''}
            <div>${wortblock}</div>
          </div>
          ${knoepfe}
        </div></div>`
      : html`<div class="container">${wortblock}${knoepfe}</div>`;

    // P6: kein Bild haelt nichts auf — dann eben die schlichte Fassung.
    if (!bild) return html`<section class="section hero">${inhalt}</section>`;

    return html`
      <section class="section hero hero--bild${raw(zeile ? ' hero--zeile' : '')}">
        <div class="hero__rahmen">
          <img class="hero__foto" src="${raw(escapeAttr(bild))}"
               alt="${raw(escapeAttr(data.bildAlt || ''))}"
               fetchpriority="high" decoding="async">
          <div class="hero__schleier"></div>
          ${!zeile && data.marke === 'ja'
            ? html`<img class="hero__marke" src="/assets/ktc-logo-auf-bild.svg"
                        alt="" aria-hidden="true" decoding="async">`
            : ''}
          ${inhalt}
        </div>
      </section>`;
  },
};
