import { html, raw, escapeAttr, ziel } from './_util.js';

export default {
  name: 'cards',
  label: 'Karten',
  schema: {
    titel:  { type: 'text',  default: '', label: 'Überschrift' },
    karten: { type: 'liste', default: [], label: 'Karten: titel, text, linkLabel, linkHref, bild, bildAlt' },
    grund:  { type: 'auswahl', default: 'weiss', label: 'Hintergrund', optionen: ['weiss', 'ruhig'] },
  },
  css: `
    .karten__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: var(--raum-3); }
    .karten__gitter { display: grid; gap: var(--raum-3);
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
    .karte { display: flex; flex-direction: column; overflow: hidden;
      border: 1px solid var(--linie); border-radius: var(--radius);
      transition: border-color .15s ease, transform .15s ease; }
    .karte:has(a:hover) { border-color: var(--signal); transform: translateY(-2px); }
    /* Das Seitenverhaeltnis gehoert ans BILD, nicht an den Rahmen: sonst
       rechnet der Browser die Hoehe aus dem Bildinhalt und ein Hochformat
       sprengt die Karte. object-fit schneidet stattdessen sauber zu. */
    .karte__bild { background: var(--flaeche); }
    .karte__bild img { width: 100%; height: auto; aspect-ratio: 3 / 2;
      object-fit: cover; display: block; }
    .karte__leib { padding: var(--raum-3); display: flex; flex-direction: column; flex: 1; }
    .karte h3 { font-size: 18px; margin-bottom: 7px; }
    .karte p { font-size: 15px; color: var(--text-leise); line-height: 1.6; }
    .karte a { display: inline-block; margin-top: auto; padding-top: var(--raum-2);
      font-size: 15px; color: var(--signal); text-decoration: none; }
    .karte a:hover { text-decoration: underline; text-underline-offset: 3px; }
    /* Auf ruhiger Flaeche braucht die Karte selbst einen hellen Grund, sonst
       verschwindet sie darin. */
    .section--ruhig .karte { background: var(--grund); }
    /* Ohne Bild bleibt die farbige Kante als Anker. */
    .karte:not(:has(.karte__bild)) { border-top: 3px solid var(--signal);
      border-radius: 0 0 var(--radius) var(--radius); }
  `,
  render(data) {
    const karten = (data.karten || []).map((k) => {
      const z = ziel(k.linkHref);
      const b = ziel(k.bild);
      return html`<article class="karte">
        ${b ? html`<div class="karte__bild">
          <img src="${raw(escapeAttr(b))}" alt="${raw(escapeAttr(k.bildAlt || ''))}"
               loading="lazy" decoding="async"></div>` : ''}
        <div class="karte__leib">
          <h3>${k.titel}</h3>
          ${k.text ? html`<p>${k.text}</p>` : ''}
          ${k.linkLabel && z ? html`<a href="${raw(escapeAttr(z))}">${k.linkLabel} →</a>` : ''}
        </div>
      </article>`;
    });
    return html`
      <section class="section${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}"><div class="container">
        ${data.titel ? html`<h2 class="karten__titel">${data.titel}</h2>` : ''}
        <div class="karten__gitter">${karten}</div>
      </div></section>`;
  },
};
