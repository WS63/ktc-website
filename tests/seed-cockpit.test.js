import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

/**
 * Der Seed darf nicht still wegnehmen, was jemand im Cockpit geaendert hat.
 * Ein eigener Prozess mit eigener Datenbank, wie in der echten Anwendung.
 */
const DB = 'data/test-seed-cockpit.db';
const seed = (...args) => execFileSync('node', ['scripts/seed.js', ...args],
  { encoding: 'utf8', env: { ...process.env, SQLITE_FILE: DB, DATABASE_URL: '' } });
const zeile = (slug) => {
  const d = new DatabaseSync(DB);
  try { return d.prepare('SELECT title, content_json, seed_hash FROM pages WHERE slug = ?').get(slug); }
  finally { d.close(); }
};
const aendere = (slug, sql, ...p) => {
  const d = new DatabaseSync(DB);
  try { d.prepare(`UPDATE pages SET ${sql} WHERE slug = ?`).run(...p, slug); } finally { d.close(); }
};
const loesche = () => { for (const e of ['', '-wal', '-shm']) rmSync(`${DB}${e}`, { force: true }); };

before(loesche);
after(loesche);

test('Seed merkt sich den Stand; ein zweiter Lauf ändert nichts und überspringt nichts', () => {
  seed();
  assert.match(zeile('start').seed_hash, /^[0-9a-f]{64}$/);
  const vorher = zeile('start').content_json;
  assert.doesNotMatch(seed(), /übersprungen \(im Cockpit/);
  assert.equal(zeile('start').content_json, vorher);
});

test('eine im Cockpit geänderte Seite bleibt, bis der Seed mit --force läuft', () => {
  const original = zeile('start');
  const geaendert = original.content_json.replace('Lust auf Tennis', 'Lust auf Tennis (Cockpit)');
  assert.notEqual(geaendert, original.content_json, 'der Test braucht einen Text, den es gibt');
  aendere('start', 'content_json = ?', geaendert);
  const log = seed();
  assert.match(log, /start: übersprungen \(im Cockpit geändert/);
  assert.equal(zeile('start').content_json, geaendert, 'die Änderung ist noch da');
  // Auch eine geänderte Überschrift der Seite zählt.
  aendere('kontakt', 'title = ?', 'Kontakt (Cockpit)');
  assert.match(seed(), /kontakt: übersprungen \(im Cockpit geändert/);
  assert.equal(zeile('kontakt').title, 'Kontakt (Cockpit)');
  // Mit Force kommt der Stand aus dem Quelltext zurück und wird neu gemerkt.
  seed('--force');
  assert.equal(zeile('start').content_json, original.content_json);
  assert.notEqual(zeile('kontakt').title, 'Kontakt (Cockpit)');
  assert.doesNotMatch(seed(), /übersprungen \(im Cockpit/);
});

test('Seiten aus der Zeit vor der Prüfung (ohne gemerkten Stand) bekommen den Seed wie bisher', () => {
  aendere('start', 'seed_hash = NULL, content_json = ?', '{"blocks":[]}');
  assert.doesNotMatch(seed(), /start: übersprungen/);
  assert.notEqual(zeile('start').content_json, '{"blocks":[]}');
  assert.ok(zeile('start').seed_hash);
});
