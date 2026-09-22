import { html, raw, escapeAttr, ziel } from './_util.js';

export default {
  name: 'galerie',
  label: 'Bilderreihe',
  schema: {
    titel:  { type: 'text',  default: '', label: 'Überschrift' },
    bilder: { type: 'liste', default: [], label: 'Bilder: pfad, alt, unterschrift' },
  },
  css: `
    .galerie__titel { font-size: clamp(22px, 2.6vw, 28px); margin-bottom: var(--raum-3); }
    .galerie__gitter { display: grid; gap: var(--raum-2);
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
    .galerie figure { margin: 0; }
    .galerie img { aspect-ratio: 4 / 3; object-fit: cover; width: 100%; height: auto;
      border-radius: var(--radius); display: block; }
    .galerie figcaption { font-size: 14px; color: var(--text-leise); margin-top: 8px; }
  `,
  render(data) {
    const bilder = (data.bilder || []).map((b) => {
      const p = ziel(b.pfad);
      if (!p) return '';                       // P6: fehlt eines, fehlt eben eines
      return html`<figure>
        <img src="${raw(escapeAttr(p))}" alt="${raw(escapeAttr(b.alt || ''))}"
             loading="lazy" decoding="async">
        ${b.unterschrift ? html`<figcaption>${b.unterschrift}</figcaption>` : ''}
      </figure>`;
    });
    if (!bilder.filter(Boolean).length) return '';
    return html`
      <section class="section galerie"><div class="container">
        ${data.titel ? html`<h2 class="galerie__titel">${data.titel}</h2>` : ''}
        <div class="galerie__gitter">${bilder}</div>
      </div></section>`;
  },
};
