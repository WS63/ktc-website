/**
 * Trägt Termine aus inhalte/termine.json nach, die in der Datenbank fehlen.
 *
 *   npm run termine-nachtragen              nachtragen
 *   npm run termine-nachtragen -- --trocken nur zeigen, was passieren würde
 *   npm run termine-nachtragen -- datei.json  eine andere Datei lesen
 *
 * Warum es das gibt: im Betrieb liegen die Vereinstermine in der Datenbank (Cockpit → Termine). Die Datei wird nur
 * beim allerersten Start übernommen, sonst kämen im Cockpit gelöschte Termine zurück. Wer neue Termine über die Datei
 * liefert (und sie nicht von Hand im Cockpit eintragen will), startet dieses Skript einmal: lokal im Terminal, auf dem
 * Server im Terminal des Containers (Coolify → Application → Terminal), genau wie `npm run mailtest`.
 *
 * Es ÄNDERT und LÖSCHT nichts. Es trägt nur nach, was fehlt, und prüft jeden Termin wie das Cockpit. Nicht nachgetragen
 * werden Beispieltermine, vergangene Termine und was schon da ist (src/vereinstermine.js, nachzutragen()).
 *
 * Danach die Anwendung neu starten (Coolify: Restart, lokal: den Server beenden und neu starten): der laufende Server
 * hält die Termine im Speicher und merkt von einem anderen Prozess nichts. Eine Änderung im Cockpit dagegen wirkt sofort.
 */
import { readFileSync } from 'node:fs';
import { runMigrations } from '../src/db.js';
import { loadArten } from '../src/config.js';
import { berlinTag } from '../src/zeit.js';
import { alleFuerCockpit, anlegen, nachzutragen } from '../src/vereinstermine.js';

const args = process.argv.slice(2);
const trocken = args.includes('--trocken');
const datei = args.find((a) => !a.startsWith('--')) || 'inhalte/termine.json';

let ausDatei;
try {
  ausDatei = JSON.parse(readFileSync(datei, 'utf8')).termine;
  if (!Array.isArray(ausDatei)) throw new Error('Es gibt kein Feld „termine“ mit einer Liste.');
} catch (err) {
  console.error(`Die Datei ${datei} ist nicht lesbar: ${err.message}`);
  process.exit(1);
}

await runMigrations();
const arten = Object.keys(loadArten()).filter((k) => k[0] !== '_');
const bestand = await alleFuerCockpit();
const { neu, uebersprungen, fehler } = nachzutragen(ausDatei, bestand, arten, berlinTag(Date.now()));

const zeile = (t) => `${t.datum}${t.bis ? ` bis ${t.bis}` : ''}  ${t.titel}`;
console.log(`${datei}: ${ausDatei.length} Termine, in der Datenbank ${bestand.length}.`);
for (const f of fehler) console.log(`  FEHLER   ${f.titel}: ${f.fehler.join(' ')}`);
for (const u of uebersprungen) console.log(`  übersprungen (${u.grund})  ${u.datum}  ${u.titel}`);
for (const t of neu) console.log(`  ${trocken ? 'würde eintragen' : 'eingetragen'}  ${zeile(t)}`);

if (!neu.length) console.log('Nichts nachzutragen.');
else if (!trocken) {
  for (const t of neu) await anlegen(t);
  console.log(`\n${neu.length} Termine eingetragen. Jetzt die Anwendung neu starten, damit der laufende Server sie kennt.`);
} else console.log('\nTrocken gelaufen: es wurde nichts geschrieben.');
if (fehler.length) process.exitCode = 1;
process.exit(process.exitCode || 0);
