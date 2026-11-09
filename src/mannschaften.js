/**
 * Die Mannschaften der laufenden Saison (inhalte/mannschaften/<jahr>.json).
 * Die juengste Datei gilt. Aus src/seiten.js herausgeloest, weil auch der
 * Abruf beim HTV sie braucht und nicht die ganze Seitenliste laden soll.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const VERZ = 'inhalte/mannschaften';
const datei = existsSync(VERZ)
  ? readdirSync(VERZ).filter((f) => f.endsWith('.json')).sort().pop() : null;

const roh = datei
  ? JSON.parse(readFileSync(`${VERZ}/${datei}`, 'utf8'))
  : { saison: '', wettbewerbe: {}, erwachsene: [], jugend: [] };

/**
 * Die Winterrunde gehoert zum Jahr, in dem sie beginnt: die Winterrunde 2026/27 steht in 2026.json, auch wenn ihre
 * Spiele bis in den April 2027 gehen. Dort liegt sie als eigener Abschnitt 'winter' mit Runde, Wettbewerb beim HTV
 * und eigenen Mannschaften. Hier wird daraus fuer alle anderen dasselbe Format wie fuer die Sommer-Mannschaften:
 * der Wettbewerb 'winter' kommt zu den Wettbewerben, die Runde zu den Runden.
 */
const winter = roh.winter || null;

export const saison = {
  ...roh,
  wettbewerbe: { ...(roh.wettbewerbe || {}), ...(winter ? { winter: winter.wettbewerb } : {}) },
  runden: { ...(roh.runden || {}), ...(winter ? { winter: winter.runde } : {}) },
  winter: winter ? { runde: winter.runde, erwachsene: winter.erwachsene || [], jugend: winter.jugend || [] } : null,
};

/** Die Mannschaften der Winterrunde, jede mit 'wettbewerb: winter' — daran haengt die Gruppen-Adresse beim HTV. */
export const winterMannschaften = saison.winter
  ? [...saison.winter.erwachsene, ...saison.winter.jugend].map((t) => ({ ...t, wettbewerb: 'winter' }))
  : [];

/** Alle Mannschaften des Jahres, deren Spielplan beim HTV geholt wird: Sommer und Winter. */
export const mannschaften = [...(saison.erwachsene || []), ...(saison.jugend || []), ...winterMannschaften];
