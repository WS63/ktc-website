/**
 * Die Mannschaften der laufenden Saison (inhalte/mannschaften/<jahr>.json).
 * Die juengste Datei gilt. Aus src/seiten.js herausgeloest, weil auch der
 * Abruf beim HTV sie braucht und nicht die ganze Seitenliste laden soll.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const VERZ = 'inhalte/mannschaften';
const datei = existsSync(VERZ)
  ? readdirSync(VERZ).filter((f) => f.endsWith('.json')).sort().pop() : null;

export const saison = datei
  ? JSON.parse(readFileSync(`${VERZ}/${datei}`, 'utf8'))
  : { saison: '', wettbewerbe: {}, erwachsene: [], jugend: [] };

export const mannschaften = [...(saison.erwachsene || []), ...(saison.jugend || [])];
