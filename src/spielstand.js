/**
 * Der Spielstand im Speicher und in der Datenbank — und der Zeitplan, der ihn
 * beim HTV auffrischt.
 *
 * Warum im Speicher: renderPage() und die Terminlisten sind synchron und rein
 * (P1). Sie lesen von hier; geladen wird einmal beim Start und nach jedem Abruf.
 *
 * ── Wann wird abgefragt ────────────────────────────────────────────────
 * Die Vereine muessen ein Ergebnis bis 13 Uhr des Folgetags melden; die ersten
 * kommen meist vier bis sechs Stunden nach Spielbeginn. Jedes Spiel wird
 * deshalb hoechstens VIERMAL nachgesehen:
 *
 *     8 Stunden · 16 Stunden · 24 Stunden nach Beginn · Folgetag 14 Uhr
 *
 * und nur, solange sein Ergebnis fehlt. Ist es da, ist das Spiel fertig. Je
 * Abfrage wird nur die GRUPPE geholt, in der noch etwas fehlt — nicht alle 29.
 * Dazu einmal woechentlich ein Gesamtabruf (Verlegungen, neue Termine).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { query, queryOne } from './db.js';
import { berlinEpoch, berlinTag, tagPlus } from './zeit.js';
import { gruppenUrl, mitGeduld, schlaf, PAUSE_MS } from './htv.js';
import { saison as aktuelleSaison, mannschaften } from './mannschaften.js';

const STUNDE = 3600 * 1000;

let speicher = [];
let stand = '';
let laeuft = false;
let letzterVersuch = 0;

export const spielstand = () => speicher;

/** Der Spielstand im Format des Plans, wie ihn die Terminliste kennt — oder null. */
export const planAusSpeicher = () => (speicher.length
  ? { saison: speicher[0].saison, stand, begegnungen: speicher } : null);

const ausZeile = (z) => ({
  ...z, zuhause: Boolean(Number(z.zuhause)), gespielt: Boolean(Number(z.gespielt)),
  stufe: Number(z.stufe || 0), sg: z.sg || '', bericht: z.bericht || '',
});

/** Aus der Datenbank in den Speicher. */
export async function laden() {
  const zeilen = await query('SELECT * FROM spiele ORDER BY datum, uhrzeit, mannschaft');
  speicher = zeilen.map(ausZeile);
  const letzter = await queryOne("SELECT zeit FROM abrufe WHERE art <> 'fehlschlag' ORDER BY zeit DESC LIMIT 1");
  stand = letzter?.zeit || '';
  return speicher.length;
}

// ── Schreiben ──────────────────────────────────────────────────────────
export const schluessel = (saisonName, b) => `${saisonName}|${b.gruppe}|${b.heim}|${b.gast}|${b.lauf || 1}`;

/**
 * Begegnungen speichern (anlegen oder aktualisieren).
 * @returns { neu }  wie viele Ergebnisse DADURCH zum ersten Mal da sind
 */
export async function speichern(begegnungen, saisonName, jetzt = new Date().toISOString()) {
  let neu = 0;
  for (const b of begegnungen) {
    const id = schluessel(saisonName, b);
    const alt = await queryOne('SELECT gespielt, gemeldet_um FROM spiele WHERE id = $1', [id]);
    const neuGemeldet = b.gespielt && !(alt && Number(alt.gespielt));
    if (neuGemeldet && alt) neu++;           // ein ganz neuer Eintrag zaehlt nicht als 'neu gemeldet'
    // Das Datum der ersten Meldung bleibt: es sagt, wie lange ein Ergebnis schon bekannt ist.
    const gemeldet = alt?.gemeldet_um || (neuGemeldet && alt ? jetzt : null);
    await query(
      `INSERT INTO spiele (id, saison, gruppe, mannschaft, sg, datum, uhrzeit, heim, gast, zuhause,
                           gegner, matchpunkte, gespielt, bericht, gemeldet_um, geprueft_um, aktualisiert_um)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (id) DO UPDATE SET
         mannschaft = excluded.mannschaft, sg = excluded.sg, datum = excluded.datum, uhrzeit = excluded.uhrzeit,
         zuhause = excluded.zuhause, gegner = excluded.gegner, matchpunkte = excluded.matchpunkte,
         gespielt = excluded.gespielt, bericht = excluded.bericht, gemeldet_um = excluded.gemeldet_um,
         geprueft_um = excluded.geprueft_um, aktualisiert_um = excluded.aktualisiert_um`,
      [id, saisonName, String(b.gruppe), b.mannschaft, b.sg || '', b.datum || '', b.uhrzeit || '',
       b.heim, b.gast, b.zuhause ? 1 : 0, b.gegner || '', b.matchpunkte || '', b.gespielt ? 1 : 0,
       b.bericht || '', gemeldet, jetzt, jetzt]);
  }
  return { neu };
}

