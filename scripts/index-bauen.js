/** Den Suchindex des Assistenten neu aufbauen. */
import { runMigrations } from '../src/db.js';
import { aktualisiere } from '../src/config.js';
import { indiziereAlles } from '../src/assistent/zerlegen.js';
import { query } from '../src/db.js';

await runMigrations();
await aktualisiere();

/**
 * Pflichtseiten gehoeren nicht in den Index.
 *
 * Gemessen: auf die Frage „Wer kuemmert sich um die Jugend?" stand
 * /datenschutz/ auf Platz 1 — dort kommen „personenbezogene Daten" und
 * „Mitglieder" so oft vor, dass die Seite zu fast jeder Frage passt.
 * Sie beantwortet keine davon.
 */
const RAUS = ['impressum', 'datenschutz'];
for (const slug of RAUS) {
  await query('UPDATE pages SET chat_excluded = 1 WHERE slug = $1', [slug]);
}
const r = await indiziereAlles();
console.log(`[Assistent] ${r.stuecke} Stücke aus ${r.seiten} Seiten.`);
