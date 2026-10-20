/**
 * Aufbewahrungsfristen durchsetzen.
 *
 * Die Datenschutzerklaerung verspricht: Anfragen werden nach {{facts.datenschutz.frist_anfragen}}
 * geloescht, Eintraege des Assistenten nach {{facts.datenschutz.frist_chat}}. Ein Versprechen
 * ohne Durchsetzung ist schlimmer als keines — deshalb loescht dieses Modul wirklich.
 *
 * Die Fristen kommen aus den Fakten (eine Entscheidung des Vorstands, P2) und stehen als
 * Text da: "12 Monate", "90 Tage". Versteht das Modul eine Frist nicht, loescht es NICHTS
 * und meldet es laut — lieber eine Frist zu spaet als Daten zu frueh.
 */

/** "12 Monate" / "90 Tage" / "2 Jahre" / "6 Wochen" → Zeitpunkt, vor dem alles abgelaufen ist. */
export function grenze(frist, jetzt = new Date()) {
  const m = /^\s*(\d+)\s*(Tage?|Wochen?|Monate?|Jahre?)\s*$/i.exec(String(frist ?? ''));
  if (!m || Number(m[1]) < 1) return null;
  const n = Number(m[1]);
  const d = new Date(jetzt);
  const einheit = m[2].toLowerCase();
  if (einheit.startsWith('tag')) d.setUTCDate(d.getUTCDate() - n);
  else if (einheit.startsWith('woche')) d.setUTCDate(d.getUTCDate() - 7 * n);
  else if (einheit.startsWith('monat')) d.setUTCMonth(d.getUTCMonth() - n);
  else d.setUTCFullYear(d.getUTCFullYear() - n);
  return d.toISOString();
}

// Beide Tabellen speichern created_at als ISO-Text; der Vergleich als Text stimmt auf
// SQLite und Postgres gleich. Je Tabelle ein eigener Platzhalter (siehe src/db.js).
const REGELN = [
  { tabelle: 'submissions', fakt: 'frist_anfragen', name: 'Anfragen' },
  { tabelle: 'chat_log',    fakt: 'frist_chat',     name: 'Assistent-Protokoll' },
];

/**
 * Loescht, was abgelaufen ist. Gibt zurueck, wie viele Zeilen je Tabelle gingen.
 * `holeFakten` und `abfrage` sind austauschbar, damit ein Test keine Datenbank braucht.
 * db.js und config.js werden erst hier geladen: db.js waehlt beim Import die Datenbank
 * und legt bei SQLite die Datei an — ein Test, der nur Fristen rechnet, soll das nicht ausloesen.
 */
export async function raeumeAuf({ jetzt = new Date(), abfrage, holeFakten } = {}) {
  abfrage ??= (await import('./db.js')).query;
  holeFakten ??= (await import('./config.js')).loadFacts;
  const fakten = (await holeFakten())?.datenschutz || {};
  const ergebnis = {};
  for (const { tabelle, fakt, name } of REGELN) {
    const grenzwert = grenze(fakten[fakt], jetzt);
    if (!grenzwert) {
      console.error(`[Aufräumen] [WARNUNG] Frist „${fakten[fakt] ?? '(fehlt)'}“ für ${name} nicht verstanden — es wird nichts gelöscht.`);
      ergebnis[tabelle] = 0;
      continue;
    }
    const alt = await abfrage(`SELECT COUNT(*) AS n FROM ${tabelle} WHERE created_at < $1`, [grenzwert]);
    const n = Number(alt[0]?.n || 0);        // Postgres liefert COUNT als Text
    if (n) await abfrage(`DELETE FROM ${tabelle} WHERE created_at < $1`, [grenzwert]);
    ergebnis[tabelle] = n;
    if (n) console.log(`[Aufräumen] ${n} abgelaufene Einträge aus ${name} gelöscht.`);
  }
  return ergebnis;
}

/**
 * Einmal beim Start, danach alle 24 Stunden. Ein Fehler hier haelt nichts auf (P6):
 * die Website laeuft weiter, die Meldung steht im Log.
 */
export function starteAufraeumen({ intervall = 24 * 60 * 60 * 1000 } = {}) {
  const lauf = () => raeumeAuf().catch((err) => console.error('[Aufräumen] [FEHLER]', err.message));
  const erster = setTimeout(lauf, 30_000);
  const wiederholt = setInterval(lauf, intervall);
  erster.unref?.();
  wiederholt.unref?.();
}
