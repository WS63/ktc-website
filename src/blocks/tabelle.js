import { html, markdownInline } from './_util.js';

export default {
  name: 'tabelle',
  label: 'Tabelle',
  schema: {
    titel:   { type: 'text',  default: '', label: 'Überschrift' },
    kopf:    { type: 'liste', default: [], label: 'Spaltenüberschriften' },
    zeilen:  { type: 'liste', default: [], label: 'Zeilen — je Zeile die Zellen, durch · getrennt' },
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
  `,
  render(data) {
    const kopf = (data.kopf || []).map((k) => html`<th>${k}</th>`);
    const zeilen = (data.zeilen || []).map((z) =>
      html`<tr>${(z || []).map((c) => html`<td>${c}</td>`)}</tr>`);
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
