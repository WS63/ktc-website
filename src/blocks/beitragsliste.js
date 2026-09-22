import { html, raw, escapeAttr, ziel } from './_util.js';

export default {
  name: 'beitragsliste',
  label: 'Beiträge — holt sich die Liste selbst',
  schema: {
    titel:    { type: 'text', default: '', label: 'Überschrift' },
    // eintraege kommt aus der Datenbank (P3) — nie von Hand gepflegt
    eintraege:{ type: 'auto', default: [], label: 'Beiträge — kommen aus der Datenbank' },
    leerText: { type: 'text', default: 'Noch keine Beiträge.', label: 'Text, wenn nichts da ist' },
  },
  css: `
    .liste__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: 4px; }
    .liste__zaehler { font-size: 15px; color: var(--text-leise); margin-bottom: var(--raum-3); }
    .eintrag { display: flex; gap: var(--raum-3); padding: var(--raum-2) 0;
      border-top: 1px solid var(--linie); max-width: var(--breite-text); }
    .eintrag__datum { font-size: 14px; color: var(--text-leise);
      white-space: nowrap; min-width: 88px; padding-top: 3px; }
    .eintrag h3 { font-size: 17px; margin-bottom: 3px; }
    .eintrag h3 a { color: var(--text); text-decoration: none; }
    .eintrag h3 a:hover { color: var(--signal); }
    .eintrag p { font-size: 15px; color: var(--text-leise); line-height: 1.6; }
    .thema { display: inline-block; margin-top: 8px; font-size: 13px; color: var(--signal);
      background: var(--signal-leise); padding: 2px 9px; border-radius: 3px; }
    @media (max-width: 560px) { .eintrag { flex-direction: column; gap: 4px; } }
  `,
  render(data) {
    const liste = data.eintraege || [];
    const n = liste.length;
    if (!n) {
      return html`<section class="section"><div class="container">
        ${data.titel ? html`<h2 class="liste__titel">${data.titel}</h2>` : ''}
        <p class="liste__zaehler">${data.leerText}</p>
      </div></section>`;
    }
    const eintraege = liste.map((e) => {
      const z = ziel(e.href);
      return html`<article class="eintrag">
        <div class="eintrag__datum">${e.datum}</div>
        <div>
          <h3>${z ? html`<a href="${raw(escapeAttr(z))}">${e.titel}</a>` : e.titel}</h3>
          ${e.text ? html`<p>${e.text}</p>` : ''}
          ${e.thema ? html`<span class="thema">${e.thema}</span>` : ''}
        </div>
      </article>`;
    });
    // P3: die Zahl wird gerechnet, nie getippt
    return html`
      <section class="section"><div class="container">
        ${data.titel ? html`<h2 class="liste__titel">${data.titel}</h2>` : ''}
        <p class="liste__zaehler">${n} ${n === 1 ? 'Beitrag' : 'Beiträge'}</p>
        <div>${eintraege}</div>
      </div></section>`;
  },
};
