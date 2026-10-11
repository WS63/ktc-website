/**
 * Der HTV (nuLiga) als Datenquelle: Gruppenseiten abrufen und lesen.
 *
 * Aus scripts/spielplan.js herausgeloest, damit DASSELBE Lesen vom Skript
 * (von Hand, fuer das Jahresarchiv) und vom Server (nach Zeitplan, fuer den
 * Ergebnisdienst) benutzt wird. Zwei Kopien desselben Parsers wuerden beim
 * naechsten Umbau der HTV-Seite verschieden kaputtgehen.
 *
 * Hoeflich: eine Anfrage nach der anderen, mit Pause, mit einer Kennung, die
 * sagt, wer da klopft. robots.txt erlaubt den Abruf.
 */
export const PAUSE_MS = 700;
export const KENNUNG = 'Mozilla/5.0 (compatible; KTC-Website/1.0; +https://tennisclub-kriftel.de)';
export const BASIS = 'https://htv.liga.nu/cgi-bin/WebObjects/nuLigaTENDE.woa/wa/groupPage';

// Wir erkennen uns am Ortsnamen, nicht am Vereinskuerzel: beim HTV heissen
// wir mal 'TC Kriftel', mal 'MSG TC Diedenbergen/TC Kriftel/Kelkheimer TEV'.
export const WIR = /kriftel/i;

/** Die Adresse der Gruppenseite einer Mannschaft. */
export function gruppenUrl(saison, team) {
  const wb = saison.wettbewerbe?.[team.wettbewerb || 'standard'];
  return `${BASIS}?championship=${wb}&group=${team.gruppe}`;
}

export const schlaf = (ms) => new Promise((r) => setTimeout(r, ms));
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
export function begegnungen(html, mannschaft) {
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
  const gesehen = new Map();   // Paarung → wie oft schon (Hin- und Rueckspiel)
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

    // Dieselbe Paarung kann in einer Gruppe zweimal vorkommen (Hin- und Rueckspiel).
    // Der Durchlauf macht sie unterscheidbar, auch wenn ein Termin verlegt wird —
    // das Datum taugt dafuer nicht.
    const paar = `${heim}|${gast}`;
    const lauf = (gesehen.get(paar) || 0) + 1;
    gesehen.set(paar, lauf);

    const matchpunkte = ab(dPunkte);
    // Im HTML steht '&amp;' zwischen den Parametern. Als Adresse gespeichert und
    // spaeter erneut maskiert, wurde daraus '&amp;amp;' — ein Link, der auf eine
    // Fehlerseite fuehrt. Hier einmal zurueck in die echte Adresse.
    const bericht = (/href="(\/[^"]*meetingReport[^"]*)"/.exec(tr[1])?.[1] || '').replace(/&amp;/g, '&');

    raus.push({
      datum, uhrzeit, mannschaft, heim, gast, lauf,
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
export async function mitGeduld(url, name) {
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

