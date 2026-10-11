import { html, raw, escapeAttr, ziel, markdownInline } from './_util.js';

/**
 * Termine — der Clubkalender.
 *
 * Wichtig: dieser Baustein entscheidet NICHT, welcher Termin vorbei ist.
 * renderPage() ist eine reine Funktion (P1) — ein `new Date()` hier drin
 * machte sie vom Tag abhaengig, und die Tests waeren im April gruen und im
 * Mai rot. Das Aussortieren passiert in src/routes/public.js, wo der
 * Zeitpunkt ohnehin bekannt ist. Der Baustein zeigt, was er bekommt.
 */

// Drei Arten, drei Zeichen. Die Unterscheidung laeuft ueber die FORM, nicht
// ueber die Farbe: Farbe ist in diesem Projekt knapp vergeben, und drei
// bunte Kreise untereinander waeren genau die Unruhe, die wir bei den
// Eckdaten schon einmal abgeraeumt haben.
export const ZEICHEN = {
  wettspiel: '<circle cx="12" cy="12" r="8.5"/><path d="M4.2 7.5a9 9 0 0 0 0 9M19.8 7.5a9 9 0 0 1 0 9"/>',
  verein:    '<path d="M4 9.5 12 4l8 5.5V20H4z"/><path d="M9.5 20v-6h5v6"/>',
  sonstiges: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.6"/>',
};

