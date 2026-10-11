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
    const zeilen = (data.zeilen || []).map((z) =>
      html`<tr>${(z || []).map((c) => html`<td>${zelle(c)}</td>`)}</tr>`);
    return html`
      <section class="section tabelle"><div class="container">
        ${data.titel ? html`<h2 class="tabelle__titel">${data.titel}</h2>` : ''}
        <div class="tabelle__rahmen">
          <table><thead><tr>${kopf}</tr></thead><tbody>${zeilen}</tbody></table>
        </div>
        ${data.hinweis ? html`<p class="hinweis">${markdownInline(data.hinweis)}</p>` : ''}
      </div></section>`;
  },
};

function zelle(c) {
  if (c == null) return '';
  if (typeof c !== 'object') return html`${c}`;
  const z = ziel(c.href);
  if (!z) return html`${c.text ?? ''}`;
  const extern = istExtern(z) ? raw(' target="_blank" rel="noopener noreferrer"') : '';
  return html`<a href="${raw(escapeAttr(z))}"${extern}>${c.text ?? z}</a>`;
}
