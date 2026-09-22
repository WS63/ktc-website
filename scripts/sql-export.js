/**
 * Schreibt den gesamten Inhalt als SQL-Datei — zum Einspielen über Coolify,
 * ohne die Datenbank nach aussen zu oeffnen.
 *
 *   node scripts/sql-export.js
 *   → data/umzug.sql
 *
 * Die Datei enthaelt NUR Daten, kein Schema: die Tabellen legt der Motor
 * beim Start selbst an (runMigrations). Deshalb erst deployen, dann einspielen.
 *
 * Jede Zeile kommt als INSERT ... ON CONFLICT DO UPDATE — ein zweiter Lauf
 * ueberschreibt, statt zu verdoppeln.
 */
import { writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const QUELLE = process.env.SQLITE_FILE || 'data/site.db';
const ZIEL = process.env.SQL_DATEI || 'data/umzug.sql';

if (!existsSync(QUELLE)) {
  console.error(`Die Quelle ${QUELLE} gibt es nicht.`);
  process.exit(1);
}

const db = new DatabaseSync(QUELLE, { readOnly: true });

const TABELLEN = [
  ['pages',            'id'],
  ['navigation',       'id'],
  ['media',            'id'],
  ['redirects',        'from_path'],
  ['submissions',      'id'],
  ['config_overrides', 'schluessel'],
  ['chunks',           'id'],
  ['chat_log',         'id'],
  ['aufrufe',          'pfad, tag'],
];

/**
 * Werte fuer Postgres schreiben.
 *
 * Einfache Anfuehrungszeichen werden verdoppelt — das ist die einzige
 * Maskierung, die Postgres bei standard_conforming_strings (Vorgabe seit
 * Version 9.1) braucht. Rueckwaerts-Schraegstriche bleiben, wie sie sind,
 * und genau so stehen sie auch im JSON.
 */
function wert(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'bigint') return String(v);
  if (v instanceof Uint8Array) return `'\\x${Buffer.from(v).toString('hex')}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

const zeilen = [
  '-- Krifteler Tennisclub — Inhalt aus SQLite',
  `-- erzeugt am ${new Date().toISOString()}`,
  '--',
  '-- Einspielen in Coolify: Datenbank → Import Backup → diese Datei.',
  '-- Die Tabellen muss der Motor vorher angelegt haben (einmal deployen).',
  '',
  'BEGIN;',
  '',
];

let gesamt = 0;
for (const [tabelle, schluessel] of TABELLEN) {
  let daten;
  try {
    daten = db.prepare(`SELECT * FROM ${tabelle}`).all();
  } catch {
    zeilen.push(`-- ${tabelle}: in der Quelle nicht vorhanden`, '');
    continue;
  }
  if (!daten.length) { zeilen.push(`-- ${tabelle}: leer`, ''); continue; }

  const spalten = Object.keys(daten[0]);
  const setzen = spalten
    .filter((s) => !schluessel.split(',').map((x) => x.trim()).includes(s))
    .map((s) => `"${s}" = EXCLUDED."${s}"`).join(', ');

  zeilen.push(`-- ${tabelle}: ${daten.length} Zeilen`);
  for (const z of daten) {
    zeilen.push(
      `INSERT INTO "${tabelle}" (${spalten.map((s) => `"${s}"`).join(', ')}) VALUES (`
      + spalten.map((s) => wert(z[s])).join(', ')
      + `) ON CONFLICT (${schluessel.split(',').map((x) => `"${x.trim()}"`).join(', ')}) DO `
      + (setzen ? `UPDATE SET ${setzen}` : 'NOTHING') + ';');
  }
  zeilen.push('');
  gesamt += daten.length;
  console.log(`  ${String(daten.length).padStart(4)}  ${tabelle}`);
}

zeilen.push('COMMIT;', '');
writeFileSync(ZIEL, zeilen.join('\n'));
db.close();

const kb = Math.round(statSync(ZIEL).size / 1024);
console.log(`\n${gesamt} Zeilen → ${ZIEL} (${kb} KB)`);

const bilder = existsSync('data/uploads') ? readdirSync('data/uploads') : [];
if (bilder.length) {
  console.log(`\nHinweis: ${bilder.length} Bilder liegen unter data/uploads/ und sind`);
  console.log('NICHT in dieser Datei. Die lädst du im Cockpit unter /admin/#medien hoch.');
}