/** Beim allerersten Start: den Bestand aus der juengsten Jahresdatei uebernehmen. */
export async function ausDateiFuellen() {
  const verz = 'inhalte/spielplan';
  const datei = existsSync(verz) ? readdirSync(verz).filter((f) => f.endsWith('.json')).sort().pop() : null;
  if (!datei) return 0;
  const plan = JSON.parse(readFileSync(`${verz}/${datei}`, 'utf8'));
  // Aeltere Dateien kennen 'gruppe' noch nicht: dann aus der Mannschaftsliste holen.
  const gruppeVon = Object.fromEntries(mannschaften.map((t) => [t.name, String(t.gruppe)]));
  const liste = plan.begegnungen.map((b) => ({ ...b, gruppe: b.gruppe || gruppeVon[b.mannschaft] || '0' }));
  await speichern(liste, plan.saison, plan.stand || new Date().toISOString());
  await query('INSERT INTO abrufe (id, zeit, art, gruppen, neu, fehler, meldung) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [crypto.randomUUID(), plan.stand || new Date().toISOString(), 'archiv', 0, 0, 0, `aus ${datei} uebernommen`]);
  return liste.length;
}

// ── Wann ist eine Abfrage faellig? (rein, ohne Datenbank) ──────────────
/** Die vier Abfragezeiten eines Spiels, in Millisekunden. Leer, wenn der Beginn unbekannt ist. */
export function stufenZeiten(datum, uhrzeit) {
  const start = berlinEpoch(datum, uhrzeit || '12:00');
  if (!Number.isFinite(start)) return [];
  return [start + 8 * STUNDE, start + 16 * STUNDE, start + 24 * STUNDE, berlinEpoch(tagPlus(datum, 1), '14:00')];
}

/** Die hoechste faellige Stufe (1 bis 4) eines Spiels, 0 = nichts zu tun. */
export function faelligeStufe(spiel, jetzt = Date.now()) {
  if (spiel.gespielt) return 0;
  const zeiten = stufenZeiten(spiel.datum, spiel.uhrzeit);
  let stufe = 0;
  zeiten.forEach((z, i) => { if (jetzt >= z) stufe = i + 1; });
  return stufe > (spiel.stufe || 0) ? stufe : 0;
}

/** Welche Gruppen jetzt nachgesehen werden muessen: gruppe → { stufe, spiele: [id] }. */
export function faelligeGruppen(spiele, jetzt = Date.now()) {
  const raus = new Map();
  for (const s of spiele) {
    const stufe = faelligeStufe(s, jetzt);
    if (!stufe) continue;
    const g = raus.get(String(s.gruppe)) || { stufe: 0, spiele: [] };
    g.stufe = Math.max(g.stufe, stufe);
    g.spiele.push({ id: s.id, stufe });
    raus.set(String(s.gruppe), g);
  }
  return raus;
}

// ── Abrufen ────────────────────────────────────────────────────────────
async function protokoll(art, gruppen, neu, fehler, meldung) {
  await query('INSERT INTO abrufe (id, zeit, art, gruppen, neu, fehler, meldung) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [crypto.randomUUID(), new Date().toISOString(), art, gruppen, neu, fehler, String(meldung || '').slice(0, 300)]);
}

/**
 * Beim HTV nachsehen.
 * @param art     'zeitplan' | 'gesamt' | 'manuell'
 * @param gruppen nur diese Gruppen (Menge von Nummern); leer = alle Mannschaften
 * @param stufen  Map id → Stufe, die nach einem GELUNGENEN Abruf gesetzt wird
 */
export async function abrufen({ art = 'manuell', gruppen = null, stufen = null } = {}) {
  if (laeuft) return { uebersprungen: true, grund: 'Es laeuft gerade ein Abruf.' };
  laeuft = true; letzterVersuch = Date.now();
  try {
    const ziel = mannschaften.filter((t) => !gruppen || gruppen.has(String(t.gruppe)));
    const alle = []; const geholt = new Set(); const fehler = [];
    for (const [i, t] of ziel.entries()) {
      try {
        const spiele = await mitGeduld(gruppenUrl(aktuelleSaison, t), t.name);
        const sg = t.sg && t.sg !== '—' ? t.sg : '';
        alle.push(...spiele.map((b) => ({ ...b, sg, gruppe: String(t.gruppe) })));
        geholt.add(String(t.gruppe));
      } catch (err) { fehler.push(`${t.name}: ${err.message}`); }
      if (i < ziel.length - 1) await schlaf(PAUSE_MS);
    }
    // Mehr als die Haelfte kaputt: der HTV hat umgebaut oder ist nicht erreichbar. Dann
    // wird NICHTS geschrieben — dieselbe Regel wie im Skript. Lieber alt als halb.
    if (ziel.length && fehler.length > ziel.length / 2) {
      await protokoll(art, ziel.length, 0, fehler.length, `ABBRUCH: ${fehler.slice(0, 2).join(' · ')}`);
      return { ok: false, fehler };
    }
    const { neu } = await speichern(alle, aktuelleSaison.saison);
    if (stufen) {
      for (const [id, stufe] of stufen) {
        const spiel = speicher.find((s) => s.id === id);
        if (spiel && geholt.has(String(spiel.gruppe))) await query('UPDATE spiele SET stufe = $1 WHERE id = $2', [stufe, id]);
      }
    }
    await protokoll(art, geholt.size, neu, fehler.length, fehler.join(' · '));
    await laden();
    return { ok: true, gruppen: geholt.size, neu, fehler };
  } catch (err) {
    await protokoll(art, 0, 0, 1, err.message).catch(() => {});
    return { ok: false, fehler: [err.message] };
  } finally {
    laeuft = false;
  }
}

/** Ein Durchlauf des Zeitplans. Wird alle paar Minuten aufgerufen. */
export async function tick(jetzt = Date.now()) {
  // Nach einem Fehlversuch nicht sofort wieder: der HTV hat vielleicht gerade Pause.
  if (jetzt - letzterVersuch < 20 * 60 * 1000) return null;

  const faellig = faelligeGruppen(speicher, jetzt);
  if (faellig.size) {
    const stufen = new Map();
    for (const g of faellig.values()) for (const s of g.spiele) stufen.set(s.id, s.stufe);
    return abrufen({ art: 'zeitplan', gruppen: new Set(faellig.keys()), stufen });
  }

  // Einmal in der Woche alles: Verlegungen und neue Termine zeigt nur der Gesamtabruf.
  const heute = berlinTag(jetzt);
  const wochentag = new Date(`${heute}T12:00:00Z`).getUTCDay();          // 1 = Montag
  if (wochentag === 1) {
    const schon = await queryOne("SELECT zeit FROM abrufe WHERE art = 'gesamt' ORDER BY zeit DESC LIMIT 1");
    if (!schon || berlinTag(Date.parse(schon.zeit)) !== heute) return abrufen({ art: 'gesamt' });
  }
  return null;
}

let uhr = null;
export function starteZeitplan(minuten = 10) {
  if (uhr) return;
  uhr = setInterval(() => tick().catch((e) => console.error('[Spielstand] [FEHLER]', e.message)), minuten * 60 * 1000);
  uhr.unref();
  console.log(`[Spielstand] Zeitplan AN — Abruf beim HTV nach 8, 16, 24 Stunden und am Folgetag 14 Uhr.`);
}

/** Beim Start: laden, und wenn die Tabelle leer ist, aus der Jahresdatei fuellen. */
export async function starten() {
  let n = await laden();
  if (!n) { await ausDateiFuellen(); n = await laden(); }
  return n;
}

/** Fuer die Anzeige: Stand des letzten Abrufs und was der Zeitplan als Naechstes tut. */
export const infoStand = () => ({ stand, laeuft, anzahl: speicher.length });
