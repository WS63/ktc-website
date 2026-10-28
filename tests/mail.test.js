import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baueMail, mailEinstellungen, benachrichtigeUeberMail } from '../src/mail.js';

const daten = { name: 'Erika Muster', email: 'erika@example.org', nachricht: 'Habt ihr noch Plätze?', _seite: '/kontakt/', website: '' };

test('Mail: Betreff mit Namen, Antworten geht an den Absender, jedes Feld steht im Text, der Honigtopf nicht', () => {
  const m = baueMail('abc', daten, { von: 'info@v.de', an: 'info@v.de', adresse: 'https://v.de' });
  assert.equal(m.subject, 'Anfrage über die Website: Erika Muster');
  assert.equal(m.replyTo, 'erika@example.org');
  assert.equal(m.from, 'info@v.de');
  assert.match(m.text, /Seite \/kontakt\/\)/);
  assert.match(m.text, /NAME\nErika Muster/);
  assert.match(m.text, /NACHRICHT\nHabt ihr noch Plätze\?/);
  assert.match(m.text, /https:\/\/v\.de\/admin\/\)/);
  assert.doesNotMatch(m.text, /WEBSITE|_SEITE/);
});

test('Mail: ein Besucher kann keine Kopfzeilen einschleusen, und eine ungültige Adresse wird kein replyTo', () => {
  const m = baueMail('x', { ...daten, name: 'Eve\r\nBcc: boese@example.org', email: 'a@b.de\r\nBcc: x@y.de', _seite: '/k/\nBcc: z' },
    { von: 'a@v.de', an: 'a@v.de' });
  assert.doesNotMatch(m.subject, /[\r\n]/);
  assert.equal(m.replyTo, undefined, 'mit Zeilenumbruch ist die Adresse ungültig');
  const ohne = baueMail('x', { ...daten, email: 'keine-adresse' }, { von: 'a@v.de', an: 'a@v.de' });
  assert.equal(ohne.replyTo, undefined);
  assert.doesNotMatch(baueMail('x', { ...daten, _seite: '/k/\nBcc: z' }, { von: 'a', an: 'b' }).text.split('\n')[0], /\n/);
});

test('Mail: ohne SMTP_HOST gibt es keinen Versand; mit Server wird gesendet, Port 465 ist SSL, das Passwort kennt zwei Namen', async () => {
  assert.equal(mailEinstellungen({}), null);
  assert.equal(await benachrichtigeUeberMail('1', daten, { env: {} }), 'aus');
  const e = mailEinstellungen({ SMTP_HOST: 'smtp.example.org', SMTP_PORT: '465', SMTP_USER: 'info@v.de', SMTP_PASSWORT: 'geheim' });
  assert.equal(e.transport.secure, true);
  assert.equal(e.transport.auth.pass, 'geheim');
  assert.equal(e.von, 'info@v.de');
  assert.equal(e.an, 'info@v.de');
  assert.equal(mailEinstellungen({ SMTP_HOST: 'h', SMTP_USER: 'u@v.de' }).transport.port, 587);
  const gesendet = [];
  const r = await benachrichtigeUeberMail('2', daten, {
    env: { SMTP_HOST: 'h', SMTP_USER: 'u@v.de', MAIL_AN: 'vorstand@v.de' }, senden: async (m) => gesendet.push(m) });
  assert.equal(r, 'gesendet');
  assert.equal(gesendet[0].to, 'vorstand@v.de');
  assert.equal(gesendet[0].from, 'u@v.de');
});

test('Mail: ein Fehler des Servers kommt an, damit der Aufrufer ihn loggen kann; ohne Absender gibt es einen klaren Fehler', async () => {
  await assert.rejects(benachrichtigeUeberMail('3', daten, { env: { SMTP_HOST: 'h', SMTP_USER: 'u@v.de' }, senden: async () => { throw new Error('535 abgelehnt'); } }), /535/);
  await assert.rejects(benachrichtigeUeberMail('4', daten, { env: { SMTP_HOST: 'h' }, senden: async () => {} }), /MAIL_VON/);
});

test('Das Formular benachrichtigt nicht im Vordergrund: die Anfrage steht, bevor die Mail geht, und die Antwort wartet nicht', async () => {
  const { readFileSync } = await import('node:fs');
  const api = readFileSync('src/routes/api.js', 'utf8');
  const form = api.slice(api.indexOf("router.post('/form/:name'"), api.indexOf('// ── Der Assistent'));
  assert.ok(form.indexOf('INSERT INTO submissions') < form.indexOf('benachrichtige(id, daten)'), 'erst speichern, dann benachrichtigen');
  assert.doesNotMatch(form, /await benachrichtige/);
  assert.match(form, /benachrichtige\(id, daten\)\s*\.catch/);
});
