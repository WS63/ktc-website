/**
 * Eine einfache Bremse je Adresse: hoechstens `hoechstens` Anfragen im Fenster.
 *
 * Gilt fuer das, was offen im Netz steht und etwas kostet — der Chat (ein
 * Modellaufruf je Frage) und das Formular (eine Zeile in der Datenbank und
 * eine Benachrichtigung je Absenden).
 *
 * Die Adresse ist req.ip. Hinter Coolify stimmt sie nur mit 'trust proxy' in
 * server.js — ohne das kaeme jede Anfrage scheinbar vom Proxy, und die Bremse
 * traefe alle Besucher zugleich.
 */
export function bremseFuer({ fensterMs, hoechstens }) {
  const zeiten = new Map();
  return function zuSchnell(adresse) {
    const jetzt = Date.now();
    const liste = (zeiten.get(adresse) || []).filter((t) => jetzt - t < fensterMs);
    liste.push(jetzt);
    zeiten.set(adresse, liste);
    if (zeiten.size > 5000) zeiten.clear();          // kein unbegrenztes Wachsen
    return liste.length > hoechstens;
  };
}
