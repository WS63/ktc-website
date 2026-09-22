/** Navigation und die Umleitungstabelle aus docs/vorlage.md — einmalig. */
import { runMigrations, query, queryOne } from '../src/db.js';

await runMigrations();
const jetzt = () => new Date().toISOString();

const menue = [
  { ort: 'kopf', label: 'Club',            href: '/' },
  { ort: 'kopf', label: 'Sport',           href: '/sport/' },
  { ort: 'kopf', label: 'Mitglied werden', href: '/mitglied-werden/' },
  { ort: 'kopf', label: 'Aktuelles',       href: '/aktuelles/' },
  { ort: 'kopf', label: 'Kontakt',         href: '/kontakt/' },
  { ort: 'fuss', label: 'FAQ',             href: '/faq/' },
  { ort: 'fuss', label: 'Impressum',       href: '/impressum/' },
  { ort: 'fuss', label: 'Datenschutz',     href: '/datenschutz/' },
];

if ((await query('SELECT id FROM navigation')).length === 0) {
  let i = 0;
  for (const p of menue) {
    await query(
      `INSERT INTO navigation (id, parent_id, ort, label, href, sort, visible)
       VALUES ($1, NULL, $2, $3, $4, $5, 1)`,
      [crypto.randomUUID(), p.ort, p.label, p.href, i++]);
  }
  console.log(`[Struktur] ${menue.length} Menüpunkte angelegt.`);
} else {
  console.log('[Struktur] Navigation steht schon — nicht angefasst.');
}

// Die Umleitungstabelle aus docs/vorlage.md. Das ist der Punkt, an dem
// Neubauten Sichtbarkeit verlieren, und er wird fast immer vergessen.
const um = [
  ['/team_sport/', '/sport/'],
  ['/hobby-und-freizeit-spieler/', '/sport/'],
  ['/startseite-2/jugend/', '/sport/'],
  ['/tennisschule/', '/sport/'],
  ['/tennis-fuer-minis/', '/sport/'],
  ['/trainer/', '/sport/'],
  ['/startseite-2/der-vorstand/', '/kontakt/'],
  ['/anfahrt/', '/kontakt/'],
  ['/blog/', '/aktuelles/'],
  ['/startseite-2/startseiite/', '/'],
  ['/startseite-2/startseite-3/', '/'],
  ['/social-media/', '/'],
  ['/service/', '/'],
  ['/sponsoren/', '/'],
  ['/category/uncategorized/', '/aktuelles/'],
  ['/category/sport/', '/aktuelles/'],
  ['/category/vereinsleben/', '/aktuelles/'],
  ['/category/jugend/', '/aktuelles/'],
];

let neu = 0;
for (const [von, nach] of um) {
  if (await queryOne('SELECT from_path FROM redirects WHERE from_path = $1', [von])) continue;
  await query(
    'INSERT INTO redirects (from_path, to_path, code, created_at) VALUES ($1, $2, 301, $3)',
    [von, nach, jetzt()]);
  neu++;
}

// Die alten Beitrags-Adressen /JJJJ/MM/slug/ zeigen auf /aktuelles/slug/.
const beitraege = await query("SELECT slug, created_at FROM pages WHERE page_type = 'beitrag'");
for (const b of beitraege) {
  const d = new Date(b.created_at);
  const von = `/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${b.slug}/`;
  if (await queryOne('SELECT from_path FROM redirects WHERE from_path = $1', [von])) continue;
  await query(
    'INSERT INTO redirects (from_path, to_path, code, created_at) VALUES ($1, $2, 301, $3)',
    [von, `/aktuelles/${b.slug}/`, jetzt()]);
  neu++;
}

console.log(`[Struktur] ${neu} Umleitungen angelegt.`);

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
