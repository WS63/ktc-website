import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kuenftige } from '../src/routes/public.js';

/**
 * JJJJ-MM-TT, n Tage von heute, in ORTSZEIT.
 *
 * Nicht ueber toISOString(): das rechnet nach UTC um. Westlich von Greenwich
 * waere 'heute 00:00' dort schon gestern — der erste Lauf dieses Tests ist
 * genau daran gescheitert, bei MESZ um 13:35 Uhr. Der Produktionscode liest
 * 'JJJJ-MM-TTT00:00:00' und meint damit Ortszeit; der Test muss dasselbe tun.
 */
const tage = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  const z = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

test('abgelaufene Termine verschwinden, heutige bleiben', () => {
  const raus = kuenftige([
    { datum: tage(-1), titel: 'gestern' },
    { datum: tage(0),  titel: 'heute' },
    { datum: tage(5),  titel: 'bald' },
  ]);
  assert.deepEqual(raus.map((t) => t.titel), ['heute', 'bald']);
});

test('Termine kommen in zeitlicher Reihenfolge, egal wie sie eingetragen wurden', () => {
  const raus = kuenftige([
    { datum: tage(30), titel: 'spaet' },
    { datum: tage(2),  titel: 'frueh' },
    { datum: tage(9),  titel: 'mittig' },
  ]);
  assert.deepEqual(raus.map((t) => t.titel), ['frueh', 'mittig', 'spaet']);
});

test('ein Termin mit kaputtem Datum verschwindet NICHT stumm', () => {
  // Lieber ein Eintrag zu viel als einer, der wegen eines Tippfehlers
  // unsichtbar wird und den niemand vermisst.
  const raus = kuenftige([{ datum: '17.04.2027', titel: 'falsches Format' }]);
  assert.equal(raus.length, 1);
});

test('der Baustein bekommt das Datum fertig formatiert', () => {
  // renderPage() soll sich nicht um Gebietsschemata kuemmern muessen.
  const [t] = kuenftige([{ datum: tage(3), titel: 'x' }]);
  assert.match(t.tag, /^\d{1,2}\. \p{Lu}\p{Ll}+$/u);
});
