/**
 * Schickt eine Testmail ueber die Einstellungen aus der Umgebung (SMTP_*, MAIL_*), ohne dass jemand das Formular
 * ausfuellen muss. Aufruf: npm run mailtest   (in Coolify: im Terminal des Containers)
 * Es steht nichts Geheimes in der Ausgabe; bei einem Fehler nennt sie die Meldung des Servers.
 */
import { mailEinstellungen, benachrichtigeUeberMail } from '../src/mail.js';

const e = mailEinstellungen();
if (!e) {
  console.error('SMTP_HOST ist nicht gesetzt. Ohne Server gibt es keinen Versand. Siehe .env.beispiel.');
  process.exit(1);
}
console.log(`Server ${e.transport.host}:${e.transport.port} (${e.transport.secure ? 'SSL' : 'STARTTLS'}), von ${e.von || '(leer)'} an ${e.an || '(leer)'}`);
try {
  const ergebnis = await benachrichtigeUeberMail('test-' + Date.now(), {
    name: 'Testmail', email: e.von || '', nachricht: 'Das ist eine Testmail der Website. Wenn sie ankommt, funktioniert der Versand.',
    _seite: '/mailtest',
  });
  console.log(ergebnis === 'gesendet' ? 'Gesendet. Bitte im Postfach nachsehen (auch im Spam-Ordner).' : 'Nicht gesendet.');
} catch (err) {
  console.error(`Fehler: ${err.message}`);
  process.exit(1);
}
