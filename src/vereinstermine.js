/**
 * Die Vereinstermine: in der Datenbank, im Speicher und im Cockpit gepflegt.
 *
 * Warum im Speicher: renderPage() und die Terminlisten sind synchron und rein (P1), genau wie beim Spielstand
 * (src/spielstand.js). Geladen wird beim Start und nach jeder Aenderung im Cockpit.
 *
 * Die Pruefung (pruefe) ist eine reine Funktion: sie bekommt, was ein Mensch eingegeben hat, und gibt entweder einen
 * sauberen Termin oder eine Liste von Fehlern zurueck. Der Server vertraut nie dem, was das Cockpit schickt.
 */
import { query, queryOne } from './db.js';
import { readFileSync } from 'node:fs';

const DATEI = 'inhalte/termine.json';
const MARKE = 'vereinstermine_importiert';

let speicher = null;   // null = noch nicht geladen (Tests ohne Datenbank lesen die Datei, siehe termin-quelle.js)

/** Die Termine im Speicher im Format der Terminliste, oder null, wenn noch nichts geladen wurde. */
export const termineAusSpeicher = () => speicher;

const gueltigesDatum = (t) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t || '')) return false;
  const d = new Date(`${t}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === t;
};
const gueltigeZeit = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t || '');
const sauber = (t, max) => String(t ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

/**
 * Eine Eingabe pruefen und bereinigen.
 * @param eingabe  was das Cockpit schickt (Felder als Text)
 * @param arten    die erlaubten Arten (Schluessel aus config/arten.json)
 * @returns { ok: true, termin } oder { ok: false, fehler: [..] }
 */
export function pruefe(eingabe, arten) {
  const fehler = [];
  const e = eingabe || {};
  const datum = sauber(e.datum, 10), bis = sauber(e.bis, 10);
  const uhrzeit = sauber(e.uhrzeit, 5), ende = sauber(e.ende, 5);
  const titel = sauber(e.titel, 120);
  const art = sauber(e.art, 20) || 'club';
  const mehr = sauber(e.mehr, 300);

  if (!gueltigesDatum(datum)) fehler.push('Das Datum fehlt oder ist ungültig (Tag.Monat.Jahr).');
  if (bis && !gueltigesDatum(bis)) fehler.push('Das Enddatum ist ungültig.');
  if (bis && gueltigesDatum(datum) && bis < datum) fehler.push('Das Enddatum liegt vor dem Beginn.');
  if (uhrzeit && !gueltigeZeit(uhrzeit)) fehler.push('Die Uhrzeit ist ungültig (zum Beispiel 14:30).');
  if (ende && !gueltigeZeit(ende)) fehler.push('Das Ende ist ungültig (zum Beispiel 16:00).');
  if (ende && !uhrzeit) fehler.push('Ein Ende braucht auch einen Beginn.');
  if (ende && uhrzeit && !bis && ende <= uhrzeit) fehler.push('Das Ende liegt vor dem Beginn.');
  if (!titel) fehler.push('Der Titel fehlt.');
  if (!arten.includes(art)) fehler.push('Diese Art gibt es nicht.');
  // Nur Adressen innerhalb der Website oder https: nie javascript: oder data:, nie //fremde-seite.
  if (mehr && !(/^\/(?!\/)/.test(mehr) || /^https:\/\//.test(mehr))) {
    fehler.push('Der Link muss mit / (eine Seite dieser Website) oder https:// beginnen.');
  }
  if (fehler.length) return { ok: false, fehler };

  const termin = { datum, art, titel };
  if (bis && bis !== datum) termin.bis = bis;
  if (uhrzeit) termin.uhrzeit = uhrzeit;
  if (ende) termin.ende = ende;
  const text = sauber(e.text, 1200); if (text) termin.text = text;
  const ort = sauber(e.ort, 120); if (ort) termin.ort = ort;
  if (mehr) { termin.mehr = mehr; termin.mehrLabel = sauber(e.mehrLabel, 80) || 'Mehr erfahren'; }
  if (e.beispiel === true) termin.beispiel = true;
  return { ok: true, termin };
}

const ausZeile = (z) => {
  const t = { datum: z.datum, art: z.art, titel: z.titel };
  for (const [k, v] of [['bis', z.bis], ['uhrzeit', z.uhrzeit], ['ende', z.ende], ['text', z.beschreibung],
    ['ort', z.ort], ['mehr', z.mehr], ['mehrLabel', z.mehr_label]]) if (v) t[k] = v;
  if (Number(z.beispiel)) t.beispiel = true;
  return t;
};

/** Aus der Datenbank in den Speicher. Gibt die Zahl zurueck. */
export async function laden() {
  const zeilen = await query('SELECT * FROM vereinstermine ORDER BY datum, uhrzeit, titel');
  speicher = zeilen.map(ausZeile);
  return speicher.length;
}

/** Alle Termine fuer das Cockpit, mit Kennung. */
export async function alleFuerCockpit() {
  const zeilen = await query('SELECT * FROM vereinstermine ORDER BY datum, uhrzeit, titel');
  return zeilen.map((z) => ({ id: z.id, ...ausZeile(z) }));
}

const spalten = (t) => [t.datum, t.bis || null, t.uhrzeit || null, t.ende || null, t.art, t.titel,
  t.text || null, t.ort || null, t.mehr || null, t.mehrLabel || null, t.beispiel ? 1 : 0];

export async function anlegen(t, jetzt = new Date().toISOString()) {
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO vereinstermine (id, datum, bis, uhrzeit, ende, art, titel, beschreibung, ort, mehr, mehr_label, beispiel,
       created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [id, ...spalten(t), jetzt, jetzt]);
  await laden();
  return id;
}

/** @returns false, wenn es den Termin nicht gibt */
export async function aendern(id, t, jetzt = new Date().toISOString()) {
  if (!await queryOne('SELECT id FROM vereinstermine WHERE id = $1', [id])) return false;
  await query(
    `UPDATE vereinstermine SET datum = $1, bis = $2, uhrzeit = $3, ende = $4, art = $5, titel = $6, beschreibung = $7,
       ort = $8, mehr = $9, mehr_label = $10, beispiel = $11, updated_at = $12 WHERE id = $13`,
    [...spalten(t), jetzt, id]);
  await laden();
  return true;
}

export async function loeschen(id) {
  if (!await queryOne('SELECT id FROM vereinstermine WHERE id = $1', [id])) return false;
  await query('DELETE FROM vereinstermine WHERE id = $1', [id]);
  await laden();
  return true;
}

/**
 * Beim Start: ist die Tabelle leer und wurde die Datei noch nie uebernommen, kommen ihre Termine einmal hinein.
 * Die Marke verhindert, dass geloeschte Termine beim naechsten Start wieder auftauchen.
 */
export async function starten(arten) {
  let n = await laden();
  if (!n && !await queryOne('SELECT schluessel FROM config_overrides WHERE schluessel = $1', [MARKE])) {
    let liste = [];
    try { liste = JSON.parse(readFileSync(DATEI, 'utf8')).termine || []; } catch { /* keine Datei, keine Termine */ }
    for (const roh of liste) {
      const p = pruefe({ ...roh, beispiel: roh.beispiel === true }, arten);
      if (p.ok) await anlegen(p.termin);
      else console.warn(`[Termine] Übernahme: „${roh.titel}“ übersprungen (${p.fehler.join(' ')})`);
    }
    await query('INSERT INTO config_overrides (schluessel, wert, updated_at) VALUES ($1, $2, $3)',
      [MARKE, JSON.stringify(new Date().toISOString()), new Date().toISOString()]);
    n = await laden();
  }
  return n;
}
