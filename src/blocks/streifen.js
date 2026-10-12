import { html, raw, escapeAttr, ziel, istExtern, markdownInline } from './_util.js';

/**
 * Streifen — ein Bild links, ein Thema rechts.
 *
 * Gebaut fuer das, was weder in eine Karte noch auf eine eigene Seite
 * gehoert: ein Nebenthema, das trotzdem eine Auskunft traegt. Der Anlass war
 * die Gastronomie. Eine vierte Karte neben Team, Hobby und Jugend waere
 * falsch gewesen — die Kartenreihe beantwortet 'warum Mitglied werden', das
 * Restaurant ist oeffentlich. Und eine Karte kann keine Oeffnungszeiten
 * tragen: 250 px breit, zwei Zeilen Text, dann ist Schluss.
 *
 * Deshalb die 'zeilen': Label links, Wert rechts, untereinander. Das ist die
 * Form fuer Oeffnungszeiten, Telefonnummern, Ruhetage — Auskuenfte, die man
 * UEBERFLIEGT, nicht liest. Als Fliesstext waeren dieselben Angaben ein
 * Suchspiel.
 *
 * Das Bild ist Beiwerk (P6): fehlt es, rueckt der Text auf die volle Breite
 * und der Streifen steht trotzdem.
 */
export default {
  name: 'streifen',
  label: 'Streifen (Bild und Thema)',
  schema: {
    titel:     { type: 'text',  default: '', label: 'Überschrift' },
    text:      { type: 'longtext', default: '', label: 'Text' },
    bild:      { type: 'image', default: '', label: 'Bild' },
    bildAlt:   { type: 'text',  default: '', label: 'Alt-Text (Pflicht, wenn ein Bild steht)' },
    logo:      { type: 'image', default: '', label: 'Logo über der Überschrift' },
    logoAlt:   { type: 'text',  default: '', label: 'Alt-Text des Logos' },
    zeilen:    { type: 'liste', default: [],
                 label: 'Auskunftszeilen: label, wert (ein Text oder eine Liste für mehrere Zeilen)' },
    fussnote:  { type: 'text',  default: '', label: 'Kleingedrucktes unter den Zeilen' },
    linkLabel: { type: 'text',  default: '', label: 'Link' },
    linkHref:  { type: 'text',  default: '', label: 'Ziel des Links' },
    seite:     { type: 'auswahl', default: 'links', label: 'Bild steht',
                 optionen: ['links', 'rechts'] },
    grund:     { type: 'auswahl', default: 'weiss', label: 'Hintergrund',
                 optionen: ['weiss', 'ruhig'] },
  },
  css: `
    /* Zwei gleiche Haelften. minmax(0,1fr) statt 1fr: ohne die Null als
       Minimum weigert sich eine Grid-Spalte, unter ihren Inhalt zu
       schrumpfen — ein breites Bild sprengt dann die Zeile. */
    .streifen__gitter { display: grid; gap: var(--raum-4);
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: stretch; }
    .streifen__leib { align-self: center; }
    .streifen--rechts .streifen__bild { order: 2; }

    /* Das Bild fuellt die Hoehe der Textspalte: beide Kanten oben und unten
       schliessen buendig ab, statt dass ein 4:3-Bild in der Mitte schwebt.
       Die Mindesthoehe haelt es auch neben kurzem Text ein Bild. */
    .streifen__bild { position: relative; min-height: 280px; }
    .streifen__bild img { position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; display: block; border-radius: var(--radius); }

    /* Das Logo des Partners, nicht unseres. Deshalb klein und ueber der
       Ueberschrift statt neben der Marke in der Kopfzeile: es sagt 'das
       hier betreibt jemand anderes'. Hoehe begrenzt, Breite frei — ein
       Querformat-Logo soll nicht auf Quadrat gequetscht werden. */
    .streifen__logo { display: block; max-height: 72px; width: auto;
      max-width: 240px; margin-bottom: var(--raum-2); }

    .streifen__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: var(--raum-2); }
    .streifen__text { font-size: var(--fs-md); line-height: 1.65;
      color: var(--text); margin-bottom: var(--raum-3); }

    /* Label und Wert in einer Zeile, der Wert rechts an der Kante. Bei
       Oeffnungszeiten stehen die Zeitspannen damit untereinander und man
       sieht auf einen Blick, welcher Tag aus der Reihe faellt. */
    .streifen__zeilen { list-style: none; padding: 0; margin: 0;
      border-top: 1px solid var(--linie); }
    .streifen__zeile { display: flex; justify-content: space-between;
      gap: var(--raum-2); padding: 7px 0;
      border-bottom: 1px solid var(--linie); font-size: var(--fs-sm);
      /* Eng gesetzt: mit der Zeilenhoehe des Fliesstextes standen Mittag und Abend
         eine Leerzeile auseinander und der Block wurde hoeher als das Bild. */
      line-height: 1.35; }
    .streifen__label { color: var(--text-leise); }
    /* Der Wert darf mehrere Zeilen haben. Bei Oeffnungszeiten stehen
       Mittag und Abend dann UNTEREINANDER und beide rechtsbuendig — als
       eine Zeile mit Mitteltrenner brach der Umbruch an beliebiger Stelle
       und 'Uhr' landete allein in der zweiten Zeile. */
    .streifen__wert { text-align: right; font-weight: 600;
      display: flex; flex-direction: column; gap: 0; }

    .streifen__fussnote { font-size: 14px; color: var(--text-leise);
      margin-top: var(--raum-2); line-height: 1.55; }

    .streifen__mehr { display: inline-block; margin-top: var(--raum-3);
      font-size: var(--fs-md); color: var(--signal); text-decoration: none;
      border-bottom: 1px solid transparent; }
    .streifen__mehr:hover { border-bottom-color: var(--signal); }

    /* Unter 760 px untereinander. Das Bild bleibt oben — auch in der
       Fassung 'rechts': auf dem Telefon gibt es kein Rechts, und ein Bild
       NACH dem Text waere dort ein Nachklapp ohne Aufgabe. */
    @media (max-width: 760px) {
      .streifen__gitter { grid-template-columns: 1fr; gap: var(--raum-3); }
      .streifen__bild { min-height: 0; }
      .streifen__bild img { position: static; height: auto; aspect-ratio: 4 / 3; }
      .streifen--rechts .streifen__bild { order: 0; }
    }
  `,
  render(data) {
    const b = ziel(data.bild);
    const l = ziel(data.linkHref);
    const extern = l && istExtern(l) ? raw(' target="_blank" rel="noopener noreferrer"') : '';

    const zeilen = (data.zeilen || []).map((z) => {
      const werte = Array.isArray(z.wert) ? z.wert : [z.wert];
      return html`<li class="streifen__zeile">
        <span class="streifen__label">${z.label}</span>
        <span class="streifen__wert">${werte.map((w) => html`<span>${w}</span>`)}</span>
      </li>`;
    });

    const lg = ziel(data.logo);
    const inhalt = html`<div class="streifen__leib">
      ${lg ? html`<img class="streifen__logo" src="${raw(escapeAttr(lg))}"
                       alt="${raw(escapeAttr(data.logoAlt || ''))}"
                       loading="lazy" decoding="async">` : ''}
      ${data.titel ? html`<h2 class="streifen__titel">${data.titel}</h2>` : ''}
      ${data.text ? html`<p class="streifen__text">${markdownInline(data.text)}</p>` : ''}
      ${zeilen.length ? html`<ul class="streifen__zeilen">${zeilen}</ul>` : ''}
      ${data.fussnote ? html`<p class="streifen__fussnote">${markdownInline(data.fussnote)}</p>` : ''}
      ${data.linkLabel && l
        ? html`<a class="streifen__mehr" href="${raw(escapeAttr(l))}"${extern}>${data.linkLabel} →</a>`
        : ''}
    </div>`;

    // Ohne Bild kein Gitter: eine leere Haelfte waere ein Loch, kein Layout.
    if (!b) {
      return html`<section class="section${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}">
        <div class="container">${inhalt}</div></section>`;
    }

    return html`
      <section class="section streifen${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}${raw(
        data.seite === 'rechts' ? ' streifen--rechts' : '')}"><div class="container">
        <div class="streifen__gitter">
          <div class="streifen__bild">
            <img src="${raw(escapeAttr(b))}" alt="${raw(escapeAttr(data.bildAlt || ''))}"
                 loading="lazy" decoding="async">
          </div>
          ${inhalt}
        </div>
      </div></section>`;
  },
};
