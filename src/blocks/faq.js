import { html, raw, markdownInline } from './_util.js';

export default {
  name: 'faq',
  label: 'Fragen und Antworten',
  schema: {
    titel:  { type: 'text',  default: '', label: 'Überschrift' },
    fragen: { type: 'liste', default: [], label: 'Fragen: frage, antwort' },
    grund:  { type: 'auswahl', default: 'weiss', label: 'Hintergrund', optionen: ['weiss', 'ruhig'] },
  },
  css: `
    .faq__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: var(--raum-3); }
    .faq details { border-top: 1px solid var(--linie); max-width: var(--breite-text); }
    .faq details:last-of-type { border-bottom: 1px solid var(--linie); }
    .faq summary { cursor: pointer; padding: var(--raum-2) 0; font-size: 17px;
      font-weight: 500; list-style: none; display: flex; gap: var(--raum-2);
      align-items: baseline; }
    .faq summary::-webkit-details-marker { display: none; }
    .faq summary::before { content: '+'; color: var(--signal); font-weight: 400;
      font-size: 20px; line-height: 1; flex: none; width: 14px;
      transition: transform .15s ease; }
    .faq details[open] summary::before { content: '–'; }
    .faq summary:hover { color: var(--signal); }
    .faq__antwort { padding: 0 0 var(--raum-3) 26px; color: var(--text-leise); }
    .faq__antwort a { color: var(--signal); }
  `,
  render(data) {
    const fragen = (data.fragen || []).map((f) => html`
      <details>
        <summary>${f.frage}</summary>
        <div class="faq__antwort">${markdownInline(f.antwort)}</div>
      </details>`);
    return html`
      <section class="section faq${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}"><div class="container">
        ${data.titel ? html`<h2 class="faq__titel">${data.titel}</h2>` : ''}
        ${fragen}
      </div></section>`;
  },
};
