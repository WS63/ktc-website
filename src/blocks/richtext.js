import { html, raw, markdownInline } from './_util.js';

export default {
  name: 'richtext',
  label: 'Fließtext',
  schema: {
    titel:    { type: 'text',     default: '', label: 'Überschrift' },
    absaetze: { type: 'liste',    default: [], label: 'Absätze — **fett**, *kursiv*, [Text](/ziel/)' },
  },
  css: `
    .text__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: var(--raum-3); max-width: 24ch; }
    .text__koerper { max-width: var(--breite-text); }
    .text__koerper p + p { margin-top: var(--raum-2); }
    .text__koerper a { color: var(--signal); text-decoration: none;
      border-bottom: 1px solid var(--signal); }
    .text__koerper a:hover { color: var(--signal-hover); border-color: var(--signal-hover); }
  `,
  render(data) {
    const absaetze = (data.absaetze || []).map((a) => html`<p>${markdownInline(a)}</p>`);
    return html`
      <section class="section"><div class="container">
        ${data.titel ? html`<h2 class="text__titel">${data.titel}</h2>` : ''}
        <div class="text__koerper">${absaetze}</div>
      </div></section>`;
  },
};
