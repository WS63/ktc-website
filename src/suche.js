/**
 * Die Suche in Beitraegen und Terminen — reine Funktionen, ohne Datenbank.
 *
 * Sie laeuft in JavaScript und nicht in SQL, aus demselben Grund wie die Suche
 * des Assistenten: sonst wuesste sie, welche Datenbank laeuft, und genau das
 * verhindert src/db.js. Bei einigen Dutzend Beitraegen im Jahr ist das keine
 * Frage der Geschwindigkeit; jenseits von ein paar tausend waere es ein Umzug.
 *
 * Gesucht wird ohne Rücksicht auf Gross-/Kleinschreibung und Umlaute: wer
 * 'Maenner' tippt, findet 'Männer', und 'ss' findet 'ß'. Mehrere Woerter
 * gelten zusammen (UND) — 'Herren Heimspiel' findet nur, was beides enthaelt.
 */

export const normal = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/ß/g, 'ss')
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
  .normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Der Suchtext aus einer Eingabe: bereinigt und auf 80 Zeichen begrenzt. */
export const suchtext = (roh) => String(Array.isArray(roh) ? roh[0] : roh ?? '')
  .replace(/\s+/g, ' ').trim().slice(0, 80);

/** Die einzelnen Suchwoerter. Ein Buchstabe allein findet alles und nichts. */
export const begriffe = (q) => normal(q).split(' ').filter((t) => t.length >= 2).slice(0, 5);

/** Enthaelt der Text ALLE Suchwoerter? Ohne Suchwoerter: nein. */
export function trifft(text, terms) {
  if (!terms.length) return false;
  const heu = normal(text);
  return terms.every((t) => heu.includes(t));
}

/**
 * Der lesbare Text eines Beitrags: die Absaetze und Ueberschriften der
 * Textbausteine. Kopfzeile, Fusszeile, Assistent und die Ergebnistabelle
 * zaehlen nicht mit — sonst fuende jede Suche nach 'Impressum' jeden Beitrag.
 */
export function beitragstext(contentJson) {
  const inhalt = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson;
  const teile = [];
  for (const b of inhalt?.blocks || []) {
    if (b.type !== 'richtext') continue;
    if (b.data?.titel) teile.push(b.data.titel);
    for (const a of b.data?.absaetze || []) teile.push(String(a).replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'));
  }
  return teile.join(' ');
}

/** Beitraege (Zeilen aus der Datenbank) nach einem Suchtext filtern. Reihenfolge bleibt. */
export function beitraegeFiltern(zeilen, q) {
  const terms = begriffe(q);
  return zeilen.filter((z) => trifft(`${z.title} ${z.description || ''} ${beitragstext(z.content_json)}`, terms));
}

/** Termine nach einem Suchtext filtern, einschliesslich der Mannschaften eines Spieltags. */
export function termineFiltern(termine, q) {
  const terms = begriffe(q);
  return termine.filter((t) => {
    const paarungen = (t.gruppen || []).flatMap((g) => [g.titel, ...g.zeilen.flatMap((z) => [z.mannschaft, z.sg, z.gegner])]);
    return trifft([t.titel, t.text, t.ort, t.tag, t.datum, t.uhrzeit, t.symbolText, ...paarungen].filter(Boolean).join(' '), terms);
  });
}
