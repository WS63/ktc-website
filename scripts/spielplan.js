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

const PAUSE_MS = 700;
const KENNUNG = 'Mozilla/5.0 (compatible; KTC-Website/1.0; +https://tennisclub-kriftel.de)';
const BASIS = 'https://htv.liga.nu/cgi-bin/WebObjects/nuLigaTENDE.woa/wa/groupPage';

// Wir erkennen uns am Ortsnamen, nicht am Vereinskürzel: beim HTV heißen
// wir mal 'TC Kriftel', mal 'MSG TC Diedenbergen/TC Kriftel/Kelkheimer TEV'.
const WIR = /kriftel/i;

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
const schlaf = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (s) => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ').trim();

/** 09.05.2026 → 2026-05-09. Alles andere gibt leer zurück. */
function datumIso(d) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

/**
 * Die Begegnungen EINER Gruppenseite.
 *
 * Die Spielplan-Tabelle ist die mit 'Gastmannschaft' im Kopf — nicht die
 * dritte oder die letzte. Über die Position zu gehen wäre der Fehler, der
 * beim nächsten Umbau der HTV-Seite stillschweigend falsche Daten liefert.
 *
 * ── Warum von HINTEN gezählt wird ──────────────────────────────────────
 * Die Spalten sind nicht in jeder Gruppe gleich. Zwei echte Beispiele:
 *
 *   Gruppe 382  Kopf:  Datum | Heim | Gast | Matchpunkte | Sätze | …
 *               Zeile: "Sa" | "09.05.2026 14:00" | "" | "Kasseler TC 31" | …
 *
 *   Gruppe 466  Kopf:  Datum | SPIELORT | Heim | Gast | Matchpunkte | …
 *               Zeile: "Sa" | "09.05.2026 09:00" | "" | "" | "TC Schwanheim" | …
 *
 * Eine zusätzliche Spalte am Anfang verschiebt alles. Feste Indizes holten
 * deshalb in der Hälfte der Gruppen die falsche Zelle — meist eine leere,
 * und das Ergebnis war 'keine eigene Begegnung'. Still und falsch.
 *
 * Hinten stimmt es dagegen immer: die Ergebnisspalten schließen die Zeile
 * ab. Also wird der Abstand jeder Spalte zum ZEILENENDE aus dem Kopf
 * gelesen und auf die Körperzeile angewandt. Dass 'Datum' im Körper in drei
 * Zellen zerfällt (Wochentag, Datum+Zeit, Verlegungszeichen) stört dann
 * nicht mehr — das passiert alles links von den Mannschaften.
 *
 * Das Datum steht nur in der ERSTEN Zeile eines Spieltags; die folgenden
 * Begegnungen desselben Tages haben dort leere Zellen und erben es.
 */
function begegnungen(html, mannschaft) {
  const tabellen = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)].map((m) => m[1]);
  const plan = tabellen.find((t) => /<th[^>]*>[\s\S]{0,40}Gastmannschaft/i.test(t));
  if (!plan) throw new Error('keine Spielplan-Tabelle gefunden (HTV-Seite umgebaut?)');

  const zeilen = [...plan.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const zellen = (tr) => [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => text(m[1]));

  const kopfZeile = zeilen.find((tr) => /<th/i.test(tr[1]));
  const kopf = kopfZeile ? zellen(kopfZeile[1]) : [];
  const vonHinten = (name) => {
    const i = kopf.findIndex((k) => new RegExp(name, 'i').test(k));
    return i < 0 ? -1 : kopf.length - 1 - i;
  };
  const dHeim = vonHinten('Heimmannschaft');
  const dGast = vonHinten('Gastmannschaft');
  const dPunkte = vonHinten('Matchpunkte');
  if (dHeim < 0 || dGast < 0) throw new Error('Spaltenkopf ohne Heim/Gast (HTV-Seite umgebaut?)');

  const raus = [];
  let datum = '';
  let uhrzeit = '';

  for (const tr of zeilen) {
    if (/<th/i.test(tr[1])) continue;
    const z = zellen(tr[1]);
    if (!z.length) continue;
    const ab = (abstand) => (abstand < 0 ? '' : z[z.length - 1 - abstand] || '');

    // Das Datum steht links von den Mannschaften, dort wo die Zellen je nach
    // Gruppe anders liegen. Also nicht zählen, sondern suchen: die erste
    // Zelle, die wie ein Datum aussieht.
    for (const feld of z.slice(0, z.length - 1 - dHeim)) {
      const wann = /^(\d{2}\.\d{2}\.\d{4})(?:\s+(\d{1,2}:\d{2}))?$/.exec(feld);
      if (wann) { datum = datumIso(wann[1]); uhrzeit = wann[2] || ''; break; }
    }

    const heim = ab(dHeim);
    const gast = ab(dGast);
    if (!heim || !gast) continue;
    if (!WIR.test(heim) && !WIR.test(gast)) continue;

    const matchpunkte = ab(dPunkte);
    const bericht = /href="(\/[^"]*meetingReport[^"]*)"/.exec(tr[1])?.[1] || '';

    raus.push({
      datum, uhrzeit, mannschaft, heim, gast,
      zuhause: WIR.test(heim),
      gegner: WIR.test(heim) ? gast : heim,
      matchpunkte,
      gespielt: /^\d+:\d+$/.test(matchpunkte),
      bericht: bericht ? 'https://htv.liga.nu' + bericht : '',
    });
  }
  return raus;
}

/**
 * Einmal holen reicht nicht.
 *
 * Der HTV antwortet gelegentlich mit einer Seite ohne Spielplan-Tabelle —
 * nicht mit einem Fehlercode, sondern mit HTTP 200 und anderem Inhalt.
 * Beobachtet: zwei Läufe hintereinander, derselbe Code, jedes Mal eine
 * ANDERE Mannschaft ohne Daten. Ein wanderender Fehler ist nie ein Fehler
 * im Parser — er liegt auf der Leitung.
 *
 * Also drei Versuche mit wachsender Pause. Was danach noch fehlt, fehlt
 * wirklich und wird als 'fehler' gemeldet statt stillschweigend zu fehlen.
 */
async function mitGeduld(url, name) {
  let zuletzt;
  for (let versuch = 1; versuch <= 3; versuch++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': KENNUNG, 'Accept-Language': 'de-DE,de;q=0.9' },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return begegnungen(await r.text(), name);
    } catch (err) {
      zuletzt = err;
      if (versuch < 3) await schlaf(1500 * versuch);
    }
  }
  throw zuletzt;
}

// ── Abrufen ────────────────────────────────────────────────────────────
const alle = [];
const fehler = [];

for (const [i, t] of teams.entries()) {
  const wb = saison.wettbewerbe[t.wettbewerb || 'standard'];
  const url = `${BASIS}?championship=${wb}&group=${t.gruppe}`;
  process.stdout.write(`[${String(i + 1).padStart(2)}/${teams.length}] ${t.name.padEnd(22)} `);
  try {
    // Die Spielgemeinschaft steht in der Mannschaftsliste, nicht auf der
    // HTV-Seite. Sie wird hier mitgeschrieben, damit die Spielplan-Datei eines
    // Jahres fuer sich vollstaendig ist: wer in zwei Jahren wissen will, mit
    // wem die Damen 2026 spielten, muss dafuer nicht die alte Liste suchen.
    const sg = t.sg && t.sg !== '—' ? t.sg : '';
    const spiele = (await mitGeduld(url, t.name)).map((b) => ({ ...b, sg }));
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
