/**
 * Setzt das Cockpit-Passwort in .env.
 *
 * Die Eingabe wird nicht angezeigt und landet in keinem Verlauf — weder in
 * der Shell-History noch in einem Chat. Das Passwort steht danach
 * ausschliesslich in .env, und die steht in .gitignore.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import readline from 'node:readline';

function verdecktFragen(frage) {
  return new Promise((fertig) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const schreiben = rl._writeToOutput.bind(rl);
    rl._writeToOutput = (s) => {
      if (rl.stdoutMuted) rl.output.write('\x1B[2K\x1B[200D' + rl.query + '•'.repeat(rl.line.length));
      else schreiben(s);
    };
    rl.query = frage;
    rl.question(frage, (antwort) => {
      rl.stdoutMuted = false;
      rl.output.write('\n');
      rl.close();
      fertig(antwort);
    });
    rl.stdoutMuted = true;
  });
}

const eins = await verdecktFragen('Neues Cockpit-Passwort: ');
if (eins.length < 10) {
  console.error('\nZu kurz. Mindestens zehn Zeichen — das Cockpit steht später offen im Netz.');
  process.exit(1);
}
const zwei = await verdecktFragen('Zur Sicherheit noch einmal: ');
if (eins !== zwei) {
  console.error('\nDie beiden stimmen nicht überein. Nichts geändert.');
  process.exit(1);
}

const alt = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const zeilen = alt.split('\n').filter((z) => z.trim() && !z.startsWith('ADMIN_PASSWORT='));

// Das Sitzungs-Geheimnis bleibt, wenn es schon da ist — sonst werden alle abgemeldet.
if (!zeilen.some((z) => z.startsWith('SESSION_GEHEIMNIS='))) {
  zeilen.push(`SESSION_GEHEIMNIS=${randomBytes(32).toString('hex')}`);
}
zeilen.unshift(`ADMIN_PASSWORT=${eins}`);
writeFileSync('.env', zeilen.join('\n') + '\n', { mode: 0o600 });

console.log('\nGesetzt. Der Server startet gleich von allein neu (npm run dev).');
console.log('Falls nicht: einmal Strg+C und npm run dev.');
