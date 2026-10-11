/**
 * Holt die Spieltermine und Ergebnisse aller Mannschaften beim HTV.
 *
 *     npm run spielplan
 *
 * Liest inhalte/mannschaften/<jahr>.json, ruft für jede Mannschaft ihre
 * Gruppenseite bei htv.liga.nu ab und schreibt inhalte/spielplan/<jahr>.json.
 *
 * ── Warum überhaupt importieren, wo doch verlinkt wird ──────────────────
 * Die Spielklasse auf /mannschaften/ führt zum HTV, und dort sind die Daten
 * immer aktuell. Das bleibt so. Der Import hat einen anderen Zweck: die
 * Termine sollen im Clubkalender neben den Vereinsterminen stehen, und nach
 * einem Spieltag sollen die Ergebnisse an einer Stelle zusammenstehen.
 *
 * ── Drei Dinge, die dieses Skript ernst nimmt ───────────────────────────
 *
 * 1. Es läuft von Hand, nicht auf dem Server. Die Daten liegen damit im
 *    Repository: versioniert, nachvollziehbar, und ein Fehlschlag kann die
 *    laufende Website nicht beschädigen.
 *
 * 2. Es überschreibt bei einem Fehlschlag nichts. Antwortet der HTV nicht
 *    oder ändert er sein HTML, bleiben die Daten vom letzten erfolgreichen
 *    Lauf stehen — mit ihrem alten 'stand'. Ein ehrlich veraltetes Datum ist
 *    besser als eine leere Seite, und eine halb gefüllte wäre am schlimmsten.
 *
 * 3. Es ist höflich: eine Anfrage nach der anderen, mit Pause dazwischen,
 *    und mit einem User-Agent, der sagt, wer da klopft. 29 Gruppen in einem
 *    Schwall wären eine Belästigung des Verbands-Servers.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';


// ── Die Saison bestimmen ───────────────────────────────────────────────
const VERZ = 'inhalte/mannschaften';
const datei = existsSync(VERZ)
  ? readdirSync(VERZ).filter((f) => f.endsWith('.json')).sort().pop()
  : null;
if (!datei) {
  console.error(`[Spielplan] ${VERZ}/ ist leer — ohne Mannschaftsliste gibt es nichts zu holen.`);
  console.error('[Spielplan] Die Datei wird im April angelegt, wenn der HTV die Gruppen veröffentlicht.');
  process.exit(1);
}
const saison = JSON.parse(readFileSync(`${VERZ}/${datei}`, 'utf8'));
const teams = [...(saison.erwachsene || []), ...(saison.jugend || [])];
console.log(`[Spielplan] Saison ${saison.saison}, ${teams.length} Mannschaften.`);

// ── Hilfsmittel ────────────────────────────────────────────────────────
import { PAUSE_MS, gruppenUrl, schlaf, mitGeduld } from '../src/htv.js';

// ── Abrufen ────────────────────────────────────────────────────────────
const alle = [];
const fehler = [];

for (const [i, t] of teams.entries()) {
  const url = gruppenUrl(saison, t);
  process.stdout.write(`[${String(i + 1).padStart(2)}/${teams.length}] ${t.name.padEnd(22)} `);
  try {
    // Die Spielgemeinschaft steht in der Mannschaftsliste, nicht auf der
    // HTV-Seite. Sie wird hier mitgeschrieben, damit die Spielplan-Datei eines
    // Jahres fuer sich vollstaendig ist: wer in zwei Jahren wissen will, mit
    // wem die Damen 2026 spielten, muss dafuer nicht die alte Liste suchen.
    const sg = t.sg && t.sg !== '—' ? t.sg : '';
    const spiele = (await mitGeduld(url, t.name)).map((b) => ({ ...b, sg, gruppe: t.gruppe }));
    if (!spiele.length) throw new Error('keine eigene Begegnung in dieser Gruppe');
    alle.push(...spiele);
    console.log(`${String(spiele.length).padStart(2)} Begegnungen`);
  } catch (err) {
    console.log(`FEHLER — ${err.message}`);
    fehler.push({ mannschaft: t.name, gruppe: t.gruppe, grund: err.message });
  }
  if (i < teams.length - 1) await schlaf(PAUSE_MS);
}

// ── Schreiben, aber nur wenn es sich lohnt ─────────────────────────────
const ZIEL_VERZ = 'inhalte/spielplan';
const ZIEL = `${ZIEL_VERZ}/${saison.saison}.json`;

// Mehr als die Hälfte kaputt heißt: der HTV hat umgebaut oder ist nicht
// erreichbar. Dann ist das Ergebnis dieses Laufs kein Fortschritt, sondern
// Datenverlust — die alte Datei bleibt, wie sie ist.
if (fehler.length > teams.length / 2) {
  console.error(`\n[Spielplan] ABBRUCH: ${fehler.length} von ${teams.length} Mannschaften fehlgeschlagen.`);
  console.error('[Spielplan] Nichts geschrieben. Die vorhandenen Daten bleiben unverändert.');
  fehler.slice(0, 3).forEach((f) => console.error(`            · ${f.mannschaft}: ${f.grund}`));
  process.exit(1);
}

alle.sort((a, b) => (a.datum + a.uhrzeit).localeCompare(b.datum + b.uhrzeit)
  || a.mannschaft.localeCompare(b.mannschaft));

mkdirSync(ZIEL_VERZ, { recursive: true });
writeFileSync(ZIEL, JSON.stringify({
  _hinweis: 'Erzeugt von npm run spielplan — nicht von Hand ändern. Quelle: htv.liga.nu.',
  saison: saison.saison,
  stand: new Date().toISOString(),
  begegnungen: alle,
  ...(fehler.length ? { fehler } : {}),
}, null, 2) + '\n');

const gespielt = alle.filter((b) => b.gespielt).length;
console.log(`\n[Spielplan] ${alle.length} Begegnungen (${gespielt} gespielt) → ${ZIEL}`);
if (fehler.length) {
  console.log(`[Spielplan] ${fehler.length} Mannschaft(en) ohne Daten — stehen als 'fehler' in der Datei:`);
  fehler.forEach((f) => console.log(`            · ${f.mannschaft} (Gruppe ${f.gruppe}): ${f.grund}`));
}
console.log('[Spielplan] Danach: npm run seed');
