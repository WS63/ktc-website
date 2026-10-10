import { html, raw, markdownInline } from './_util.js';

export default {
  name: 'preise',
  label: 'Preistabelle',
  schema: {
    titel:    { type: 'text',  default: '', label: 'Überschrift' },
    spalte1:  { type: 'text',  default: '', label: 'Kopf linke Spalte' },
    spalte2:  { type: 'text',  default: '', label: 'Kopf rechte Spalte' },
    zeilen:   { type: 'liste', default: [], label: 'Zeilen: label, wert, hervor' },
    fussnoten:{ type: 'liste', default: [], label: 'Fußnoten — in der Reihenfolge der Ziffern' },
    hinweis:  { type: 'longtext', default: '', label: 'Hinweis darunter' },
    grund:    { type: 'auswahl', default: 'weiss', label: 'Hintergrund', optionen: ['weiss', 'ruhig'] },
  },
  css: `
    .preise__titel { font-size: clamp(26px, 3.2vw, 36px); font-weight: 400;
      letter-spacing: 0; color: var(--text-leise); margin-bottom: var(--raum-3); }

    /* Streifen statt Linien. Eine Linie trennt zwei Zeilen, ein Streifen
       fasst eine Zeile zusammen — bei Betrag und Bezeichnung weit
       auseinander ist das der Unterschied zwischen Lesen und Suchen.
       Die Tabelle geht ueber die volle Breite: der Betrag soll rechts
       stehen, nicht in der Mitte der Seite haengen. */
    .preise table { width: 100%; border-collapse: collapse; font-size: var(--fs-md); }
    .preise th, .preise td { text-align: left; padding: 13px var(--raum-2); }
    .preise th { font-size: 12px; font-weight: 500; color: var(--text-leise);
      text-transform: uppercase; letter-spacing: .07em;
      border-bottom: 1px solid var(--linie); }
    .preise tbody tr:nth-child(odd) { background: var(--flaeche); }
    /* Auf ruhiger Flaeche kippt der Streifen auf Weiss — sonst waere er
       unsichtbar und die Tabelle verloere ihre Gliederung. */
    .section--ruhig .preise tbody tr:nth-child(odd),
    .preise.section--ruhig tbody tr:nth-child(odd) { background: var(--grund); }
    .preise td.wert, .preise th.wert { text-align: right;
      font-variant-numeric: tabular-nums; white-space: nowrap; }

    /* Die hervorgehobene Zeile traegt eine Kante, keine Flaeche: mit Flaeche
       waere sie ein dritter Streifentyp und das Muster bräche. */
    .preise tr.hervor td { font-weight: 600; }
    .preise tr.hervor td:first-child { box-shadow: inset 3px 0 0 var(--signal); }

    .preise__fussnoten { margin-top: var(--raum-3); max-width: var(--breite-text); }
    .preise__fussnoten li { font-size: var(--fs-sm); color: var(--text-leise);
      line-height: 1.6; list-style: none; display: flex; gap: 8px; }
    .preise__fussnoten li + li { margin-top: 6px; }
    .preise__fussnoten ol { padding: 0; margin: 0; }
    .preise__ziffer { color: var(--text-still); flex: none; }

    .hinweis { border-left: 3px solid var(--signal); background: var(--flaeche);
      padding: var(--raum-2) var(--raum-3); margin-top: var(--raum-3);
      font-size: var(--fs-sm); max-width: var(--breite-text); }
    .section--ruhig .hinweis { background: var(--grund); }
  `,
  render(data) {
    const zeilen = (data.zeilen || []).map((z) => html`
      <tr class="${z.hervor ? 'hervor' : ''}">
        <td>${z.label}${z.fussnote ? raw(`<sup>${HOCH[z.fussnote] || z.fussnote}</sup>`) : ''}</td>
        <td class="wert">${z.wert}</td>
      </tr>`);

    const noten = (data.fussnoten || []).map((t, i) => html`<li>
      <span class="preise__ziffer" aria-hidden="true">${raw(HOCH[i + 1] || String(i + 1))}</span>
      <span>${markdownInline(t)}</span>
    </li>`);

    // Ein Kopf nur, wenn eine der Spalten benannt ist. Eine leere Kopfzeile
    // ueber einer Preisliste ist ein Strich ohne Aussage.
    const kopf = data.spalte1 || data.spalte2
      ? html`<thead><tr><th>${data.spalte1}</th><th class="wert">${data.spalte2}</th></tr></thead>`
      : '';

    return html`
      <section class="section preise${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}"><div class="container">
        ${data.titel ? html`<h2 class="preise__titel">${data.titel}</h2>` : ''}
        <table>${kopf}<tbody>${zeilen}</tbody></table>
        ${noten.length ? html`<ol class="preise__fussnoten">${noten}</ol>` : ''}
        ${data.hinweis ? html`<p class="hinweis">${markdownInline(data.hinweis)}</p>` : ''}
      </div></section>`;
  },
};

// Echte Hochzahlen statt <sup> mit verkleinerter Schrift: sie sind als
// Zeichen gemeint, bleiben beim Kopieren erhalten und ein Vorleser spricht
// sie nicht als Teil des Wortes mit.
const HOCH = { 1: '\u00b9', 2: '\u00b2', 3: '\u00b3', 4: '\u2074', 5: '\u2075' };
