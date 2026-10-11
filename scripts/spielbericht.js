/**
 * Aus den Ergebnissen eines Spielwochenendes einen Beitragsentwurf machen.
 *
 *   npm run spielbericht                         zeigt das juengste Wochenende (kostenlos)
 *   npm run spielbericht -- 2026-05-08 2026-05-10   ein bestimmtes Wochenende
 *   npm run spielbericht -- --erzeugen           laesst das Modell den Bericht schreiben
 *
 * Ohne --erzeugen passiert NICHTS ausser Anzeigen: kein Aufruf des Modells,
 * keine Kosten, kein Eintrag in der Datenbank. So sieht man vorher, was das
 * Modell bekaeme.
 *
 * Mit --erzeugen entsteht ein Entwurf mit Status 'generated' (P5) — nie ein
 * veroeffentlichter Beitrag. Ein Mensch liest ihn im Cockpit, aendert ihn und
 * veroeffentlicht ihn. Gibt es die Adresse schon, wird NICHTS ueberschrieben.
 *
 * Die Ergebnistabelle im Beitrag baut dieses Skript aus den HTV-Daten. Das
 * Modell schreibt nur den Text, und jedes 'a:b' darin wird gegen das
 * Rohmaterial geprueft.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { runMigrations, query, queryOne } from '../src/db.js';
import { aktualisiere } from '../src/config.js';
import { validateContent } from '../src/archetypes.js';
import { seitenBausteine } from '../src/seiten-teile.js';
import {
  spielwochenende, letztesWochenende, bilanz, rohmaterial, anweisung,
  unbelegteErgebnisse, ergebnisTabelle, zeitraumText, bilanzText,
} from '../src/spielbericht.js';

const argumente = process.argv.slice(2);
const erzeugen = argumente.includes('--erzeugen');
const tage = argumente.filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

// ── Der Spielplan ──────────────────────────────────────────────────────
const VERZ = 'inhalte/spielplan';
const datei = existsSync(VERZ) ? readdirSync(VERZ).filter((f) => f.endsWith('.json')).sort().pop() : null;
if (!datei) {
  console.error('[Spielbericht] Kein Spielplan da. Zuerst: npm run spielplan');
  process.exit(1);
}
const plan = JSON.parse(readFileSync(`${VERZ}/${datei}`, 'utf8'));

const zeitraum = tage.length >= 2 ? { von: tage[0], bis: tage[1] }
  : tage.length === 1 ? { von: tage[0], bis: tage[0] } : letztesWochenende(plan);
if (!zeitraum) {
  console.error('[Spielbericht] Im Spielplan steht noch kein gespieltes Ergebnis.');
  process.exit(1);
}

const liste = spielwochenende(plan, zeitraum.von, zeitraum.bis);
if (!liste.length) {
  console.error(`[Spielbericht] Für ${zeitraum.von} bis ${zeitraum.bis} gibt es keine gespielten Begegnungen.`);
  process.exit(1);
}

const roh = rohmaterial(liste, zeitraum.von, zeitraum.bis);
const b = bilanz(liste);
const stand = plan.stand ? new Date(plan.stand).toLocaleDateString('de-DE',
  { day: 'numeric', month: 'long', year: 'numeric' }) : '';

console.error(`[Spielbericht] ${zeitraumText(zeitraum.von, zeitraum.bis)} · ${bilanzText(b)}\n`);

if (!erzeugen) {
  console.log(roh);
  console.error('\n[Spielbericht] Nur angezeigt. Mit --erzeugen schreibt das Modell daraus einen Entwurf.');
  process.exit(0);
}

// ── Das Modell schreibt den Text ───────────────────────────────────────
const { generiere, istBereit } = await import('../src/generator.js');
if (!istBereit()) {
  console.error('[Spielbericht] ANTHROPIC_API_KEY fehlt (steht in .env).');
  process.exit(1);
}
await runMigrations();
await aktualisiere();

const slug = `spielwochenende-${zeitraum.von}`;
if (await queryOne('SELECT id FROM pages WHERE slug = $1', [slug])) {
  console.error(`[Spielbericht] /${slug}/ gibt es schon — nichts überschrieben (P5).`);
  console.error('[Spielbericht] Im Cockpit löschen, wenn der Bericht neu entstehen soll.');
  process.exit(1);
}

console.error('[Spielbericht] Das Modell schreibt …');
const r = await generiere({ quelle: roh, typ: 'beitrag', anmerkung: anweisung(zeitraum.von, zeitraum.bis) });

// Nur der TEXT zaehlt. Alles andere (Kopfzeile, Tabelle, Fusszeile) baut der
// Code — was das Modell sonst noch an Bausteinen liefert, wird nicht uebernommen.
const absaetze = r.content_json.blocks
  .filter((x) => x.type === 'richtext').flatMap((x) => x.data?.absaetze || [])
  .filter((a) => String(a).trim());
if (!absaetze.length) {
  console.error('[Spielbericht] Das Modell hat keinen Text geliefert. Nichts gespeichert.');
  process.exit(1);
}

const blocks = seitenBausteine.beitrag({ datum: zeitraum.bis, titel: r.title, absaetze });
const nachText = blocks.findIndex((x) => x.type === 'richtext') + 1;
blocks.splice(nachText, 0, { type: 'tabelle', data: ergebnisTabelle(liste, stand) });

const pruefung = validateContent('beitrag', { blocks });
if (!pruefung.ok) {
  console.error(`[Spielbericht] Vertrag verletzt: ${pruefung.fehler.join(' · ')}`);
  process.exit(1);
}

// ── Die Pruefung, die der Vertrag nicht leistet ────────────────────────
const unbelegt = unbelegteErgebnisse(`${r.title} ${absaetze.join(' ')}`, roh);
const hinweise = [...r.hinweise];
if (unbelegt.length) {
  hinweise.unshift(`ACHTUNG: Im Text stehen Ergebnisse, die es im Rohmaterial nicht gibt: ${unbelegt.join(', ')}. `
    + 'Vor dem Veröffentlichen prüfen oder streichen.');
}

// created_at = letzter Spieltag, damit der Beitrag in der Uebersicht dort
// einsortiert wird, wo er hingehoert — und nicht oben, nur weil er heute entstand.
const jetzt = new Date().toISOString();
await query(
  `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, created_at, updated_at, art)
   VALUES ($1, $2, 'beitrag', 'generated', $3, $4, $5, $6, $7, $8)`,
  [crypto.randomUUID(), slug, r.title, r.description, JSON.stringify({ blocks }),
   `${zeitraum.bis}T12:00:00.000Z`, jetzt, 'spiel']);

console.error(`\nEntwurf gespeichert: /${slug}/  (Status: Erzeugt — im Cockpit lesen und veröffentlichen)`);
console.error(`Titel:        ${r.title}`);
console.error(`Beschreibung: ${r.description}`);
console.error(`Verbrauch:    ${r.verbrauch.hinein} hinein, ${r.verbrauch.heraus} heraus\n`);
if (hinweise.length) {
  console.error('Was geprüft werden sollte:');
  hinweise.forEach((h) => console.error('  · ' + h));
  console.error('');
}
console.log(absaetze.join('\n\n'));
