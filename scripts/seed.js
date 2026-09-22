/**
 * Legt alle Startseiten und die uebernommenen Beitraege an.
 *
 * Idempotent, aber respektiert die Statuskette (P5): eine Seite, die ein Mensch
 * von Hand geaendert hat (status 'edited'), wird NICHT ueberschrieben.
 * Dafuer braucht es ein ausdrueckliches Force:  npm run seed -- --force
 */
import { readFileSync, existsSync } from 'node:fs';
import { runMigrations, query, queryOne } from '../src/db.js';
import { validateContent } from '../src/archetypes.js';
import { seiten } from '../src/seiten.js';

const FORCE = process.argv.includes('--force');

await runMigrations();

async function schreiben({ slug, page_type, title, description, blocks, created_at }) {
  const inhalt = { blocks };
  const pruefung = validateContent(page_type, inhalt);
  if (!pruefung.ok) {
    console.error(`[Seed] ${slug}: Inhalt verletzt den Vertrag`);
    pruefung.fehler.forEach((f) => console.error('   · ' + f));
    return 'fehler';
  }

  const jetzt = new Date().toISOString();
  const alt = await queryOne('SELECT id, status FROM pages WHERE slug = $1', [slug]);

  if (alt && alt.status === 'edited' && !FORCE) {
    // P5: was ein Mensch redigiert hat, geht nicht an einen Seed-Lauf verloren.
    console.log(`[Seed] ${slug}: übersprungen (status 'edited' — mit --force überschreiben)`);
    return 'uebersprungen';
  }

  if (alt) {
    await query(
      `UPDATE pages SET page_type = $1, title = $2, description = $3, content_json = $4,
       status = 'published', updated_at = $5 WHERE slug = $6`,
      [page_type, title, description, JSON.stringify(inhalt), jetzt, slug]);
    return 'aktualisiert';
  }
  await query(
    `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, created_at, updated_at)
     VALUES ($1, $2, $3, 'published', $4, $5, $6, $7, $8)`,
    [crypto.randomUUID(), slug, page_type, title, description,
     JSON.stringify(inhalt), created_at || jetzt, jetzt]);
  return 'angelegt';
}

// ── Die Startseiten ────────────────────────────────────────────────
const zaehler = {};
for (const s of seiten) {
  const r = await schreiben(s);
  zaehler[r] = (zaehler[r] || 0) + 1;
}

// ── Die uebernommenen Beitraege ────────────────────────────────────
// Die uebernommenen Beitraege liegen im Repository, nicht unter data/.
//
// Grund: der Server muss sich die Datenbank aus dem Repository allein
// aufbauen koennen. data/ ist von Git ausgeschlossen (dort liegen Datenbank
// und Uploads) — was der Seed braucht, gehoert also woandershin.
const importDatei = 'inhalte/beitraege.json';

// Laut sein, wenn die Datei fehlt. Vorher wurde sie stillschweigend
// uebersprungen — der Seed meldete "8 angelegt" statt 22, und niemand
// erfuhr, warum die 14 Beitraege fehlten. Genau einmal passiert, als das
// Dockerfile den Ordner nicht mitkopiert hat.
if (!existsSync(importDatei)) {
  console.error(`[Seed] [WARN] ${importDatei} fehlt — die Beiträge werden NICHT angelegt.`);
  console.error('[Seed] [WARN] Im Container: steht der Ordner inhalte/ im Dockerfile?');
}

if (existsSync(importDatei)) {
  const roh = JSON.parse(readFileSync(importDatei, 'utf8'));
  const { seitenBausteine } = await import('../src/seiten-teile.js');
  for (const b of roh) {
    const r = await schreiben({
      slug: b.slug,
      page_type: 'beitrag',
      title: b.titel,
      description: (b.absaetze[0] || '').slice(0, 160),
      created_at: `${b.datum}T12:00:00.000Z`,
      blocks: seitenBausteine.beitrag(b),
    });
    zaehler[r] = (zaehler[r] || 0) + 1;
  }
}

const summe = Object.values(zaehler).reduce((a, b) => a + b, 0);
console.log('[Seed]', Object.entries(zaehler).map(([k, v]) => `${v} ${k}`).join(' · '));
const erwartet = seiten.length + (existsSync(importDatei)
  ? JSON.parse(readFileSync(importDatei, 'utf8')).length : 0);
if (summe !== erwartet) {
  console.error(`[Seed] [WARN] ${summe} Seiten bearbeitet, erwartet waren ${erwartet}.`);
}
if (zaehler.fehler) process.exit(1);

/**
 * Der laufende Server haelt gerenderte Seiten im Speicher (src/cache.js).
 *
 * Dieses Skript ist ein EIGENER Prozess — es schreibt in die Datenbank, kann
 * den Speicher des Servers aber nicht leeren. Der liefert danach weiter die
 * alte Fassung aus, und man sucht den Fehler in der Datenbank.
 *
 * Das Cockpit leert den Cache bei jeder Aenderung selbst. Nur bei einem Lauf
 * von der Kommandozeile muss jemand neu starten.
 */
console.log('\n[Hinweis] Der laufende Server hält fertige Seiten im Speicher.');
console.log('          Damit die Änderungen sichtbar werden: Anwendung neu starten.');
console.log('          Bei Coolify: Application → Restart. Lokal: npm run dev neu starten.\n');
