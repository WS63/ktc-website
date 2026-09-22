/**
 * Den Generator von der Kommandozeile benutzen.
 *
 *   node scripts/generiere.js beitrag notizen.txt
 *   echo "drei Sätze" | node scripts/generiere.js beitrag
 *
 * Das Ergebnis landet NICHT in der Datenbank — es wird nur angezeigt.
 * Uebernommen wird im Cockpit, damit ein Mensch davorsitzt (P5).
 */
import { readFileSync } from 'node:fs';
import { aktualisiere } from '../src/config.js';
import { generiere } from '../src/generator.js';

const typ = process.argv[2] || 'beitrag';
const datei = process.argv[3];

const quelle = datei ? readFileSync(datei, 'utf8')
  : readFileSync(0, 'utf8');            // von der Standardeingabe

await aktualisiere();

console.error(`[Generator] ${typ} · ${quelle.length} Zeichen Rohmaterial …`);
const t = Date.now();
const r = await generiere({ quelle, typ });

console.error(`[Generator] ${((Date.now() - t) / 1000).toFixed(1)}s · `
  + `${r.verbrauch.hinein} hinein, ${r.verbrauch.heraus} heraus\n`);

console.error(`Titel:        ${r.title}`);
console.error(`Beschreibung: ${r.description}`);
console.error(`Bausteine:    ${r.content_json.blocks.map((b) => b.type).join(' → ')}\n`);

if (r.hinweise.length) {
  console.error('Was geprüft werden sollte:');
  r.hinweise.forEach((h) => console.error('  · ' + h));
  console.error('');
}
if (r.unbekannteFelder.length) {
  console.error(`[WARN] Erfundene Felder: ${r.unbekannteFelder.join(', ')}\n`);
}

// Das JSON auf die Standardausgabe, damit man es weiterleiten kann.
console.log(JSON.stringify(r, null, 2));
