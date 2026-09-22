/**
 * Render-Cache im Speicher. Eine Seite, die sich nicht geaendert hat, wird
 * nicht neu gebaut.
 *
 * Wichtig: bei JEDER Aenderung im Cockpit komplett leeren. Eine halb gueltige
 * Zwischenablage ist schlimmer als gar keine — Uebersichten zeigen sonst
 * Staende, die es nicht mehr gibt.
 */
const ablage = new Map();
const MAX = 200;

export const holen = (schluessel) => ablage.get(schluessel);

export function legen(schluessel, wert) {
  if (ablage.size >= MAX) ablage.delete(ablage.keys().next().value);
  ablage.set(schluessel, wert);
  return wert;
}

export function leereCache() {
  ablage.clear();
}
