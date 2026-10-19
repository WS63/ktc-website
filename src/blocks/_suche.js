import { html, raw, escapeAttr } from './_util.js';

/**
 * Das Suchfeld, gemeinsam fuer Beitragsliste und Terminliste.
 *
 * Ein einfaches GET-Formular: die Adresse traegt die Suche (?q=…), jeder
 * Treffer ist verlinkbar, und es funktioniert ohne JavaScript (P6). Der Knopf
 * ist KEIN '.knopf': der eine auffaellige Knopf der Seite gehoert 'Mitglied
 * werden', eine Suche ist Werkzeug.
 */
// Werkzeug, nicht Hauptsache: Schrift in --fs-sm statt --fs-md (20 px liessen das Feld
// groesser wirken als die Liste darunter). 16 px sind die Untergrenze — darunter zoomt
// iOS beim Antippen ins Feld.
export const SUCHE_CSS = `
    .suche { display: flex; gap: var(--raum-1); max-width: 26rem; margin-bottom: var(--raum-2); }
    .suche input { flex: 1; min-width: 0; font: inherit; font-size: var(--fs-sm);
      padding: 8px 12px; border: 1px solid var(--linie-stark); border-radius: var(--radius);
      background: var(--grund); color: var(--text); }
    .suche input:focus-visible { outline: 2px solid var(--signal); outline-offset: 1px; }
    .suche button { font: inherit; font-size: var(--fs-sm); cursor: pointer; padding: 8px 14px;
      border: 1px solid var(--signal); border-radius: var(--radius); background: transparent;
      color: var(--signal); }
    .suche button:hover { background: var(--signal-leise); }
    .suche__ergebnis { font-size: var(--fs-sm); color: var(--text-leise); margin: var(--raum-1) 0 var(--raum-2); }
    .suche__ergebnis a { color: var(--signal); }
`;

/**
 * @param aktion      Adresse der Seite, an die das Formular geht
 * @param q           der aktuelle Suchtext, leer = keine Suche
 * @param treffer     Zahl der Treffer (nur bei aktiver Suche)
 * @param platzhalter Hinweis im leeren Feld
 */
export function sucheFeld({ aktion, q, treffer, platzhalter }) {
  return html`
    <form class="suche" method="get" action="${raw(escapeAttr(aktion || ''))}" role="search">
      <label class="nur-vorleser" for="suche-q">${platzhalter}</label>
      <input id="suche-q" type="search" name="q" value="${raw(escapeAttr(q || ''))}"
             placeholder="${raw(escapeAttr(platzhalter))}" maxlength="80" autocomplete="off">
      <button type="submit">Suchen</button>
    </form>
    ${q ? html`<p class="suche__ergebnis" role="status">${treffer} Treffer für „${q}“ ·
      <a href="${raw(escapeAttr(aktion || ''))}">Suche zurücksetzen</a></p>` : ''}`;
}
