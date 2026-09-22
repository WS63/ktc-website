import { query } from './db.js';

/**
 * Datensparsame Zaehlung.
 *
 * Gespeichert wird: welcher Pfad, an welchem Tag, wie oft. Sonst nichts.
 * Keine IP, kein Cookie, keine Kennung, kein fremder Dienst. Damit braucht
 * es keine Einwilligung und kein Banner — und niemand muss etwas wegklicken.
 *
 * Gesammelt wird im Speicher und im Minutentakt geschrieben. Sonst kostet
 * jeder Seitenaufruf einen Schreibvorgang, und bei SQLite sperrt der die
 * ganze Datei.
 */
const offen = new Map();
let uhr = null;

const heute = () => new Date().toISOString().slice(0, 10);

// Tag und Pfad in einem Schluessel. Ein Datum enthaelt kein Leerzeichen,
// ein Pfad auch nicht — deshalb reicht eines als Trenner.
const schluesselVon = (tag, pfad) => `${tag} ${pfad}`;

export function zaehle(pfad) {
  if (!pfad || pfad.length > 200 || pfad.includes(' ')) return;
  const k = schluesselVon(heute(), pfad);
  offen.set(k, (offen.get(k) || 0) + 1);
  if (!uhr) {
    uhr = setTimeout(schreiben, 60_000);
    uhr.unref?.();                  // haelt den Prozess nicht am Leben
  }
}

async function schreiben() {
  uhr = null;
  if (!offen.size) return;
  const stapel = [...offen.entries()];
  offen.clear();

  for (const [k, anzahl] of stapel) {
    const trenner = k.indexOf(' ');
    const tag = k.slice(0, trenner);
    const pfad = k.slice(trenner + 1);
    try {
      // Auf beiden Wegen gleich: erst erhoehen, und nur anlegen, wenn es
      // die Zeile noch nicht gibt. ON CONFLICT schreibt sich auf SQLite und
      // Postgres unterschiedlich — das waere ein Zweig zu viel.
      await query(
        'UPDATE aufrufe SET anzahl = anzahl + $1 WHERE pfad = $2 AND tag = $3',
        [anzahl, pfad, tag]);
      const da = await query(
        'SELECT anzahl FROM aufrufe WHERE pfad = $1 AND tag = $2', [pfad, tag]);
      if (!da.length) {
        await query('INSERT INTO aufrufe (pfad, tag, anzahl) VALUES ($1, $2, $3)',
          [pfad, tag, anzahl]);
      }
    } catch (err) {
      // P6: eine Zaehlung, die scheitert, haelt nichts auf.
      console.error('[Zähler] [FEHLER]', err.message);
    }
  }
}

/** Beim Herunterfahren nicht verlieren, was noch offen ist. */
export const gleichSchreiben = schreiben;
