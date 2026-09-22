import { html, raw, escapeAttr, ziel } from './_util.js';

export default {
  name: 'personen',
  label: 'Ansprechpartner',
  schema: {
    titel:    { type: 'text',  default: '', label: 'Überschrift' },
    vorspann: { type: 'longtext', default: '', label: 'Zeile darunter' },
    leute:    { type: 'liste', default: [], label: 'Personen: rolle, name, telefon, email' },
  },
  css: `
    .personen__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: 6px; }
    .personen__vorspann { color: var(--text-leise); margin-bottom: var(--raum-3); }
    .personen__gitter { display: grid; gap: var(--raum-2);
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
    .person { border: 1px solid var(--linie); border-radius: var(--radius); padding: var(--raum-3); }
    .person__rolle { font-size: 13px; text-transform: uppercase; letter-spacing: .07em;
      color: var(--signal); margin-bottom: 4px; }
    .person__name { font-size: 17px; font-weight: 500; margin-bottom: 10px; }
    .person__kontakt { font-size: 15px; }
    .person__kontakt a { color: var(--signal); text-decoration: none; display: block; }
    .person__kontakt a:hover { text-decoration: underline; }
  `,
  render(data) {
    const leute = (data.leute || []).map((p) => {
      const tel = ziel(`tel:${String(p.telefon || '').replace(/\s/g, '')}`);
      const mail = ziel(`mailto:${p.email || ''}`);
      return html`<article class="person">
        ${p.rolle ? html`<p class="person__rolle">${p.rolle}</p>` : ''}
        <p class="person__name">${p.name}</p>
        <div class="person__kontakt">
          ${p.telefon ? html`<a href="${raw(escapeAttr(tel))}">${p.telefon}</a>` : ''}
          ${p.email ? html`<a href="${raw(escapeAttr(mail))}">${p.email}</a>` : ''}
        </div>
      </article>`;
    });
    return html`
      <section class="section"><div class="container">
        ${data.titel ? html`<h2 class="personen__titel">${data.titel}</h2>` : ''}
        ${data.vorspann ? html`<p class="personen__vorspann">${data.vorspann}</p>` : ''}
        <div class="personen__gitter">${leute}</div>
      </div></section>`;
  },
};
