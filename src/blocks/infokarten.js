import { html, raw, markdownInline } from './_util.js';

export default {
  name: 'infokarten',
  label: 'Eckdaten',
  schema: {
    titel:  { type: 'text',  default: '', label: 'Überschrift' },
    karten: { type: 'liste', default: [], label: 'Eckdaten: label, wert, zusatz' },
    grund:  { type: 'auswahl', default: 'ruhig', label: 'Hintergrund', optionen: ['ruhig', 'weiss'] },
  },
  css: `
    .info__titel { font-size: clamp(22px, 2.6vw, 28px); margin-bottom: var(--raum-3); }
    .info__gitter { display: grid; gap: var(--raum-2);
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
    .info { background: var(--flaeche); border-radius: var(--radius); padding: var(--raum-3); }
    .section--ruhig .info { background: var(--grund); }
    .info__label { font-size: 12px; text-transform: uppercase; letter-spacing: .07em;
      color: var(--text-leise); margin-bottom: 6px; }
    .info__wert { font-size: 21px; font-weight: 500; line-height: 1.3; }
    .info__zusatz { font-size: 14px; color: var(--text-leise); margin-top: 6px; line-height: 1.5; }
  `,
  render(data) {
    const karten = (data.karten || []).map((k) => html`<div class="info">
      <p class="info__label">${k.label}</p>
      <p class="info__wert">${k.wert}</p>
      ${k.zusatz ? html`<p class="info__zusatz">${markdownInline(k.zusatz)}</p>` : ''}
    </div>`);
    return html`
      <section class="section${raw(data.grund === 'weiss' ? '' : ' section--ruhig')}"><div class="container">
        ${data.titel ? html`<h2 class="info__titel">${data.titel}</h2>` : ''}
        <div class="info__gitter">${karten}</div>
      </div></section>`;
  },
};
