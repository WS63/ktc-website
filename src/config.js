import { readFileSync } from 'node:fs';
import { query } from './db.js';

/**
 * Zwei Ebenen: die Datei ist der Grundstock, die Datenbank ist das, was jemand
 * im Cockpit geaendert hat. Sonst braeuchte eine Preisaenderung einen Deploy —
 * und das widerspricht dem Pruefstein von Stufe 3.
 *
 * Gehalten wird das Ergebnis im Speicher, damit renderPage() eine REINE,
 * SYNCHRONE Funktion bleiben kann (P1). Nach jedem Speichern im Cockpit
 * ruft die API aktualisiere() auf.
 */
const stand = { site: null, facts: null, theme: null };

const datei = (name) => JSON.parse(readFileSync(`config/${name}.json`, 'utf8'));

/**
 * Tief zusammenfuehren statt flach.
 *
 * Falle, teuer gelernt: bei einem flachen Spread gewinnt der Override ganze
 * Aeste. Wer danach ein neues Feld nur in die Datei schreibt, wundert sich,
 * warum es live nicht erscheint — der Override hat den ganzen Ast ueberschattet.
 */
function tief(grund, oben) {
  if (!oben || typeof oben !== 'object' || Array.isArray(oben)) return oben ?? grund;
  const out = { ...grund };
  for (const [k, v] of Object.entries(oben)) {
    out[k] = (v && typeof v === 'object' && !Array.isArray(v))
      ? tief(grund?.[k] ?? {}, v) : v;
  }
  return out;
}

export async function aktualisiere() {
  const zeilen = await query('SELECT schluessel, wert FROM config_overrides');
  const ov = Object.fromEntries(zeilen.map((z) => [z.schluessel, JSON.parse(z.wert)]));
  stand.site  = tief(datei('site'),  ov.site);
  stand.facts = tief(datei('facts'), ov.facts);
  stand.theme = tief(datei('theme'), ov.theme);
  return stand;
}

const holen = (name) => {
  if (!stand[name]) stand[name] = datei(name);   // Notfall: Datei allein
  return stand[name];
};

export const loadSite  = () => holen('site');
export const loadFacts = () => holen('facts');
export const loadTheme = () => holen('theme');

/**
 * Die Arten von Beitraegen und Terminen (config/arten.json). Reine Datei, kein
 * Cockpit-Override: die Zahl der Arten ist eine Gestaltungsentscheidung, keine
 * Einstellung. Einmal gelesen, dann aus dem Speicher.
 */
/** Lisa: Bildnamen und Vorschlaege (config/assistent.json). Reine Datei, einmal gelesen. */
let assistent = null;
export const loadAssistent = () => (assistent ??= datei('assistent'));

let arten = null;
export function loadArten() {
  if (!arten) {
    const roh = datei('arten');
    arten = Object.fromEntries(Object.entries(roh).filter(([k]) => !k.startsWith('_')));
  }
  return arten;
}
