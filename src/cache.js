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

export function holen(schluessel) {
  const eintrag = ablage.get(schluessel);
  if (!eintrag) return undefined;
  // Seiten mit Terminen verfallen von selbst. Ohne das haelt der Speicher
  // einen Termin fest, der gestern vorbei war — bis zufaellig jemand im
  // Cockpit etwas aendert. Ein Kalender, der abgelaufene Termine zeigt,
  // ist schlimmer als keiner: jemand faehrt umsonst zur Anlage.
  if (eintrag.bis && Date.now() > eintrag.bis) {
    ablage.delete(schluessel);
    return undefined;
  }
  return eintrag.wert;
}

export function legen(schluessel, wert, bis) {
  if (ablage.size >= MAX) ablage.delete(ablage.keys().next().value);
  ablage.set(schluessel, { wert, bis: bis || 0 });
  return wert;
}

/** Der naechste Mitternachtswechsel in Ortszeit, als Zeitstempel. */
export function bisMitternacht() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export function leereCache() {
  ablage.clear();
}