export default {
  name: 'termine',
  label: 'Termine',
  schema: {
    titel:    { type: 'text',  default: '', label: 'Überschrift' },
    vorspann: { type: 'text',  default: '', label: 'Zeile darunter' },
    // Kommt aus inhalte/termine.json (P3) — nie hier von Hand gepflegt.
    termine:  { type: 'auto', default: [],
                label: 'Termine — kommen aus inhalte/termine.json' },
    stand:    { type: 'auto',  default: '', label: 'Hinweis zur Herkunft der Spieltermine — kommt aus dem Import' },
    leerText: { type: 'text',  default: 'Zurzeit stehen keine Termine an.',
                label: 'Text, wenn nichts ansteht' },
    anzahl:   { type: 'text',  default: '', label: 'Höchstens so viele zeigen — leer heißt alle' },
    mehrLabel:{ type: 'text',  default: '', label: 'Link unter der Liste' },
    mehrHref: { type: 'text',  default: '', label: 'Ziel des Links' },
  },
  css: `
    .termine__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: 4px; }
    .termine__vorspann { font-size: var(--fs-sm); color: var(--text-leise);
      margin-bottom: var(--raum-3); max-width: var(--breite-text); }
    .termin { display: flex; gap: var(--raum-3); padding: var(--raum-3) 0;
      border-top: 1px solid var(--linie); max-width: var(--breite-text);
      align-items: flex-start; }

    /* Datum und Uhrzeit stehen in einer eigenen Spalte mit fester Breite.
       Ohne sie saessen die Titel je nach Laenge des Datums anders — bei
       zwanzig Zeilen untereinander faellt das sofort auf. */
    .termin__wann { flex: none; min-width: 104px; padding-top: 2px; }
    .termin__tag { font-size: var(--fs-md); font-weight: 600; line-height: 1.2;
      display: block; }
    .termin__zeit { font-size: 14px; color: var(--text-leise); display: block;
      margin-top: 2px; }

    .termin__zeichen { flex: none; width: 24px; height: 24px; margin-top: 2px;
      color: var(--signal); }
    .termin__zeichen svg { width: 100%; height: 100%; display: block;
      fill: none; stroke: currentColor; stroke-width: 1.6;
      stroke-linecap: round; stroke-linejoin: round; }

    .termin h3 { font-size: var(--fs-md); margin-bottom: 3px; }
    .termin p { font-size: var(--fs-sm); color: var(--text-leise); line-height: 1.6; }
    /* Die Mannschaften eines Termins, in zwei Gruppen: Heimspiele zuerst,
       dann Auswaertsspiele. Kleiner und leiser als der Text darueber, damit
       der Termin die Zeile bleibt und die Liste Beiwerk. */
    .termin__gruppe { margin-top: 10px; }
    .termin__gruppe h4 { font-size: 12px; font-weight: 600; text-transform: uppercase;
      letter-spacing: .07em; color: var(--text-leise); margin: 0 0 3px; }
    /* Eine Paarung ist eine Tabellenzeile: Heimmannschaft - Gastmannschaft.
       Als Tabelle, weil die Spalten dann von selbst auf der laengsten Zelle
       einrasten und der Strich in jeder Zeile an derselben Stelle steht —
       genau die Ausrichtung, die ein Tabulator geben wuerde. Und es IST eine
       Tabelle: zwei Mannschaften je Zeile, vom Vorleser als solche gelesen. */
    .termin__paarungen { border-collapse: collapse; font-size: 15px; line-height: 1.55; }
    .termin__paarungen td { padding: 1px 0; vertical-align: baseline; }
    .termin__paarungen td:first-child { padding-right: .6em; }
    .termin__paarungen td.trenner { padding-right: .6em; color: var(--text-still); }
    .termin__paarungen .wir { font-weight: 600; }
    .termin__paarungen .sie { color: var(--text-leise); }
    /* Spielgemeinschaft mit Partnervereinen. Ein Wort-Etikett, keine Farbe:
       die Unterscheidung muss auch im Schwarzweissdruck des Aushangs bleiben. */
    .termin__msg { display: inline-block; font-size: 12px; font-weight: 600;
      letter-spacing: .04em; color: var(--signal); border: 1px solid var(--linie-aktiv);
      border-radius: 3px; padding: 0 5px; margin: 0 4px; white-space: nowrap; }
    .termine__stand { font-size: 14px; color: var(--text-leise); margin-top: var(--raum-3);
      max-width: var(--breite-text); }
    .termin__ort { font-size: 14px; color: var(--text-leise); margin-top: 6px;
      display: block; }
    .termine__mehr { display: inline-block; margin-top: var(--raum-3);
      font-size: var(--fs-md); color: var(--signal); text-decoration: none;
      border-bottom: 1px solid transparent; }
    .termine__mehr:hover { border-bottom-color: var(--signal); }

    @media (max-width: 560px) {
      .termin { flex-wrap: wrap; gap: var(--raum-2); }
      .termin__wann { min-width: 0; }
      .termin__zeichen { order: -1; }
    }
  `,
  render(data) {
    const alle = data.termine || [];
    const grenze = Number(data.anzahl) > 0 ? Number(data.anzahl) : alle.length;
    const liste = alle.slice(0, grenze);
    const mehr = ziel(data.mehrHref);

    const kopf = html`
      ${data.titel ? html`<h2 class="termine__titel">${data.titel}</h2>` : ''}
      ${data.vorspann ? html`<p class="termine__vorspann">${data.vorspann}</p>` : ''}`;

    if (!liste.length) {
      return html`<section class="section"><div class="container">
        ${kopf}
        <p class="termine__vorspann">${data.leerText}</p>
      </div></section>`;
    }

    const zeilen = liste.map((t) => {
      const zeichen = ZEICHEN[t.art] || ZEICHEN.sonstiges;
      return html`<article class="termin">
        <span class="termin__zeichen" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">${raw(zeichen)}</svg>
        </span>
        <div class="termin__wann">
          <span class="termin__tag">${t.tag || t.datum}</span>
          ${t.uhrzeit ? html`<span class="termin__zeit">${t.uhrzeit} Uhr</span>` : ''}
        </div>
        <div>
          <h3>${t.titel}</h3>
          ${t.text ? html`<p>${markdownInline(t.text)}</p>` : ''}
          ${(t.gruppen || []).map((g) => html`<div class="termin__gruppe">
            <h4>${g.titel}</h4>
            <table class="termin__paarungen"><tbody>${g.zeilen.map((z) => {
              const wir = html`<span class="wir">${z.mannschaft}</span>${
                z.sg ? html` <span class="termin__msg" title="Spielgemeinschaft mit Partnervereinen">MSG ${z.sg}</span>` : ''}`;
              const sie = html`<span class="sie">${z.gegner}</span>`;
              // Die Heimmannschaft steht IMMER links, wie beim Verband — im
              // Heimspiel sind das wir, im Auswaertsspiel der Gegner.
              return g.zuhause
                ? html`<tr><td>${wir}</td><td class="trenner">-</td><td>${sie}</td></tr>`
                : html`<tr><td>${sie}</td><td class="trenner">-</td><td>${wir}</td></tr>`;
            })}</tbody></table>
          </div>`)}
          ${t.ort ? html`<span class="termin__ort">${t.ort}</span>` : ''}
        </div>
      </article>`;
    });

    return html`
      <section class="section"><div class="container">
        ${kopf}
        <div>${zeilen}</div>
        ${data.stand && liste.some((t) => (t.gruppen || []).length)
          ? html`<p class="termine__stand">${data.stand}</p>` : ''}
        ${data.mehrLabel && mehr
          ? html`<a class="termine__mehr" href="${raw(escapeAttr(mehr))}">${data.mehrLabel} →</a>`
          : ''}
      </div></section>`;
  },
};
