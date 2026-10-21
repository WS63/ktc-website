import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { einsortieren } from '../src/menue.js';

/** Eine Datenbank im Speicher, mit derselben Aufrufform wie src/db.js. */
function datenbank(zeilen) {
  const d = new DatabaseSync(':memory:');
  d.exec('CREATE TABLE navigation (id TEXT, parent_id TEXT, ort TEXT, label TEXT, href TEXT, sort INT, visible INT)');
  for (const [ort, href, sort] of zeilen) {
    d.prepare('INSERT INTO navigation (id, ort, label, href, sort, visible) VALUES (?, ?, ?, ?, ?, 1)')
      .run(href + ort, ort, href, href, sort);
  }
  const query = async (sql, p = []) => {
    const s = d.prepare(sql.replace(/\$\d+/g, '?'));
    return /^\s*SELECT/i.test(sql) ? s.all(...p) : (s.run(...p), []);
  };
  const reihenfolge = (ort) => d.prepare('SELECT href FROM navigation WHERE ort = ? ORDER BY sort')
    .all(ort).map((r) => r.href);
  return { d, query, reihenfolge };
}

const menue = [
  { ort: 'kopf', label: 'Club', href: '/' },
  { ort: 'kopf', label: 'Sport', href: '/sport/' },
  { ort: 'kopf', label: 'Aktuelles', href: '/aktuelles/' },
  { ort: 'kopf', label: 'Termine', href: '/kalender/' },
  { ort: 'kopf', label: 'Kontakt', href: '/kontakt/' },
  { ort: 'fuss', label: 'Clubhaus', href: '/clubhaus/' },
  { ort: 'fuss', label: 'Häufige Fragen', href: '/faq/' },
];

test('ein fehlender Punkt kommt hinter seinen Vorgaenger, nicht ans Ende', async () => {
  const { query, reihenfolge } = datenbank([
    ['kopf', '/', 0], ['kopf', '/sport/', 1], ['kopf', '/aktuelles/', 2], ['kopf', '/kontakt/', 3],
    ['fuss', '/faq/', 0],
  ]);
  const neu = await einsortieren(query, menue);
  assert.deepEqual(neu.map((p) => p.href), ['/kalender/', '/clubhaus/']);
  assert.deepEqual(reihenfolge('kopf'), ['/', '/sport/', '/aktuelles/', '/kalender/', '/kontakt/']);
  // Clubhaus hat in der Fusszeile keinen Vorgaenger: es kommt an den Anfang.
  assert.deepEqual(reihenfolge('fuss'), ['/clubhaus/', '/faq/']);
});

test('eine im Cockpit umsortierte Reihenfolge bleibt, der neue Punkt kommt dazu', async () => {
  const { query, reihenfolge } = datenbank([
    ['kopf', '/kontakt/', 0], ['kopf', '/', 1], ['kopf', '/aktuelles/', 2], ['kopf', '/sport/', 3],
  ]);
  await einsortieren(query, menue.filter((p) => p.ort === 'kopf'));
  const r = reihenfolge('kopf');
  assert.deepEqual(r.filter((h) => h !== '/kalender/'), ['/kontakt/', '/', '/aktuelles/', '/sport/']);
  assert.equal(r.indexOf('/kalender/'), r.indexOf('/aktuelles/') + 1);
});

test('ist alles da, passiert nichts', async () => {
  const { query, reihenfolge } = datenbank([
    ['kopf', '/', 0], ['kopf', '/sport/', 1], ['kopf', '/aktuelles/', 2], ['kopf', '/kalender/', 3],
    ['kopf', '/kontakt/', 4], ['fuss', '/clubhaus/', 0], ['fuss', '/faq/', 1],
  ]);
  assert.deepEqual(await einsortieren(query, menue), []);
  assert.equal(reihenfolge('kopf').length, 5);
});

// ── Die Migrationen 008 und 009 gegen echte Ausgangslagen ─────────────────
const migration = (n) => readFileSync(`migrations/${n}`, 'utf8');
const nachMigration = (n, zeilen) => {
  const { d, reihenfolge } = datenbank(zeilen);
  d.exec(migration(n));
  return reihenfolge('kopf');
};

for (const n of ['008_menue_reihenfolge.sql', '009_menue_reihenfolge_2.sql']) {
  test(`${n}: Kontakt vor Termine wird getauscht, jede andere Lage bleibt`, () => {
    const alt = [['kopf', '/aktuelles/', 6], ['kopf', '/kontakt/', 7], ['kopf', '/kalender/', 8]];
    assert.deepEqual(nachMigration(n, alt), ['/aktuelles/', '/kalender/', '/kontakt/']);
    // Schon richtig: nicht anfassen.
    const richtig = [['kopf', '/aktuelles/', 6], ['kopf', '/kalender/', 7], ['kopf', '/kontakt/', 8]];
    assert.deepEqual(nachMigration(n, richtig), ['/aktuelles/', '/kalender/', '/kontakt/']);
    // Ein Punkt fehlt (Server vor dem Kalender): keine Aenderung, kein Fehler.
    assert.deepEqual(nachMigration(n, [['kopf', '/aktuelles/', 6], ['kopf', '/kontakt/', 7]]),
      ['/aktuelles/', '/kontakt/']);
  });
}

test('009: Clubhaus rutscht in der Fusszeile vor FAQ, wenn es hinten angehaengt war', () => {
  const { d, reihenfolge } = datenbank([
    ['fuss', '/faq/', 0], ['fuss', '/impressum/', 1], ['fuss', '/datenschutz/', 2], ['fuss', '/clubhaus/', 3],
  ]);
  d.exec(migration('009_menue_reihenfolge_2.sql'));
  assert.deepEqual(reihenfolge('fuss'), ['/clubhaus/', '/faq/', '/impressum/', '/datenschutz/']);
});

