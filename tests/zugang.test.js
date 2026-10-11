import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zugangsschutz, zugangsdaten } from '../src/zugang.js';

const basic = (n, p) => 'Basic ' + Buffer.from(`${n}:${p}`).toString('base64');

/** Eine Anfrage durch die Middleware schicken und festhalten, was passiert. */
function lauf(mw, { pfad = '/', auth } = {}) {
  return new Promise((ok) => {
    const res = { kopf: {}, status(c) { this.code = c; return this; },
      set(k, v) { this.kopf[k] = v; return this; }, type() { return this; },
      send(t) { ok({ weiter: false, code: this.code, kopf: this.kopf, text: t }); } };
    mw({ path: pfad, headers: { authorization: auth } }, res, () => ok({ weiter: true }));
  });
}

test('ohne Name oder Passwort ist der Schutz aus', () => {
  assert.equal(zugangsschutz({}), null);
  assert.equal(zugangsschutz({ name: 'a' }), null);
  assert.equal(zugangsschutz({ passwort: 'b' }), null);
});

test('mit richtigen Zugangsdaten geht es weiter', async () => {
  const mw = zugangsschutz({ name: 'verein', passwort: 'geheim' });
  assert.equal((await lauf(mw, { auth: basic('verein', 'geheim') })).weiter, true);
});

test('ohne oder mit falschen Zugangsdaten: 401 und die Aufforderung zur Anmeldung', async () => {
  const mw = zugangsschutz({ name: 'verein', passwort: 'geheim' });
  for (const auth of [undefined, basic('verein', 'falsch'), basic('falsch', 'geheim'), 'Bearer x', 'Basic !!!']) {
    const r = await lauf(mw, { auth });
    assert.equal(r.weiter, false);
    assert.equal(r.code, 401);
    assert.match(r.kopf['WWW-Authenticate'], /^Basic realm=/);
    assert.equal(r.kopf['Cache-Control'], 'no-store');
  }
});

test('/health bleibt offen, damit Coolify den Server pruefen kann', async () => {
  const mw = zugangsschutz({ name: 'verein', passwort: 'geheim' });
  assert.equal((await lauf(mw, { pfad: '/health' })).weiter, true);
  assert.equal((await lauf(mw, { pfad: '/health/x' })).weiter, false);
});

test('das Passwort darf Doppelpunkte enthalten, und der Name nicht', () => {
  assert.deepEqual(zugangsdaten(basic('verein', 'a:b:c')), { name: 'verein', passwort: 'a:b:c' });
  assert.equal(zugangsdaten('Basic ' + Buffer.from('ohnedoppelpunkt').toString('base64')), null);
});

test('Gross- und Kleinschreibung zaehlt', async () => {
  const mw = zugangsschutz({ name: 'Verein', passwort: 'Geheim' });
  assert.equal((await lauf(mw, { auth: basic('verein', 'geheim') })).weiter, false);
});
