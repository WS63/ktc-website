import { html, raw, escapeAttr, ziel, markdownInline } from './_util.js';
import { sucheFeld, SUCHE_CSS } from './_suche.js';

/**
 * Termine — der Clubkalender.
 *
 * Wichtig: dieser Baustein entscheidet NICHT, welcher Termin vorbei ist.
 * renderPage() ist eine reine Funktion (P1) — ein `new Date()` hier drin
 * machte sie vom Tag abhaengig, und die Tests waeren im April gruen und im
 * Mai rot. Das Aussortieren passiert in src/routes/public.js, wo der
 * Zeitpunkt ohnehin bekannt ist. Der Baustein zeigt, was er bekommt.
 */

// Die Art eines Termins (Spieltag, Clubleben, Hinweis) ist ein Emoji, und welche
// es gibt, steht in config/arten.json — nicht hier. Der Baustein bekommt 'symbol'
// und 'symbolText' fertig von der Route und weiss nichts von Arten (P1).
// Vorher standen hier drei Formen als SVG: zwei Systeme fuer dieselbe Sache.

export default {
  name: 'termine',
  label: 'Termine',
  schema: {
    titel:    { type: 'text',  default: '', label: 'Überschrift' },
    vorspann: { type: 'text',  default: '', label: 'Zeile darunter' },
    // Kommt aus inhalte/termine.json (P3) — nie hier von Hand gepflegt.
    termine:  { type: 'auto', default: [],
                label: 'Termine — kommen aus inhalte/termine.json' },
    stand:    { type: 'auto',  default: '', label: 'Hinweis zur Herkunft der Spieltermine — kommt aus dem Import' },
    suche:    { type: 'auswahl', default: 'aus', label: 'Suchfeld über der Liste', optionen: ['aus', 'an'] },
    zuklappen:{ type: 'auswahl', default: 'aus', optionen: ['aus', 'an'],
                label: 'Monate zuklappen: kommend die nächsten zwei offen, vergangen nur die letzten zwei Wochen' },
    q:        { type: 'auto',  default: '', label: 'Suchtext — kommt aus der Adresse' },
    basis:    { type: 'auto',  default: '', label: 'Adresse der Seite, für das Suchformular' },
    kategorien: { type: 'auto', default: [], label: 'Die Arten der Termine — kommen aus config/arten.json' },
    art:      { type: 'auto',  default: '', label: 'Gewählte Art — kommt aus der Adresse' },
    zeit:     { type: 'auto',  default: 'kommend', label: 'kommend oder vergangen — kommt aus der Adresse' },
    leerText: { type: 'text',  default: 'Zurzeit stehen keine Termine an.',
                label: 'Text, wenn nichts ansteht' },
    anzahl:   { type: 'text',  default: '', label: 'Höchstens so viele zeigen — leer heißt alle' },
    mehrLabel:{ type: 'text',  default: '', label: 'Link unter der Liste' },
    mehrHref: { type: 'text',  default: '', label: 'Ziel des Links' },
  },
  css: `
    ${SUCHE_CSS}
    .termine__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: 4px; }
    .termine__vorspann { font-size: var(--fs-sm); color: var(--text-leise);
      margin-bottom: var(--raum-3); max-width: var(--breite-text); }
    .termin { display: flex; gap: var(--raum-3); padding: var(--raum-3) 0;
      border-top: 1px solid var(--linie); max-width: var(--breite-text);
      align-items: flex-start; }

    /* Datum und Uhrzeit stehen in einer eigenen Spalte mit fester Breite.
       Ohne sie saessen die Titel je nach Laenge des Datums anders — bei
       zwanzig Zeilen untereinander faellt das sofort auf. */
    .termin__wann { flex: none; min-width: 132px; padding-top: 2px; }
    .termin__tag { font-size: var(--fs-md); font-weight: 600; line-height: 1.2;
      display: block; }
    .termin__zeit { font-size: 14px; color: var(--text-leise); display: block;
      margin-top: 2px; }

    /* Das Symbol der Art, in fester Spalte: die Titel sollen untereinander an
       einer Kante stehen. */
    .termin__emoji { flex: none; width: 24px; text-align: center; font-size: 22px;
      line-height: 1.2; margin-top: 1px; }

    .termin__titel { font-size: var(--fs-md); font-weight: 500; line-height: 1.2; margin: 0 0 3px; }
    .termin__mehr { display: inline-block; margin-top: 8px; font-size: var(--fs-sm); color: var(--signal);
      text-decoration: none; border-bottom: 1px solid transparent; }
    .termin__mehr:hover { border-bottom-color: var(--signal); }
    /* Die Monatsueberschrift gliedert die Liste grob nach der Zeit. */
    .termine__monat { font-size: 14px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
      color: var(--text-leise); margin: var(--raum-4) 0 0; padding-bottom: 6px;
      border-bottom: 2px solid var(--linie-stark); max-width: var(--breite-text); }
    .termine__monat:first-of-type { margin-top: var(--raum-3); }

    /* Auswahl: wenige Arten und kommend oder vergangen — Links, keine Schaltflaechen, ohne Skript. */
    .termine__auswahl { display: flex; flex-wrap: wrap; gap: var(--raum-1); margin-bottom: var(--raum-2); }
    .termine__auswahl a { display: inline-block; padding: 6px 14px; font-size: 15px; line-height: 1.3;
      color: var(--text); text-decoration: none; border: 1px solid var(--linie-stark);
      border-radius: var(--r-pill); }
    .termine__auswahl a:hover { background: var(--signal-leise); border-color: var(--signal); }
    .termine__auswahl a[aria-current="true"] { background: var(--signal-leise); border-color: var(--signal);
      color: var(--signal); font-weight: 600; }
    .termine__auswahl .trenn { flex-basis: 100%; height: 0; }
    .termin p { font-size: var(--fs-sm); color: var(--text-leise); line-height: 1.6; }
    /* Die Mannschaften eines Termins, in zwei Gruppen: Heimspiele zuerst,
       dann Auswaertsspiele. Kleiner und leiser als der Text darueber, damit
       der Termin die Zeile bleibt und die Liste Beiwerk. */
    .termin__gruppe { margin-top: 10px; }
    .termin__gruppe h4 { font-size: 12px; font-weight: 600; text-transform: uppercase;
      letter-spacing: .07em; color: var(--text-leise); margin: 0 0 3px; }
    /* Eine Paarung ist eine Tabellenzeile: Heimmannschaft - Gastmannschaft.
       Als Tabelle, weil die Spalten dann von selbst auf der laengsten Zelle
       einrasten und der Strich in jeder Zeile an derselben Stelle steht —
       genau die Ausrichtung, die ein Tabulator geben wuerde. Und es IST eine
       Tabelle: zwei Mannschaften je Zeile, vom Vorleser als solche gelesen. */
    .termin__paarungen { border-collapse: collapse; font-size: 15px; line-height: 1.55; }
    .termin__paarungen td { padding: 1px 0; vertical-align: baseline; }
    .termin__paarungen td:first-child { padding-right: .6em; }
    .termin__paarungen td.trenner { padding-right: .6em; color: var(--text-still); }
    .termin__paarungen .wir { font-weight: 600; }
    .termin__paarungen .sie { color: var(--text-leise); }
    /* Spielgemeinschaft mit Partnervereinen. Ein Wort-Etikett, keine Farbe:
       die Unterscheidung muss auch im Schwarzweissdruck des Aushangs bleiben. */
    .termin__msg { display: inline-block; font-size: 12px; font-weight: 600;
      letter-spacing: .04em; color: var(--signal); border: 1px solid var(--linie-aktiv);
      border-radius: 3px; padding: 0 5px; margin: 0 4px; white-space: nowrap; }
    .termine__stand { font-size: 14px; color: var(--text-leise); margin-top: var(--raum-3);
      max-width: var(--breite-text); }
    .termin__ort { font-size: 14px; color: var(--text-leise); margin-top: 6px;
      display: block; }
    .termine__mehr { display: inline-block; margin-top: var(--raum-3);
      font-size: var(--fs-md); color: var(--signal); text-decoration: none;
      border-bottom: 1px solid transparent; }
    .termine__mehr:hover { border-bottom-color: var(--signal); }

    /* Kompakt (Spielwochenenden): eine Zeile, der Titel ist der Link, weniger Polster. */
    .termin--kompakt { padding: var(--raum-2) 0; }
    .termin--kompakt .termin__titel { margin: 0; line-height: 1.5; }
    .termin__link { color: var(--signal); text-decoration: none; border-bottom: 1px solid transparent; }
    .termin__link:hover { border-bottom-color: var(--signal); }
    .termin__kurz { font-size: var(--fs-sm); font-weight: 400; color: var(--text-leise); }

    /* Zugeklappte Monate: die Kopfzeile traegt Monat, Zahl und einen Winkel. Reines
       <details>: kein Skript, und die Suche im Browser klappt Treffer selbst auf. */
    .termine__gruppe { max-width: var(--breite-text); margin-top: var(--raum-4); }
    .termine__gruppe:first-of-type { margin-top: var(--raum-3); }
    .termine__kopf { display: flex; align-items: baseline; gap: var(--raum-2); cursor: pointer;
      list-style: none; padding-bottom: 6px; border-bottom: 2px solid var(--linie-stark); }
    .termine__kopf::-webkit-details-marker { display: none; }
    .termine__kopf:focus-visible { outline: 2px solid var(--signal); outline-offset: 3px; }
    .termine__gruppe .termine__monat { margin: 0; padding: 0; border: 0; }
    .termine__zahl { font-size: var(--fs-sm); color: var(--text-leise); }
    .termine__kopf::after { content: ''; margin-left: auto; width: 8px; height: 8px;
      border-right: 2px solid var(--text-leise); border-bottom: 2px solid var(--text-leise);
      transform: translateY(-3px) rotate(45deg); transition: transform var(--t-schnell) var(--ease); }
    .termine__gruppe:not([open]) .termine__kopf::after { transform: rotate(-45deg); }
    .termine__kopf:hover .termine__monat { color: var(--text); }

    @media (max-width: 560px) {
      .termin { flex-wrap: wrap; gap: var(--raum-2); }
      .termin__wann { min-width: 0; }
      .termin__emoji { order: -1; }
    }
  `,
  render(data) {
    const alle = data.termine || [];
    const grenze = Number(data.anzahl) > 0 ? Number(data.anzahl) : alle.length;
    const liste = alle.slice(0, grenze);
    const mehr = ziel(data.mehrHref);

    const kopf = html`
      ${data.titel ? html`<h2 class="termine__titel">${data.titel}</h2>` : ''}
      ${data.vorspann ? html`<p class="termine__vorspann">${data.vorspann}</p>` : ''}`;

    // Die Auswahl besteht aus Adressen (?art=…&zeit=…): jede Ansicht laesst sich verlinken und
    // laeuft ohne JavaScript. Der Suchtext bleibt beim Umschalten erhalten.
    const adresse = (neu) => {
      const art = 'art' in neu ? neu.art : data.art;
      const zeit = 'zeit' in neu ? neu.zeit : data.zeit;
      const p = new URLSearchParams();
      if (art) p.set('art', art);
      if (zeit === 'vergangen') p.set('zeit', 'vergangen');
      if (data.q) p.set('q', data.q);
      const q = p.toString();
      return `${data.basis || ''}${q ? `?${q}` : ''}`;
    };
    const chip = (text, href, aktiv) => html`<a href="${raw(escapeAttr(href))}"${aktiv ? raw(' aria-current="true"') : ''}>${text}</a>`;
    const kategorien = data.kategorien || [];
    const auswahl = kategorien.length
      ? html`<nav class="termine__auswahl" aria-label="Termine auswählen">
          ${chip('Kommend', adresse({ zeit: 'kommend' }), data.zeit !== 'vergangen')}
          ${chip('Vergangen', adresse({ zeit: 'vergangen' }), data.zeit === 'vergangen')}
          <span class="trenn"></span>
          ${chip('Alle', adresse({ art: '' }), !data.art)}
          ${kategorien.map((k) => chip(`${k.symbol} ${k.label}`, adresse({ art: k.key }), data.art === k.key))}
        </nav>` : '';
    const suchen = data.suche === 'an'
      ? sucheFeld({ aktion: data.basis, q: data.q, treffer: liste.length,
          platzhalter: 'Suchen, z. B. Arbeitseinsatz, Turnier, Mai …' }) : '';
    if (!liste.length) {
      return html`<section class="section"><div class="container">
        ${kopf}
        ${auswahl}
        ${suchen}
        <p class="termine__vorspann">${data.q || data.art || data.zeit === 'vergangen'
          ? 'Dazu gibt es keinen Termin. Probier eine andere Auswahl oder ein anderes Wort.' : data.leerText}</p>
      </div></section>`;
    }

    const eintrag = (t) => {
      const linkZiel = ziel(t.mehr);
      const wann = html`${t.symbol
          ? html`<span class="termin__emoji" aria-hidden="true" title="${t.symbolText || ''}">${t.symbol}</span>`
          : ''}
        <div class="termin__wann">
          <span class="termin__tag">${t.tag || t.datum}</span>
          ${t.wochentag || t.uhrzeit
            ? html`<span class="termin__zeit">${[t.wochentag, t.uhrzeit ? `${t.uhrzeit} Uhr` : ''].filter(Boolean).join(' · ')}</span>` : ''}
        </div>`;
      // Kompakt: der Titel ist der Link, der Text steht in derselben Zeile.
      if (t.kompakt && linkZiel) {
        return html`<article class="termin termin--kompakt">${wann}
          <div><h4 class="termin__titel"><a class="termin__link" href="${raw(escapeAttr(linkZiel))}">${t.titel}</a>${
            t.text ? html`<span class="termin__kurz"> · ${t.text}</span>` : ''}</h4></div>
        </article>`;
      }
      return html`<article class="termin">${wann}
        <div>
          <h4 class="termin__titel">${t.titel}</h4>
          ${t.text ? html`<p>${markdownInline(t.text)}</p>` : ''}
          ${(t.gruppen || []).map((g) => html`<div class="termin__gruppe">
            <h4>${g.titel}</h4>
            <table class="termin__paarungen"><tbody>${g.zeilen.map((z) => {
              const wir = html`<span class="wir">${z.mannschaft}</span>${
                z.sg ? html` <span class="termin__msg" title="Spielgemeinschaft mit Partnervereinen">MSG ${z.sg}</span>` : ''}`;
              const sie = html`<span class="sie">${z.gegner}</span>`;
              // Die Heimmannschaft steht IMMER links, wie beim Verband — im
              // Heimspiel sind das wir, im Auswaertsspiel der Gegner.
              return g.zuhause
                ? html`<tr><td>${wir}</td><td class="trenner">-</td><td>${sie}</td></tr>`
                : html`<tr><td>${sie}</td><td class="trenner">-</td><td>${wir}</td></tr>`;
            })}</tbody></table>
          </div>`)}
          ${t.ort ? html`<span class="termin__ort">${t.ort}</span>` : ''}
          ${linkZiel ? html`<a class="termin__mehr" href="${raw(escapeAttr(linkZiel))}">${t.mehrLabel || 'Mehr zum Termin'} →</a>` : ''}
        </div>
      </article>`;
    };

    // Nach Monaten gruppiert. Die Liste kommt schon sortiert.
    const gruppen = [];
    for (const t of liste) {
      const letzte = gruppen[gruppen.length - 1];
      if (letzte && letzte.monat === (t.monat || '')) letzte.termine.push(t);
      else gruppen.push({ monat: t.monat || '', termine: [t] });
    }

    // Zugeklappt: kommend sind die naechsten zwei Monate offen — was danach kommt,
    // braucht heute niemand. Vergangen ist nur offen, was die Route als 'frisch'
    // markiert hat (die letzten zwei Wochen); aeltere Monate stehen mit ihrer Zahl da.
    // Ob ein Termin frisch ist, entscheidet die Route: der Baustein kennt keine Uhr (P1).
    const zu = data.zuklappen === 'an';
    const offen = (g, i) => (data.zeit === 'vergangen' ? g.termine.some((t) => t.frisch) : i < 2);
    const zeilen = gruppen.map((g, i) => {
      if (!zu || !g.monat) {
        return html`${g.monat ? html`<h3 class="termine__monat">${g.monat}</h3>` : ''}${g.termine.map(eintrag)}`;
      }
      const n = g.termine.length;
      return html`<details class="termine__gruppe"${offen(g, i) ? raw(' open') : ''}>
        <summary class="termine__kopf"><h3 class="termine__monat">${g.monat}</h3>
          <span class="termine__zahl">${n} ${n === 1 ? 'Termin' : 'Termine'}</span></summary>
        ${g.termine.map(eintrag)}
      </details>`;
    });

    return html`
      <section class="section"><div class="container">
        ${kopf}
        ${auswahl}
        ${suchen}
        <div>${zeilen}</div>
        ${data.stand && liste.some((t) => t.art === 'spiel')
          ? html`<p class="termine__stand">${data.stand}</p>` : ''}
        ${data.mehrLabel && mehr
          ? html`<a class="termine__mehr" href="${raw(escapeAttr(mehr))}">${data.mehrLabel} →</a>`
          : ''}
      </div></section>`;
  },
};
