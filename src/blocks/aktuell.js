import { html, raw, escapeAttr, ziel } from './_util.js';

/**
 * Aktuell — die neuesten Beitraege und die naechsten Termine, nebeneinander.
 *
 * Der Baustein fuer das Mitglied auf der Startseite. Die Seite ist sonst fuer
 * den Interessenten gebaut, der einmal kommt; wer jede Woche kommt, will
 * wissen, was los war und was ansteht. Beides gehoert in eine Bildschirmhoehe.
 *
 * Er ist bewusst KEIN Knopf. Die eine Handlung der Seite bleibt 'Mitglied
 * werden'; zwei weitere gleich laute Flaechen haetten sie entwertet. Hier
 * stehen Inhalte, und die Links darunter sind Textlinks.
 *
 * Beide Listen sind 'auto': die Route holt sie aus derselben Quelle wie
 * /aktuelles/ und /kalender/ (P3). Der Baustein formatiert nichts und
 * entscheidet nichts — insbesondere nicht, welcher Termin vorbei ist (P1).
 */
export default {
  name: 'aktuell',
  label: 'Aktuell — Beiträge und Termine',
  schema: {
    beitraegeTitel: { type: 'text', default: 'Aus dem Verein', label: 'Überschrift links' },
    termineTitel:   { type: 'text', default: 'Nächste Termine', label: 'Überschrift rechts' },
    beitraege: { type: 'auto', default: [], label: 'Beiträge — kommen aus der Datenbank' },
    gesamt:    { type: 'auto', default: 0,  label: 'Zahl aller Beiträge — gerechnet' },
    termine:   { type: 'auto', default: [], label: 'Termine — kommen aus inhalte/termine.json' },
    anzahlBeitraege: { type: 'text', default: '2', label: 'So viele Beiträge zeigen' },
    anzahlTermine:   { type: 'text', default: '3', label: 'So viele Termine zeigen' },
    leerBeitraege: { type: 'text', default: 'Hier stehen bald die Neuigkeiten aus dem Verein.',
                     label: 'Text, wenn es keine Beiträge gibt' },
    leerTermine:   { type: 'text', default: 'Zurzeit steht nichts an.',
                     label: 'Text, wenn kein Termin ansteht' },
    beitraegeLabel: { type: 'text', default: 'Alle Beiträge', label: 'Link unter den Beiträgen' },
    beitraegeHref:  { type: 'text', default: '', label: 'Ziel dieses Links' },
    termineLabel:   { type: 'text', default: 'Alle Termine', label: 'Link unter den Terminen' },
    termineHref:    { type: 'text', default: '', label: 'Ziel dieses Links' },
  },
  css: `
    /* Links etwas mehr Platz: ein Beitrag hat Titel und Text, ein Termin
       nur Datum und Titel. minmax(0,...) damit lange Woerter die Spalte
       nicht aufsprengen. */
    .aktuell__gitter { display: grid; gap: var(--raum-5);
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); align-items: start; }
    .aktuell h2 { font-size: clamp(22px, 2.6vw, 28px); margin-bottom: var(--raum-2); }

    .aktuell__eintrag { padding: var(--raum-2) 0; border-top: 1px solid var(--linie); }
    .aktuell__beitrag { display: flex; gap: var(--raum-2); align-items: flex-start; }
    .aktuell__symbol { flex: none; width: 40px; height: 40px; display: grid; place-items: center;
      font-size: 22px; line-height: 1; background: var(--flaeche); border-radius: var(--r-md); }
    .aktuell__emoji { flex: none; width: 22px; text-align: center; font-size: 20px;
      line-height: 1.3; margin-top: 1px; }
    .aktuell__eintrag:last-of-type { border-bottom: 1px solid var(--linie); }
    .aktuell__datum { display: block; font-size: 14px; color: var(--text-leise);
      margin-bottom: 2px; }
    .aktuell__eintrag h3 { font-size: var(--fs-md); margin-bottom: 3px; }
    .aktuell__eintrag h3 a { color: var(--text); text-decoration: none; }
    .aktuell__eintrag h3 a:hover { color: var(--signal); }
    /* line-clamp ist hier die Notbremse, nicht der Entwurf — der Text eines
       Beitrags soll als Aufhaenger in zwei Zeilen enden, nicht mitten im
       Satz abreissen. Er steht schon so in der Beschreibung. */
    .aktuell__text { font-size: var(--fs-sm); color: var(--text-leise); line-height: 1.55;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden; }

    /* Termine: Zeichen und Datum in einer festen Spalte, damit die Titel
       untereinander an einer Kante stehen. */
    .aktuell__termin { display: flex; gap: var(--raum-2); align-items: flex-start; }
    .aktuell__wann { flex: none; min-width: 96px; font-weight: 600; font-size: var(--fs-sm);
      padding-top: 2px; }
    .aktuell__wann small { display: block; font-weight: 400; color: var(--text-leise);
      font-size: 14px; }
    .aktuell__leer { font-size: var(--fs-sm); color: var(--text-leise); padding: var(--raum-2) 0;
      border-top: 1px solid var(--linie); }

    .aktuell__mehr { display: inline-block; margin-top: var(--raum-2); font-size: var(--fs-md);
      color: var(--signal); text-decoration: none; border-bottom: 1px solid transparent; }
    .aktuell__mehr:hover { border-bottom-color: var(--signal); }

    @media (max-width: 860px) {
      .aktuell__gitter { grid-template-columns: 1fr; gap: var(--raum-4); }
    }
  `,
  render(data) {
    const nB = Number(data.anzahlBeitraege) > 0 ? Number(data.anzahlBeitraege) : 2;
    const nT = Number(data.anzahlTermine) > 0 ? Number(data.anzahlTermine) : 3;
    const beitraege = (data.beitraege || []).slice(0, nB);
    const termine = (data.termine || []).slice(0, nT);
    const gesamt = Number(data.gesamt) > 0 ? Number(data.gesamt) : beitraege.length;

    const links = (label, href, zusatz = '') => {
      const z = ziel(href);
      return label && z
        ? html`<a class="aktuell__mehr" href="${raw(escapeAttr(z))}">${label}${zusatz} →</a>` : '';
    };

    const spalteBeitraege = html`<div>
      <h2>${data.beitraegeTitel}</h2>
      ${beitraege.length
        ? beitraege.map((e) => {
            const z = ziel(e.href);
            return html`<article class="aktuell__eintrag aktuell__beitrag">
              ${e.symbol ? html`<span class="aktuell__symbol" aria-hidden="true" title="${e.symbolText || ''}">${e.symbol}</span>` : ''}
              <div>
                <span class="aktuell__datum">${e.datum}</span>
                <h3>${z ? html`<a href="${raw(escapeAttr(z))}">${e.titel}</a>` : e.titel}</h3>
                ${e.text ? html`<p class="aktuell__text">${e.text}</p>` : ''}
              </div>
            </article>`;
          })
        : html`<p class="aktuell__leer">${data.leerBeitraege}</p>`}
      ${links(data.beitraegeLabel, data.beitraegeHref,
              gesamt > beitraege.length ? ` (${gesamt})` : '')}
    </div>`;

    const spalteTermine = html`<div>
      <h2>${data.termineTitel}</h2>
      ${termine.length
        ? termine.map((t) => html`<article class="aktuell__eintrag aktuell__termin">
            ${t.symbol
              ? html`<span class="aktuell__emoji" aria-hidden="true" title="${t.symbolText || ''}">${t.symbol}</span>`
              : ''}
            <span class="aktuell__wann">${t.tag || t.datum}${
              t.uhrzeit ? html`<small>${t.uhrzeit} Uhr</small>` : ''}</span>
            <h3>${t.titel}</h3>
          </article>`)
        : html`<p class="aktuell__leer">${data.leerTermine}</p>`}
      ${links(data.termineLabel, data.termineHref)}
    </div>`;

    return html`
      <section class="section aktuell"><div class="container">
        <div class="aktuell__gitter">${spalteBeitraege}${spalteTermine}</div>
      </div></section>`;
  },
};
