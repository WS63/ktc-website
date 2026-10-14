import { html, raw, escapeAttr, ziel } from './_util.js';
import { sucheFeld, SUCHE_CSS } from './_suche.js';

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
    seite:    { type: 'auto', default: 1, label: 'Welche Blätterseite — kommt aus der Route' },
    seiten:   { type: 'auto', default: 1, label: 'Wie viele Blätterseiten — gerechnet' },
    basis:    { type: 'auto', default: '', label: 'Pfad der Übersicht, für die Blätterlinks' },
    suche:    { type: 'auswahl', default: 'aus', label: 'Suchfeld über der Liste', optionen: ['aus', 'an'] },
    q:        { type: 'auto', default: '', label: 'Suchtext — kommt aus der Adresse' },
    leerText: { type: 'text', default: 'Noch keine Beiträge.', label: 'Text, wenn nichts da ist' },
    anzahl:   { type: 'text', default: '', label: 'Höchstens so viele zeigen — leer heißt alle' },
    mehrLabel:{ type: 'text', default: '', label: 'Link unter der Liste' },
    mehrHref: { type: 'text', default: '', label: 'Ziel des Links' },
  },
  css: `
    ${SUCHE_CSS}
    .liste__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: 4px; }
    .liste__zaehler { font-size: 15px; color: var(--text-leise); margin-bottom: var(--raum-3); }
    /* Links ein Symbol, rechts Datum, Titel und Text. Das Symbol (ein Emoji)
       ersetzt das Vorschaubild: bei fuenfzig Beitraegen im Jahr hat nicht jeder
       ein Foto, und eine Spalte, die mal gefuellt und mal leer ist, macht die
       Liste unruhig. Ein Symbol hat jeder — es gibt jedem Beitrag ein Gesicht,
       ohne dass jemand ein Bild suchen muss. Bilder stehen in der Detailansicht. */
    .eintrag { display: flex; gap: var(--raum-3); padding: var(--raum-3) 0;
      border-top: 1px solid var(--linie); max-width: var(--breite-text);
      align-items: flex-start; }
    /* Ohne Kachel, wie bei den Terminen: ein Emoji auf Kachelgrund las sich als
       Schaltflaeche und wirkte auf grauem Grund wie ein weisses Kaestchen. */
    .eintrag__symbol { flex: none; width: 32px; text-align: center;
      font-size: 28px; line-height: 1.1; margin-top: 2px; }
    .eintrag__datum { display: block; font-size: 14px; color: var(--text-leise);
      margin-bottom: 2px; }
    .eintrag h3 { font-size: 18px; font-weight: 600; margin-bottom: 3px; }
    .eintrag h3 a { color: var(--text); text-decoration: none; }
    .eintrag h3 a:hover { color: var(--signal); }
    .eintrag p { font-size: 15px; color: var(--text-leise); line-height: 1.6; }
    .thema { display: inline-block; margin-top: 8px; font-size: 13px; color: var(--signal);
      background: var(--signal-leise); padding: 2px 9px; border-radius: 3px; }
    /* Blaetterwerk. Die aktuelle Seite ist keine Verknuepfung — ein Link auf
       die Seite, auf der man steht, fuehrt nirgendwohin. */
    .blaettern { display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
      margin-top: var(--raum-4); max-width: var(--breite-text); }
    .blaettern a, .blaettern span { display: inline-block; min-width: 40px;
      text-align: center; padding: 8px 10px; border-radius: var(--r-sm);
      font-size: 16px; text-decoration: none; }
    .blaettern a { color: var(--signal); border: 1px solid var(--linie); }
    .blaettern a:hover { border-color: var(--signal); background: var(--signal-leise); }
    .blaettern .hier { background: var(--signal); color: var(--text-hell);
      border: 1px solid var(--signal); font-weight: 500; }
    .blaettern .luecke { color: var(--text-still); min-width: 0; padding: 8px 2px; }
    .liste__mehr { display: inline-block; margin-top: var(--raum-3); font-size: var(--fs-md);
      color: var(--signal); text-decoration: none; border-bottom: 1px solid transparent; }
    .liste__mehr:hover { border-bottom-color: var(--signal); }
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
    // Das Suchfeld steht ueber der Liste, auch wenn eine Suche nichts findet —
    // sonst muesste man mit der Zurueck-Taste wieder heraus.
    const suchen = data.suche === 'an'
      ? sucheFeld({ aktion: data.basis, q: data.q, treffer: n, platzhalter: 'Beiträge durchsuchen …' }) : '';
    if (!n) {
      return html`<section class="section"><div class="container">
        ${data.titel ? html`<h2 class="liste__titel">${data.titel}</h2>` : ''}
        ${suchen}
        <p class="liste__zaehler">${data.q ? 'Dazu gibt es keinen Beitrag. Probier ein anderes Wort.' : data.leerText}</p>
      </div></section>`;
    }
    const eintraege = liste.map((e) => {
      const z = ziel(e.href);
      return html`<article class="eintrag">
        ${e.symbol ? html`<div class="eintrag__symbol" aria-hidden="true" title="${e.symbolText || ''}">${e.symbol}</div>` : ''}
        <div>
          <span class="eintrag__datum">${e.datum}</span>
          <h3>${z ? html`<a href="${raw(escapeAttr(z))}">${e.titel}</a>` : e.titel}</h3>
          ${e.text ? html`<p>${e.text}</p>` : ''}
          ${e.thema ? html`<span class="thema">${e.thema}</span>` : ''}
        </div>
      </article>`;
    });
    const mehr = ziel(data.mehrHref);
    const blaettern = blaetterwerk(Number(data.seite) || 1, Number(data.seiten) || 1, data.basis);
    // P3: beide Zahlen werden gerechnet, nie getippt — auch die im Linktext.
    return html`
      <section class="section"><div class="container">
        ${data.titel ? html`<h2 class="liste__titel">${data.titel}</h2>` : ''}
        ${suchen}
        ${liste.length < gesamt || data.q
          ? ''
          : html`<p class="liste__zaehler">${gesamt} ${gesamt === 1 ? 'Beitrag' : 'Beiträge'}</p>`}
        <div>${eintraege}</div>
        ${blaettern}
        ${data.mehrLabel && mehr
          ? html`<a class="liste__mehr" href="${raw(escapeAttr(mehr))}">${data.mehrLabel}${
              liste.length < gesamt ? ` (${gesamt})` : ''} →</a>`
          : ''}
      </div></section>`;
  },
};

/**
 * Die Blaetterleiste: erste Seite, ein Fenster um die aktuelle, letzte Seite.
 *
 * Bei fuenf Jahrgaengen zu fuenfzig Beitraegen sind das fuenfundzwanzig
 * Seiten — alle als Zahl nebeneinander waere eine Mauer. Deshalb das Fenster
 * und die Luecken dazwischen. Bei einer einzigen Seite erscheint gar nichts:
 * eine Blaetterleiste, die nirgendwohin fuehrt, ist nur Dekoration.
 *
 * Die erste Seite ist '/aktuelles/' und nicht '/aktuelles/seite-1/' — sonst
 * gaebe es zwei Adressen fuer denselben Inhalt.
 */
function blaetterwerk(seite, seiten, basis) {
  const wurzel = ziel(basis);
  if (seiten < 2 || !wurzel) return '';

  const zeigen = new Set([1, seiten, seite, seite - 1, seite + 1]);
  const liste = [...zeigen].filter((n) => n >= 1 && n <= seiten).sort((a, b) => a - b);

  const teile = [];
  let vorher = 0;
  for (const n of liste) {
    if (n - vorher > 1) teile.push(html`<span class="luecke">…</span>`);
    const adresse = n === 1 ? wurzel : `${wurzel}seite-${n}/`;
    teile.push(n === seite
      ? html`<span class="hier" aria-current="page">${n}</span>`
      : html`<a href="${raw(escapeAttr(adresse))}">${n}</a>`);
    vorher = n;
  }

  return html`<nav class="blaettern" aria-label="Weitere Seiten">
    ${seite > 1
      ? html`<a href="${raw(escapeAttr(seite === 2 ? wurzel : `${wurzel}seite-${seite - 1}/`))}"
                rel="prev">← Neuer</a>`
      : ''}
    ${teile}
    ${seite < seiten
      ? html`<a href="${raw(escapeAttr(`${wurzel}seite-${seite + 1}/`))}" rel="next">Älter →</a>`
      : ''}
  </nav>`;
}