test('013: FAQ heißt in der Fußzeile „Häufige Fragen“, ein selbst benannter Punkt bleibt', () => {
  const { d } = datenbank([['fuss', '/faq/', 0], ['fuss', '/impressum/', 1]]);
  d.exec("UPDATE navigation SET label = 'FAQ' WHERE href = '/faq/'");
  d.exec("UPDATE navigation SET label = 'Fragen und Antworten' WHERE href = '/impressum/'");
  d.exec(migration('013_haeufige_fragen.sql'));
  const label = (href) => d.prepare('SELECT label FROM navigation WHERE href = ?').get(href).label;
  assert.equal(label('/faq/'), 'Häufige Fragen');
  d.exec("UPDATE navigation SET label = 'Fragen und Antworten' WHERE href = '/faq/'");
  d.exec(migration('013_haeufige_fragen.sql'));
  assert.equal(label('/faq/'), 'Fragen und Antworten', 'ein selbst vergebener Name wird nicht überschrieben');
  assert.equal(label('/impressum/'), 'Fragen und Antworten');
});

test('Die Seiten und Vorgaben nennen den Link nirgends mehr „FAQ“', () => {
  for (const datei of ['src/seiten.js', 'src/seiten-teile.js', 'scripts/seed-struktur.js']) {
    const text = readFileSync(datei, 'utf8');
    assert.doesNotMatch(text, /label: *'FAQ'/, `${datei}: der sichtbare Name ist „Häufige Fragen“`);
  }
});

test('015: die Satzung verschwindet aus der Fußzeile, andere Punkte und Kopfzeile bleiben', () => {
  const { d } = datenbank([['fuss', '/satzung-und-ordnungen/', 0], ['fuss', '/impressum/', 1], ['kopf', '/satzung-und-ordnungen/', 0]]);
  d.exec(migration('015_satzung_nicht_im_fuss.sql'));
  const sichtbar = (ort, href) => d.prepare('SELECT visible FROM navigation WHERE ort = ? AND href = ?').get(ort, href).visible;
  assert.equal(sichtbar('fuss', '/satzung-und-ordnungen/'), 0);
  assert.equal(sichtbar('fuss', '/impressum/'), 1);
  assert.equal(sichtbar('kopf', '/satzung-und-ordnungen/'), 1, 'nur die Fußzeile');
});

test('Die Satzung steht auf „Mitglied werden“, nicht in der Fußzeile; die Kündigung nennt das Jahresende', async () => {
  const { seiten } = await import('../src/seiten.js');
  const mw = seiten.find((x) => x.slug === 'mitglied-werden');
  assert.match(JSON.stringify(mw.blocks.at(-3)), /satzung-und-ordnungen/, 'ganz hinten, vor Assistent und Fußzeile');
  const text = JSON.stringify(mw.blocks);
  assert.match(text, /Kündigung zum Jahresende/);
  assert.match(text, /Spätester Termin ist der \{\{facts\.beitraege\.kuendigungsfrist\}\}/);
  for (const s of seiten) {
    const fuss = s.blocks.find((b) => b.type === 'footer');
    if (fuss) assert.doesNotMatch(JSON.stringify(fuss), /satzung/i, `${s.slug}: Fußzeile ohne Satzung`);
  }
});

test('016: die Platzordnung ist archiviert, die alte Adresse leitet um, der Index verliert die Stücke; läuft zweimal', () => {
  const { d } = datenbank([]);
  d.exec('CREATE TABLE pages (slug TEXT, status TEXT)');
  d.exec('CREATE TABLE redirects (from_path TEXT PRIMARY KEY, to_path TEXT NOT NULL, code INT, created_at TEXT)');
  d.exec('CREATE TABLE chunks (page_slug TEXT, text TEXT)');
  d.exec("INSERT INTO pages VALUES ('platzordnung','published'), ('sport','published')");
  d.exec("INSERT INTO chunks VALUES ('platzordnung','x'), ('sport','y')");
  d.exec(migration('016_platzordnung_in_ebusy.sql'));
  d.exec(migration('016_platzordnung_in_ebusy.sql'));
  const status = (slug) => d.prepare('SELECT status FROM pages WHERE slug = ?').get(slug).status;
  assert.equal(status('platzordnung'), 'archived');
  assert.equal(status('sport'), 'published');
  assert.deepEqual(d.prepare('SELECT from_path, to_path, code FROM redirects').all().map((r) => ({ ...r })),
    [{ from_path: '/platzordnung/', to_path: '/satzung-und-ordnungen/', code: 301 }]);
  assert.deepEqual(d.prepare('SELECT page_slug FROM chunks').all().map((r) => r.page_slug), ['sport']);
});

test('Keine Seite verlinkt mehr auf /platzordnung/; die Platzordnung kommt aus eBuSy', async () => {
  const { seiten } = await import('../src/seiten.js');
  assert.equal(seiten.find((s) => s.slug === 'platzordnung'), undefined);
  assert.doesNotMatch(JSON.stringify(seiten), /\(\/platzordnung\/\)|"\/platzordnung\/"/);
  assert.match(JSON.stringify(seiten.find((s) => s.slug === 'satzung-und-ordnungen')), /Platzordnung in eBuSy\]\(\{\{facts\.links\.buchung\}\}\)/);
});
