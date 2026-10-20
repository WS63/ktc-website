import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { grenze, raeumeAuf } from '../src/aufraeumen.js';

const jetzt = new Date('2026-10-20T12:00:00.000Z');

test('Fristen werden in einen Zeitpunkt umgerechnet, Unverständliches ergibt null', () => {
  assert.equal(grenze('90 Tage', jetzt), '2026-07-22T12:00:00.000Z');
  assert.equal(grenze('12 Monate', jetzt), '2025-10-20T12:00:00.000Z');
  assert.equal(grenze('2 Wochen', jetzt), '2026-10-06T12:00:00.000Z');
  assert.equal(grenze('1 Jahr', jetzt), '2025-10-20T12:00:00.000Z');
  for (const falsch of ['', undefined, 'bald', '0 Tage', 'zwölf Monate', '12']) {
    assert.equal(grenze(falsch, jetzt), null, `„${falsch}“ darf nichts löschen`);
  }
});

function datenbank() {
  const d = new DatabaseSync(':memory:');
  d.exec('CREATE TABLE submissions (id TEXT, created_at TEXT)');
  d.exec('CREATE TABLE chat_log (id TEXT, created_at TEXT)');
  const abfrage = async (sql, p = []) => {
    const s = d.prepare(sql.replace(/\$\d+/g, '?'));
    return /^\s*SELECT/i.test(sql) ? s.all(...p) : (s.run(...p), []);
  };
  const ids = (t) => d.prepare(`SELECT id FROM ${t} ORDER BY id`).all().map((r) => r.id);
  return { d, abfrage, ids };
}
const fakten = (datenschutz) => async () => ({ datenschutz });

test('abgelaufene Anfragen und Chat-Einträge gehen, frische bleiben', async () => {
  const { d, abfrage, ids } = datenbank();
  d.exec(`INSERT INTO submissions VALUES ('alt','2025-10-19T00:00:00.000Z'), ('neu','2025-10-21T00:00:00.000Z')`);
  d.exec(`INSERT INTO chat_log VALUES ('alt','2026-07-21T00:00:00.000Z'), ('neu','2026-07-23T00:00:00.000Z')`);
  const r = await raeumeAuf({ jetzt, abfrage,
    holeFakten: fakten({ frist_anfragen: '12 Monate', frist_chat: '90 Tage' }) });
  assert.deepEqual(r, { submissions: 1, chat_log: 1 });
  assert.deepEqual(ids('submissions'), ['neu']);
  assert.deepEqual(ids('chat_log'), ['neu']);
});

test('eine nicht verstandene Frist löscht nichts, die andere läuft trotzdem', async () => {
  const { d, abfrage, ids } = datenbank();
  d.exec(`INSERT INTO submissions VALUES ('alt','2020-01-01T00:00:00.000Z')`);
  d.exec(`INSERT INTO chat_log VALUES ('alt','2020-01-01T00:00:00.000Z')`);
  const meldungen = [];
  const vorher = console.error;
  console.error = (m) => meldungen.push(m);
  try {
    const r = await raeumeAuf({ jetzt, abfrage, holeFakten: fakten({ frist_anfragen: 'ein Weilchen', frist_chat: '90 Tage' }) });
    assert.deepEqual(r, { submissions: 0, chat_log: 1 });
  } finally { console.error = vorher; }
  assert.deepEqual(ids('submissions'), ['alt']);
  assert.deepEqual(ids('chat_log'), []);
  assert.match(meldungen.join(), /nicht verstanden/);
});

test('fehlen die Fakten ganz, bleibt alles stehen', async () => {
  const { d, abfrage, ids } = datenbank();
  d.exec(`INSERT INTO submissions VALUES ('alt','2020-01-01T00:00:00.000Z')`);
  const vorher = console.error;
  console.error = () => {};
  try { await raeumeAuf({ jetzt, abfrage, holeFakten: async () => ({}) }); } finally { console.error = vorher; }
  assert.deepEqual(ids('submissions'), ['alt']);
});
