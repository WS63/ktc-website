/**
 * Die Ansicht der Ergebnisseite: welches Spielwochenende, welche Zeilen, welche Bilanz.
 *
 * Rein — der Spielstand und 'jetzt' kommen als Parameter. Die Seite zeigt
 * Mannschaften und Ergebnisse, keine Namen: dieselbe Zahl, die auf der Seite
 * des Verbands oeffentlich steht, nur gebuendelt fuer unsere Teams.
 */
import { ergebnis, bilanz } from './spielbericht.js';
import { berlinEpoch, berlinTag, tagPlus, berlinWann } from './zeit.js';

/**
 * Spielwochenenden: Tage mit Spielen, die hoechstens zwei Kalendertage
 * auseinander liegen, gehoeren zusammen. Freitag, Samstag, Sonntag sind eines;
 * ein Mittwochsspiel danach ein eigenes.
 */
export function wochenenden(spiele) {
  const tage = [...new Set(spiele.map((s) => s.datum).filter(Boolean))].sort();
  const raus = [];
  for (const tag of tage) {
    const letzte = raus.at(-1);
    if (letzte && tag <= tagPlus(letzte.bis, 2)) letzte.bis = tag;
    else raus.push({ von: tag, bis: tag });
  }
  return raus;
}

/**
 * Wer die Spielgemeinschaft meldet: steht der KTC im Namen zuerst ('KTC/Diedenb./Kelkh.'),
 * ist es eine Krifteler Mannschaft mit Spielern anderer Vereine; sonst eine Mannschaft des
 * Partnervereins mit KTC-Mitgliedern ('Diedenbergen/KTC'). Ohne 'sg' ist es keine MSG.
 */
export const sgArt = (sg) => (!sg ? '' : /^ktc\b/i.test(String(sg).trim()) ? 'ktc' : 'partner');

/**
 * Die Reihenfolge der Mannschaften in einem Block: Herren, Damen, Junioren, Juniorinnen,
 * gemischte Jugend — innerhalb davon nach Altersklasse und Zahl (Herren, Herren 30, Herren 40 II).
 */
const ARTEN = [/^herren/i, /^damen/i, /^junioren/i, /^juniorinnen/i, /^gemischt/i];
const artRang = (name) => { const i = ARTEN.findIndex((r) => r.test(String(name))); return i < 0 ? ARTEN.length : i; };

const monat = (tag) => new Date(`${tag}T12:00:00Z`).toLocaleDateString('de-DE', { month: 'long', timeZone: 'UTC' });
const tagZahl = (tag) => Number(tag.slice(8));

/** '8. bis 10. Mai', '30. Mai bis 1. Juni', '9. Mai'. */
export function wochenendeText(w) {
  if (w.von === w.bis) return `${tagZahl(w.von)}. ${monat(w.von)}`;
  return monat(w.von) === monat(w.bis)
    ? `${tagZahl(w.von)}. bis ${tagZahl(w.bis)}. ${monat(w.bis)}`
    : `${tagZahl(w.von)}. ${monat(w.von)} bis ${tagZahl(w.bis)}. ${monat(w.bis)}`;
}

const WOCHENTAG = (tag) => new Date(`${tag}T12:00:00Z`).toLocaleDateString('de-DE', { weekday: 'long', timeZone: 'UTC' });

/**
 * @param spiele  der Spielstand (Begegnungen mit datum, uhrzeit, gespielt, matchpunkte …)
 * @param we      Beginn des gewuenschten Wochenendes ('JJJJ-MM-TT'), leer = das juengste
 * @param jetzt   Millisekunden seit 1970
 */
