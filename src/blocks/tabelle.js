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
    .tabelle__titel { font-size: clamp(22px, 2.6vw, 28px); margin-bottom: var(--raum-3); }
    .tabelle__rahmen { overflow-x: auto; }
    .tabelle table { width: 100%; border-collapse: collapse; font-size: 16px; min-width: 460px; }
    .tabelle th, .tabelle td { text-align: left; padding: 10px 14px 10px 0;
      border-bottom: 1px solid var(--linie); }
    .tabelle th { font-size: 12px; font-weight: 500; color: var(--text-leise);
      text-transform: uppercase; letter-spacing: .07em; white-space: nowrap; }
    .tabelle tbody tr:hover { background: var(--flaeche); }
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
