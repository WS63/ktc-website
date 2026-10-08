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

    const inhalt = html`<div class="container">
        ${data.pill ? html`<p class="hero__pill">${data.pill}</p>` : ''}
        <h1 class="hero__titel">${data.titel}</h1>
        ${data.sub ? html`<p class="hero__sub">${data.sub}</p>` : ''}
        ${(data.ctaLabel && z1) || (data.zweitLabel && z2) ? html`<div class="hero__knoepfe">
          ${data.ctaLabel && z1 ? html`<a class="knopf" href="${raw(escapeAttr(z1))}">${data.ctaLabel}</a>` : ''}
          ${data.zweitLabel && z2 ? html`<a class="knopf knopf--leise" href="${raw(escapeAttr(z2))}">${data.zweitLabel}</a>` : ''}
        </div>` : ''}
      </div>`;

    // P6: kein Bild haelt nichts auf — dann eben die schlichte Fassung.
    if (!bild) return html`<section class="section hero">${inhalt}</section>`;

    return html`
      <section class="section hero hero--bild">
        <div class="hero__rahmen">
          <img class="hero__foto" src="${raw(escapeAttr(bild))}"
               alt="${raw(escapeAttr(data.bildAlt || ''))}"
               fetchpriority="high" decoding="async">
          <div class="hero__schleier"></div>
          ${data.marke === 'ja'
            ? html`<img class="hero__marke" src="/assets/ktc-logo-auf-bild.svg"
                        alt="" aria-hidden="true" decoding="async">`
            : ''}
          ${inhalt}
        </div>
      </section>`;
  },
};
