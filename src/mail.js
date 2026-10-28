/**
 * Mail: die Benachrichtigung, wenn jemand das Formular absendet.
 *
 * Eine Anfrage wird IMMER zuerst gespeichert (siehe src/routes/api.js); diese Mail ist die Zugabe, damit der Vorstand
 * sie sieht, ohne taeglich ins Cockpit zu schauen. Scheitert der Versand, geht nichts verloren: die Anfrage steht im
 * Cockpit (P6).
 *
 * Versandt wird ueber das Postfach des Vereins (SMTP). Die Zugangsdaten stehen als Umgebungsvariablen in Coolify, nie
 * im Code:
 *   SMTP_HOST      Server des Mailanbieters, z. B. smtp.example.org   (fehlt er: kein Versand)
 *   SMTP_PORT      587 (STARTTLS, Vorgabe) oder 465 (SSL)
 *   SMTP_USER      meist die ganze Adresse, z. B. info@tennisclub-kriftel.de
 *   SMTP_PASSWORD  das Passwort des Postfachs ('SMTP_PASSWORT' gilt als alter Name)
 *   MAIL_VON       Absenderadresse, Vorgabe: SMTP_USER. Muss dem Postfach gehoeren, sonst lehnt der Anbieter ab.
 *   MAIL_AN        Empfaenger der Anfragen, Vorgabe: SMTP_USER
 *
 * Der Baustein der Mail ist eine reine Funktion (baueMail) und der Versand austauschbar, damit die Tests weder Netz
 * noch Zugangsdaten brauchen.
 */
import nodemailer from 'nodemailer';

const EINGABE_FELDER_AUS = new Set(['website', '_seite']);

/** Ein Kopfzeilen-Wert ohne Zeilenumbrueche: sonst koennte ein Besucher weitere Kopfzeilen einschleusen. */
const einzeilig = (t, max = 120) => String(t ?? '').replace(/[\r\n\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

const GUELTIGE_MAIL = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/;

/**
 * Aus den Formulardaten die Mail bauen. Der Betreff nennt die Seite, 'Antworten' geht an den Absender (replyTo),
 * der Text zeigt jedes Feld mit seinem Namen. Das Honigtopf-Feld und die Seitenangabe gehoeren nicht in die Liste.
 */
export function baueMail(id, daten, { von, an, adresse = '' } = {}) {
  const seite = einzeilig(daten._seite) || '/';
  const absender = einzeilig(daten.email, 200);
  const name = einzeilig(daten.name, 80);
  const felder = Object.entries(daten)
    .filter(([k, v]) => !EINGABE_FELDER_AUS.has(k) && String(v ?? '').trim())
    .map(([k, v]) => `${k.toUpperCase()}\n${String(v).trim().slice(0, 5000)}`);
  const text = [
    `Über die Website ist eine Anfrage eingegangen (Seite ${seite}).`,
    '', ...felder.flatMap((f) => [f, '']),
    '-----',
    'Antworten geht direkt an den Absender.',
    `Die Anfrage steht auch im Cockpit unter „Anfragen“${adresse ? ` (${adresse}/admin/)` : ''}. Kennung: ${id}`,
  ].join('\n');
  return {
    from: von, to: an,
    // Kein Name im Betreff aus fremder Hand ohne Begrenzung: einzeilig und kurz.
    subject: `Anfrage über die Website${name ? `: ${name}` : ''}`,
    text,
    ...(GUELTIGE_MAIL.test(absender) ? { replyTo: absender } : {}),
  };
}

/** Die Einstellungen aus der Umgebung; null, wenn kein Server eingetragen ist (dann gibt es keinen Versand). */
export function mailEinstellungen(env = process.env) {
  const host = einzeilig(env.SMTP_HOST);
  if (!host) return null;
  const port = Number(env.SMTP_PORT) || 587;
  const user = einzeilig(env.SMTP_USER);
  const passwort = env.SMTP_PASSWORD || env.SMTP_PASSWORT || '';
  return {
    transport: { host, port, secure: port === 465, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
      ...(user ? { auth: { user, pass: passwort } } : {}) },
    von: einzeilig(env.MAIL_VON) || user,
    an: einzeilig(env.MAIL_AN) || user,
  };
}

/**
 * Benachrichtigen. Gibt zurueck, was passiert ist: 'gesendet', 'aus' (kein Server eingetragen) oder wirft bei einem
 * Fehler. 'senden' ist austauschbar (Tests).
 */
export async function benachrichtigeUeberMail(id, daten, { env = process.env, senden } = {}) {
  const e = mailEinstellungen(env);
  if (!e) return 'aus';
  if (!e.von || !e.an) throw new Error('MAIL_VON und MAIL_AN (oder SMTP_USER) fehlen');
  const mail = baueMail(id, daten, { von: e.von, an: e.an, adresse: einzeilig(env.WEBSITE_ADRESSE) });
  const versand = senden || ((m) => nodemailer.createTransport(e.transport).sendMail(m));
  await versand(mail);
  return 'gesendet';
}
