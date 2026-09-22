/**
 * Umzug von SQLite nach Postgres.
 *
 *   SQLITE_FILE=data/site.db \
 *   ZIEL_DATABASE_URL=postgres://… \
 *   node scripts/umzug.js
 *
 * Laeuft die Tabellen der Reihe nach durch, legt das Schema im Ziel an und
 * kopiert jede Zeile. Idempotent: ein zweiter Lauf ueberschreibt, statt zu
 * verdoppeln. Die Quelle wird nur gelesen.
 *
 * Die Bilder unter data/uploads/ kopiert das Skript NICHT — die gehoeren auf
 * das Volume des Servers. Wie, steht am Ende der Ausgabe.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const ZIEL = process.env.ZIEL_DATABASE_URL || process.env.DATABASE_URL;
const QUELLE = process.env.SQLITE_FILE || 'data/site.db';

if (!ZIEL) {
  console.error('ZIEL_DATABASE_URL fehlt. Beispiel:\n'
    + '  ZIEL_DATABASE_URL=postgres://nutzer:passwort@host:5432/ktc node scripts/umzug.js');
  process.exit(1);
}
if (!existsSync(QUELLE)) {
  console.error(`Die Quelle ${QUELLE} gibt es nicht.`);
  process.exit(1);
}

// src/db.js entscheidet BEIM IMPORTIEREN, welche Datenbank es nimmt.
// Deshalb muss DATABASE_URL vorher stehen — sonst laufen die Migrationen
// gegen SQLite und das Ziel bleibt leer. Hier gestolpert.
process.env.DATABASE_URL = ZIEL;

const pg = (await import('pg')).default;
const pool = new pg.Pool({ connectionString: ZIEL });
const alt = new DatabaseSync(QUELLE, { readOnly: true });

// Reihenfolge egal — es gibt keine Fremdschluessel. Die Schluessel der
// Tabellen stehen dabei, damit ein zweiter Lauf ueberschreibt.
const TABELLEN = [
  ['pages',             'id'],
  ['navigation',        'id'],
  ['media',             'id'],
  ['redirects',         'from_path'],
  ['submissions',       'id'],
  ['config_overrides',  'schluessel'],
  ['chunks',            'id'],
  ['chat_log',          'id'],
  ['schema_migrations', 'name'],
];

console.log(`[Umzug] ${QUELLE}  →  ${ZIEL.replace(/:[^:@]*@/, ':***@')}`);

// 1. Schema im Ziel anlegen — dieselben Migrationen wie lokal.
const { runMigrations } = await import('../src/db.js');
await runMigrations();
console.log('[Umzug] Schema steht.');

// 2. Zeilen kopieren.
let gesamt = 0;
for (const [tabelle, schluessel] of TABELLEN) {
  let zeilen;
  try {
    zeilen = alt.prepare(`SELECT * FROM ${tabelle}`).all();
  } catch {
    console.log(`[Umzug] ${tabelle}: gibt es in der Quelle nicht, übersprungen.`);
    continue;
  }
  if (!zeilen.length) { console.log(`[Umzug] ${tabelle}: leer.`); continue; }

  const spalten = Object.keys(zeilen[0]);
  const platzhalter = spalten.map((_, i) => `$${i + 1}`).join(', ');
  const setzen = spalten.filter((s) => s !== schluessel)
    .map((s) => `"${s}" = EXCLUDED."${s}"`).join(', ');

  const sql = `INSERT INTO "${tabelle}" (${spalten.map((s) => `"${s}"`).join(', ')})
               VALUES (${platzhalter})
               ON CONFLICT ("${schluessel}") DO ${setzen ? `UPDATE SET ${setzen}` : 'NOTHING'}`;

  for (const z of zeilen) await pool.query(sql, spalten.map((s) => z[s]));
  gesamt += zeilen.length;
  console.log(`[Umzug] ${tabelle}: ${zeilen.length} Zeilen.`);
}

await pool.end();
alt.close();

console.log(`\n[Umzug] Fertig. ${gesamt} Zeilen.`);

// 3. Die Bilder erinnern — sie gehen sonst still verloren.
const bilder = existsSync('data/uploads') ? readdirSync('data/uploads') : [];
if (bilder.length) {
  const groesse = bilder.reduce((s, f) => s + readFileSync(`data/uploads/${f}`).length, 0);
  console.log(`\n[Umzug] ACHTUNG: ${bilder.length} Bilder (${Math.round(groesse / 1024)} KB) `
    + 'liegen noch lokal unter data/uploads/.');
  console.log('Ohne sie zeigt die Website auf Dateien, die es dort nicht gibt. Kopieren mit:');
  console.log('  docker cp data/uploads/. <container>:/app/data/uploads/');
  console.log('oder in Coolify über das Terminal des Containers.');
}
