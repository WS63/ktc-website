import { html, raw, markdownInline } from './_util.js';

export default {
  name: 'preise',
  label: 'Preistabelle',
  schema: {
    titel:    { type: 'text',  default: '', label: 'Überschrift' },
    spalte1:  { type: 'text',  default: '', label: 'Kopf linke Spalte' },
    spalte2:  { type: 'text',  default: '', label: 'Kopf rechte Spalte' },
    zeilen:   { type: 'liste', default: [], label: 'Zeilen: label, wert, hervor' },
    hinweis:  { type: 'longtext', default: '', label: 'Hinweis darunter' },
    grund:    { type: 'auswahl', default: 'weiss', label: 'Hintergrund', optionen: ['weiss', 'ruhig'] },
  },
  css: `
    .preise__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: var(--raum-3); }
    .preise table { width: 100%; border-collapse: collapse; font-size: 16px;
      max-width: var(--breite-text); }
    .preise th, .preise td { text-align: left; padding: 11px 0; border-bottom: 1px solid var(--linie); }
    .preise th { font-size: 12px; font-weight: 500; color: var(--text-leise);
      text-transform: uppercase; letter-spacing: .07em; }
    .preise td.wert, .preise th.wert { text-align: right;
      font-variant-numeric: tabular-nums; white-space: nowrap; }
    .preise tr.hervor td { background: var(--signal-leise); font-weight: 500; }
    .preise tr.hervor td:first-child { border-left: 3px solid var(--signal); padding-left: 12px; }
    .section--ruhig tr.hervor td { background: var(--grund); }
    .section--ruhig .hinweis { background: var(--grund); }
    .hinweis { border-left: 3px solid var(--signal); background: var(--flaeche);
      padding: var(--raum-2) var(--raum-3); margin-top: var(--raum-3);
      font-size: 15px; max-width: var(--breite-text); }
  `,
  render(data) {
    const zeilen = (data.zeilen || []).map((z) => html`
      <tr class="${z.hervor ? 'hervor' : ''}"><td>${z.label}</td><td class="wert">${z.wert}</td></tr>`);
    return html`
      <section class="section preise${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}"><div class="container">
        ${data.titel ? html`<h2 class="preise__titel">${data.titel}</h2>` : ''}
        <table>
          <thead><tr><th>${data.spalte1}</th><th class="wert">${data.spalte2}</th></tr></thead>
          <tbody>${zeilen}</tbody>
        </table>
        ${data.hinweis ? html`<p class="hinweis">${markdownInline(data.hinweis)}</p>` : ''}
      </div></section>`;
  },
};
