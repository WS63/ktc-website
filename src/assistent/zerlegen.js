import { query } from '../db.js';
import { blocks } from '../blocks/index.js';
import { loadFacts } from '../config.js';
import { alleTermine, kuenftige } from '../termin-quelle.js';

/**
 * Bausteine, die auf jeder Seite stehen — sie wuerden jede Suche fluten.
 *
 * 'assistent' gehoert unbedingt dazu: sonst indiziert der Assistent seine
 * eigene Begruessung und seine Vorschlagsfragen. Die stehen dann auf jeder
 * Seite im Index, passen wortwoertlich zu jeder Frage und verdraengen die
 * echten Inhalte. Hier gebaut und in der ersten Messung gefunden.
 */
const UEBERALL = new Set(['nav', 'footer', 'bild', 'galerie', 'assistent', 'formular']);

/** Fakten aufloesen, damit im Index echte Zahlen stehen und keine Platzhalter. */
function fakten(text) {
  const f = loadFacts();
  return String(text).replace(/\{\{facts\.([\w.]+)\}\}/g, (_, pfad) => {
    const wert = pfad.split('.').reduce((o, k) => (o ?? {})[k], f);
    return (wert == null || wert === '') ? '' : String(wert);
  });
}

/**
 * Was ein Baustein IST — als zusaetzliche Suchbegriffe.
 *
 * Das ist der Vorteil gegenueber einem Scraper, der nur HTML sieht: die
 * Struktur ist bekannt. Ein 'personen'-Baustein ist die Ansprechpartner-Liste,
 * auch wenn die Woerter „Ansprechpartner" oder „anrufen" nirgends im Text
 * stehen. Gemessen: ohne das fand „Wer kuemmert sich um die Jugend und wie
 * erreiche ich die Person?" die Vorstandsseite nicht — Spielberichte ueber
 * Jugendmannschaften schlugen den Eintrag mit der Telefonnummer.
 */
const STICHWORTE = {
  personen:  'Ansprechpartner Kontakt Vorstand zuständig anrufen erreichen Telefon E-Mail wer',
  preise:    'Preis Kosten Beitrag bezahlen teuer günstig Gebühr wieviel',
  tabelle:   'Übersicht Liste Mannschaften Liga Klasse',
  faq:       'Frage Antwort häufig FAQ',
  infokarten:'Eckdaten Termin Zeit Uhrzeit wann wo Kosten',
  beitragsliste: 'Neuigkeiten Nachrichten aktuell Berichte',
  termine:   'Termin Termine Kalender Veranstaltung wann Spieltag Saisoneröffnung',
  formular:  'schreiben Nachricht Anfrage melden',
};

/** Alles Lesbare aus einem Baustein holen — auch aus Listen und Unterobjekten. */
function textAus(wert, raus = []) {
  if (typeof wert === 'string') { if (wert.trim()) raus.push(wert.trim()); return raus; }
  if (Array.isArray(wert)) { wert.forEach((v) => textAus(v, raus)); return raus; }
  if (wert && typeof wert === 'object') {
    for (const [k, v] of Object.entries(wert)) {
      // Pfade, Ziele und Darstellungsschalter sind keine Inhalte.
      //
      // 'name' gehoert NICHT hierher, auch wenn Formularfelder so heissen:
      // im Baustein 'personen' ist 'name' der Name des Menschen. Mit 'name'
      // auf dieser Liste fehlten saemtliche Vorstandsmitglieder im Index —
      // der Assistent behauptete, es werde keine Ansprechperson genannt.
      // Der Baustein 'formular' steht ohnehin komplett in UEBERALL.
      if (/^(pfad|href|bild|bildAlt|ctaHref|zweitHref|aktionHref|linkHref|grund|breite|typ|hervor|pflicht)$/.test(k)) continue;
      textAus(v, raus);
    }
  }
  return raus;
}

/**
 * Eine Seite in suchbare Stuecke zerlegen.
 *
 * Drei Regeln, die den Unterschied machen:
 * 1. Ein Stueck traegt immer seinen Pfad mit, sonst kann die Antwort nicht
 *    auf die Quelle zeigen.
 * 2. Beim erneuten Veroeffentlichen werden die alten Stuecke einer Seite
 *    GELOESCHT, bevor die neuen kommen (siehe indiziere).
 * 3. Nicht jede Seite gehoert in den Index (chat_excluded).
 */
export function zerlege(page) {
  const inhalt = typeof page.content_json === 'string'
    ? JSON.parse(page.content_json) : page.content_json;

  const pfad = page.page_type === 'beitrag' ? `/aktuelles/${page.slug}/`
             : page.slug === 'start' ? '/' : `/${page.slug}/`;

  const stuecke = [];
  let laufend = '';

  for (const block of inhalt.blocks || []) {
    if (UEBERALL.has(block.type)) continue;
    if (!blocks[block.type]) continue;

    // Die Termine stehen nicht mehr im Baustein, sondern in
    // inhalte/termine.json. Ohne diese Zeile waere der Kalender fuer den
    // Assistenten leer — er wuesste von keinem einzigen Termin mehr.
    const daten = block.type === 'termine'
      ? { ...(block.data || {}), termine: kuenftige(alleTermine({ echt: true })) }
      : block.data || {};
    const ueberschrift = fakten(daten.titel || daten.frage || '').trim();
    const teile = textAus(daten).map(fakten).filter((t) => t.length > 2);
    const text = teile.join('\n').trim();
    if (text.length < 25) continue;

    const stichworte = STICHWORTE[block.type] || '';

    // Kurze Bausteine mit dem naechsten zusammenlegen — ein Stueck aus drei
    // Woertern findet nichts und verwaessert die Antwort.
    if (text.length < 180 && laufend.length < 900 && !stichworte) {
      laufend += (laufend ? '\n\n' : '') + text;
      continue;
    }
    if (laufend) {
      stuecke.push({ ueberschrift: '', text: laufend, stichworte: '' });
      laufend = '';
    }
    stuecke.push({ ueberschrift, text, stichworte });
  }
  if (laufend) stuecke.push({ ueberschrift: '', text: laufend, stichworte: '' });

  return stuecke.map((s, i) => ({
    id: `${page.slug}#${i}`,
    page_slug: page.slug,
    page_titel: page.title || '',
    pfad,
    ueberschrift: s.ueberschrift,
    text: s.text,
    stichworte: s.stichworte || '',
  }));
}

/** Eine Seite neu indizieren. Alte Stuecke zuerst weg. */
export async function indiziere(page) {
  await query('DELETE FROM chunks WHERE page_slug = $1', [page.slug]);
  if (page.status !== 'published' || page.chat_excluded) return 0;

  const jetzt = new Date().toISOString();
  const stuecke = zerlege(page);
  for (const s of stuecke) {
    await query(
      `INSERT INTO chunks (id, page_slug, page_titel, pfad, ueberschrift, text, stichworte, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [s.id, s.page_slug, s.page_titel, s.pfad, s.ueberschrift, s.text, s.stichworte, jetzt]);
  }
  return stuecke.length;
}

/** Alles neu aufbauen. */
export async function indiziereAlles() {
  await query('DELETE FROM chunks');
  const seiten = await query("SELECT * FROM pages WHERE status = 'published'");
  let n = 0;
  for (const p of seiten) n += await indiziere(p);
  return { seiten: seiten.length, stuecke: n };
}
