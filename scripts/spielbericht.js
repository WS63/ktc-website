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
import { runMigrations } from '../src/db.js';
import { aktualisiere } from '../src/config.js';
import { starten as spielstandStarten, spielstand, infoStand } from '../src/spielstand.js';
import {
  spielwochenende, letztesWochenende, bilanz, rohmaterial, zeitraumText, bilanzText,
} from '../src/spielbericht.js';

const argumente = process.argv.slice(2);
const erzeugen = argumente.includes('--erzeugen');
const tage = argumente.filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

// ── Der Spielstand ─────────────────────────────────────────────────────
// Aus der Datenbank (beim ersten Start gefuellt aus der Jahresdatei) — dieselben
// Daten, die auch die Website zeigt.
await runMigrations();
await aktualisiere();
await spielstandStarten();
const spiele = spielstand();
if (!spiele.length) {
  console.error('[Spielbericht] Kein Spielstand da. Zuerst: npm run spielplan, danach npm run seed');
  process.exit(1);
}
const plan = { begegnungen: spiele, stand: infoStand().stand };

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
const { erzeugeEntwurf, BerichtFehler } = await import('../src/berichte.js');
try {
  console.error('[Spielbericht] Das Modell schreibt …');
  const r = await erzeugeEntwurf({ von: zeitraum.von, bis: zeitraum.bis, spiele: spielstand(), stand });
  console.error(`\nEntwurf gespeichert: /${r.slug}/  (Status: Erzeugt — im Cockpit lesen und veröffentlichen)`);
  console.error(`Titel:        ${r.titel}`);
  console.error(`Beschreibung: ${r.beschreibung}`);
  console.error(`Verbrauch:    ${r.verbrauch.hinein} hinein, ${r.verbrauch.heraus} heraus\n`);
  if (r.hinweise.length) {
    console.error('Was geprüft werden sollte:');
    r.hinweise.forEach((h) => console.error('  · ' + h));
    console.error('');
  }
  console.log(r.absaetze.join('\n\n'));
} catch (err) {
  console.error(`[Spielbericht] ${err instanceof BerichtFehler ? err.message : err.stack}`);
  process.exit(1);
}