export function ansicht(spiele, { we = '', jetzt = Date.now() } = {}) {
  const heute = berlinTag(jetzt);
  const alle = wochenenden(spiele);
  if (!alle.length) return { leer: true, eintraege: [], zuletzt: [] };

  // Standard: das juengste Wochenende, das schon angefangen hat — nicht eines in der Zukunft.
  let i = alle.findLastIndex((w) => w.von <= heute);
  if (i < 0) i = 0;
  if (we) {
    const gewuenscht = alle.findIndex((w) => we >= w.von && we <= w.bis);
    if (gewuenscht >= 0) i = gewuenscht;
  }
  const w = alle[i];

  const imFenster = spiele.filter((s) => s.datum >= w.von && s.datum <= w.bis)
    // Je Anwurfzeit zuerst die Heimspiele, dann die Auswaertsspiele, dann nach Mannschaft:
    // das ordnet die Liste, und wer zu Hause zuschaut, findet seine Spiele zusammen.
    .sort((a, b) => (a.datum + a.uhrzeit).localeCompare(b.datum + b.uhrzeit)
      || (b.zuhause ? 1 : 0) - (a.zuhause ? 1 : 0)
      || artRang(a.mannschaft) - artRang(b.mannschaft)
      || a.mannschaft.localeCompare(b.mannschaft, 'de', { numeric: true }));

  const eintraege = imFenster.map((s) => {
    const e = s.gespielt ? ergebnis(s) : null;
    const start = berlinEpoch(s.datum, s.uhrzeit || '12:00');
    return {
      tag: s.datum, wochentag: WOCHENTAG(s.datum), uhrzeit: s.uhrzeit || '',
      mannschaft: s.mannschaft, sg: s.sg || '', sgart: sgArt(s.sg), heim: s.heim, gast: s.gast, zuhause: s.zuhause,
      gegner: s.gegner, matchpunkte: s.matchpunkte || '', ausgang: e?.ausgang || '',
      // ohne Ergebnis: ist das Spiel noch nicht angepfiffen, oder fehlt die Meldung?
      status: e ? 'gespielt' : (Number.isFinite(start) && jetzt < start ? 'kommt' : 'offen'),
      gemeldet: s.gemeldet_um ? Date.parse(s.gemeldet_um) : 0,
      bericht: s.bericht || '',
    };
  });

  const fertig = imFenster.filter((s) => s.gespielt && ergebnis(s));
  // 'Gerade gemeldet': Ergebnisse, die wir in den letzten 24 Stunden zum ersten Mal sahen.
  const zuletzt = eintraege.filter((e) => e.gemeldet && jetzt - e.gemeldet < 24 * 3600 * 1000)
    .sort((a, b) => b.gemeldet - a.gemeldet).slice(0, 5)
    .map((e) => ({ ...e, wann: berlinWann(e.gemeldet, jetzt) }));

  return {
    leer: false,
    fenster: { von: w.von, bis: w.bis, text: wochenendeText(w), jahr: w.von.slice(0, 4) },
    eintraege, zuletzt,
    bilanz: bilanz(fertig),
    offen: eintraege.filter((e) => e.status !== 'gespielt').length,
    vorher: i > 0 ? { we: alle[i - 1].von, text: wochenendeText(alle[i - 1]) } : null,
    nachher: i < alle.length - 1 && alle[i + 1].von <= heute ? { we: alle[i + 1].von, text: wochenendeText(alle[i + 1]) } : null,
  };
}

/**
 * Die zuletzt gespielten Ergebnisse fuer die Startseite — nur, solange sie frisch sind.
 *
 * 'Frisch' heisst: das Spiel war gestern oder vorgestern (hoechstens zwei Kalendertage
 * her). Danach ist ein Ergebnis auf der Startseite kein Ereignis mehr, sondern
 * Altpapier; wer es sucht, findet es unter /ergebnisse/. Ohne frische Ergebnisse
 * gibt die Funktion eine leere Liste zurueck, und die Startseite zeigt wieder die
 * naechsten Termine.
 *
 * Sortiert wird nach der ERSTEN Meldung (was zuletzt hereinkam, steht oben), und
 * wo die fehlt, nach Spielbeginn.
 *
 * @returns { eintraege: die neuesten n, weitere: wie viele es sonst noch gibt, tag: 'JJJJ-MM-TT' }
 */
export function neuesteErgebnisse(spiele, { jetzt = Date.now(), n = 3, tage = 2 } = {}) {
  const heute = berlinTag(jetzt);
  const grenze = tagPlus(heute, -tage);
  const frisch = spiele.filter((s) => s.gespielt && s.datum >= grenze && s.datum <= heute && ergebnis(s));
  if (!frisch.length) return { eintraege: [], weitere: 0 };

  const wann = (s) => (s.gemeldet_um ? Date.parse(s.gemeldet_um) : berlinEpoch(s.datum, s.uhrzeit || '12:00'));
  frisch.sort((a, b) => wann(b) - wann(a));

  return {
    eintraege: frisch.slice(0, n).map((s) => ({
      mannschaft: s.mannschaft, sg: s.sg || '', sgart: sgArt(s.sg), zuhause: s.zuhause, gegner: s.gegner,
      matchpunkte: s.matchpunkte, ausgang: ergebnis(s).ausgang,
    })),
    weitere: Math.max(0, frisch.length - n),
  };
}
