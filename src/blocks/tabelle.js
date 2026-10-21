import { html, raw, escapeAttr, ziel, istExtern, markdownInline } from './_util.js';

export default {
  name: 'tabelle',
  label: 'Tabelle',
  schema: {
    titel:   { type: 'text',  default: '', label: 'Überschrift' },
    kopf:    { type: 'liste', default: [], label: 'Spaltenüberschriften' },
    zeilen:  { type: 'liste', default: [],
               label: 'Zeilen — je Zeile die Zellen. Eine Zelle ist Text oder { text, href }' },
    hinweis: { type: 'longtext', default: '', label: 'Hinweis darunter' },
    legende: { type: 'longtext', default: '', label: 'Erklärung über der Tabelle (zum Beispiel was eine Spalte bedeutet)' },
    spalten: { type: 'auto', default: [], label: 'Gruppen in zwei Spalten — kommen aus inhalte/mannschaften/' },
  },
  css: `
    /* Dasselbe Design wie die Beitragstabelle (Baustein 'preise'): Streifen
       statt Linien, volle Breite, ruhige Ueberschrift. Zwei Tabellen auf
       derselben Website sollen nicht aussehen, als haetten zwei Leute sie
       gebaut. Eine Linie trennt zwei Zeilen, ein Streifen fasst eine Zeile
       zusammen — bei vier Spalten ist das der Unterschied zwischen Lesen und
       Suchen. */
    .tabelle__titel { font-size: clamp(26px, 3.2vw, 36px); font-weight: 400;
      letter-spacing: 0; color: var(--text-leise); margin-bottom: var(--raum-3); }
    .tabelle__rahmen { overflow-x: auto; }
    .tabelle table { width: 100%; border-collapse: collapse; font-size: var(--fs-md);
      min-width: 520px; }
    .tabelle th, .tabelle td { text-align: left; padding: 13px var(--raum-2); }
    .tabelle th { font-size: 12px; font-weight: 500; color: var(--text-leise);
      text-transform: uppercase; letter-spacing: .07em; white-space: nowrap;
      border-bottom: 1px solid var(--linie); }
    .tabelle tbody tr:nth-child(odd) { background: var(--flaeche); }
    .section--ruhig .tabelle tbody tr:nth-child(odd),
    .tabelle.section--ruhig tbody tr:nth-child(odd) { background: var(--grund); }
    .tabelle td a { color: var(--signal); text-decoration: none;
      border-bottom: 1px solid transparent; }
    .tabelle td a:hover { border-bottom-color: var(--signal); }
    .tabelle .hinweis { margin-top: var(--raum-3); }
    .tabelle__legende { margin: calc(-1 * var(--raum-1)) 0 var(--raum-4); font-size: var(--fs-sm);
      color: var(--text-leise); max-width: 78ch; line-height: 1.55; }

    /* Gruppen in zwei Spalten (Mannschaften): kuerzer zu scrollen, und die Gruppe ist schon die halbe Antwort.
       ALLE Zeilen sind gleich hoch (Platz fuer zwei Zeilen: Name und darunter die Spielgemeinschaft). Eine
       Zwischenzeile (zum Beispiel 'Mixed') ist ebenfalls eine Zeile dieser Hoehe; haben beide Spalten gleich viele
       Zeilen, enden sie unten buendig. */
    .tabelle--gruppen .tabelle__titel { margin-bottom: var(--raum-4); }
    .tabelle__spalten { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 500px), 1fr)); gap: var(--raum-5); align-items: start; }
    .tabelle__gruppe { margin-bottom: var(--raum-4); }
    .tabelle__gruppe:last-child { margin-bottom: 0; }
    .tabelle__gruppentitel { font-size: var(--fs-lg, 20px); font-weight: 600; margin: 0 0 var(--raum-2); }
    .tabelle--gruppen table { min-width: 0; }
    .tabelle--gruppen th, .tabelle--gruppen td { padding: 4px 10px; line-height: 1.4; }
    .tabelle--gruppen td { height: 54px; vertical-align: middle; }
    .tabelle--gruppen td a { white-space: nowrap; }
    .tabelle--gruppen th { font-size: 13px; font-weight: 600; color: var(--text); background: var(--signal-leise);
      border-bottom: 0; letter-spacing: .05em; }
    .tabelle--gruppen td:nth-child(2) { white-space: nowrap; }
    .tabelle__zusatz { display: block; font-size: 13px; color: var(--text-leise); line-height: 1.2; }
    .tabelle__zwischen th { height: 54px; background: transparent; font-size: var(--fs-lg, 20px); font-weight: 600;
      letter-spacing: 0; text-transform: none; vertical-align: bottom; padding-bottom: 6px; }
    .tabelle--gruppen tbody tr.tabelle__zwischen { background: transparent; }
    @media (max-width: 860px) { .tabelle__spalten { grid-template-columns: 1fr; gap: 0; } }
    /* Das Pfeilchen sagt: hier verlaesst du die Website. Als ::after und nicht
       im Text, damit es nicht mitkopiert wird. */
    .tabelle td a[target]::after { content: ' ↗'; font-size: .85em;
      color: var(--text-still); }
  `,
  /**
   * Eine Zelle ist entweder schlichter Text oder { text, href }.
   *
   * Beides nebeneinander, weil die meisten Tabellen keine Links brauchen und
   * nicht umgeschrieben werden sollen, nur weil eine es tut. Ein ungueltiges
   * oder fehlendes Ziel faellt auf den reinen Text zurueck — eine Zelle
   * verschwindet nie, auch wenn der Link kaputt ist.
   */
  render(data) {
    const kopf = (data.kopf || []).map((k) => html`<th>${k}</th>`);
    // Eine Zeile ist eine Liste von Zellen, oder { zwischen: 'Titel' }: eine Zwischenueberschrift ueber die ganze Breite.
    const zeile = (z) => (z && !Array.isArray(z) && z.zwischen
      ? html`<tr class="tabelle__zwischen"><th colspan="${raw(String((data.kopf || []).length || 1))}">${z.zwischen}</th></tr>`
      : html`<tr>${(z || []).map((c) => html`<td>${zelle(c)}</td>`)}</tr>`);
    const tabelle = (zeilen) => html`<div class="tabelle__rahmen"><table><thead><tr>${kopf}</tr></thead><tbody>${
      (zeilen || []).map(zeile)}</tbody></table></div>`;
    const spalten = (data.spalten || []).filter((sp) => (sp || []).some((g) => g?.zeilen?.length));
    const inhalt = spalten.length
      ? html`<div class="tabelle__spalten">${spalten.map((sp) => html`<div class="tabelle__spalte">${(sp || []).filter((g) => g?.zeilen?.length).map((g) => html`
          <div class="tabelle__gruppe">${g.titel ? html`<h3 class="tabelle__gruppentitel">${g.titel}</h3>` : ''}${tabelle(g.zeilen)}</div>`)}</div>`)}</div>`
      : tabelle(data.zeilen);
    return html`
      <section class="section tabelle${raw(spalten.length ? ' tabelle--gruppen' : '')}"><div class="container">
        ${data.titel ? html`<h2 class="tabelle__titel">${data.titel}</h2>` : ''}
        ${data.legende ? html`<p class="tabelle__legende">${markdownInline(data.legende)}</p>` : ''}
        ${inhalt}
        ${data.hinweis ? html`<p class="hinweis">${markdownInline(data.hinweis)}</p>` : ''}
      </div></section>`;
  },
};

function zelle(c) {
  if (c == null) return '';
  if (typeof c !== 'object') return html`${c}`;
  // Ein Zusatz steht klein unter dem Text (zum Beispiel die Spielgemeinschaft unter dem Mannschaftsnamen).
  const zusatz = c.zusatz ? html`<span class="tabelle__zusatz">${c.zusatz}</span>` : '';
  const z = ziel(c.href);
  if (!z) return html`${c.text ?? ''}${zusatz}`;
  const extern = istExtern(z) ? raw(' target="_blank" rel="noopener noreferrer"') : '';
  return html`<a href="${raw(escapeAttr(z))}"${extern}>${c.text ?? z}</a>${zusatz}`;
}
