import { html, raw, escapeAttr, ziel } from './_util.js';

export default {
  name: 'beitragsliste',
  label: 'Beiträge — holt sich die Liste selbst',
  schema: {
    titel:    { type: 'text', default: '', label: 'Überschrift' },
    // eintraege kommt aus der Datenbank (P3) — nie von Hand gepflegt
    eintraege:{ type: 'auto', default: [], label: 'Beiträge — kommen aus der Datenbank' },
    // Wie viele es insgesamt gibt. Nicht dasselbe wie eintraege.length: die
    // Startseite bekommt nur die neuesten paar Zeilen geliefert.
    gesamt:   { type: 'auto', default: 0, label: 'Gesamtzahl — kommt aus der Datenbank' },
    leerText: { type: 'text', default: 'Noch keine Beiträge.', label: 'Text, wenn nichts da ist' },
    anzahl:   { type: 'text', default: '', label: 'Höchstens so viele zeigen — leer heißt alle' },
    mehrLabel:{ type: 'text', default: '', label: 'Link unter der Liste' },
    mehrHref: { type: 'text', default: '', label: 'Ziel des Links' },
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
    .liste__mehr { display: inline-block; margin-top: var(--raum-3); font-size: var(--fs-md);
      color: var(--signal); text-decoration: none; border-bottom: 1px solid transparent; }
    .liste__mehr:hover { border-bottom-color: var(--signal); }
    @media (max-width: 560px) { .eintrag { flex-direction: column; gap: 4px; } }
  `,
  render(data) {
    const alle = data.eintraege || [];
    const n = alle.length;
    // Als Aufhaenger auf der Startseite reichen zwei Eintraege. Die Zahl steht
    // in den Daten, nicht im Baustein: dieselbe Liste ist auf /aktuelles/ die
    // vollstaendige Uebersicht (P3 — eine Quelle, mehrere Ansichten).
    const grenze = Number(data.anzahl) > 0 ? Number(data.anzahl) : n;
    const liste = alle.slice(0, grenze);
    // Was der Mensch sieht, ist die Gesamtzahl — nicht, wie viele Zeilen die
    // Abfrage geliefert hat.
    const gesamt = Number(data.gesamt) > 0 ? Number(data.gesamt) : n;
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
    const mehr = ziel(data.mehrHref);
    // P3: beide Zahlen werden gerechnet, nie getippt — auch die im Linktext.
    return html`
      <section class="section"><div class="container">
        ${data.titel ? html`<h2 class="liste__titel">${data.titel}</h2>` : ''}
        ${liste.length < gesamt
          ? ''
          : html`<p class="liste__zaehler">${gesamt} ${gesamt === 1 ? 'Beitrag' : 'Beiträge'}</p>`}
        <div>${eintraege}</div>
        ${data.mehrLabel && mehr
          ? html`<a class="liste__mehr" href="${raw(escapeAttr(mehr))}">${data.mehrLabel}${
              liste.length < gesamt ? ` (${gesamt})` : ''} →</a>`
          : ''}
      </div></section>`;
  },
};
