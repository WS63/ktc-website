import 'dotenv/config';
import express from 'express';
import { runMigrations } from './src/db.js';
import { aktualisiere } from './src/config.js';
import api from './src/routes/api.js';
import oeffentlich from './src/routes/public.js';
import { zugangsschutz } from './src/zugang.js';

/**
 * Beim Start die Datenbank vorbereiten.
 *
 * Schlaegt das fehl, ist die haeufigste Ursache eine falsche DATABASE_URL —
 * und die Meldung von pg dazu ist unbrauchbar ("getaddrinfo EAI_AGAIN base").
 * Deshalb hier eine, die sagt, wo man nachsehen muss.
 */
try {
  await runMigrations();
  await aktualisiere();
} catch (err) {
  const ziel = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/\/\/[^@]*@/, '//***@')
    : '(nicht gesetzt — es wird SQLite benutzt)';
  console.error('\n[Motor] Die Datenbank ist nicht erreichbar. Der Server startet nicht.\n');
  console.error(`  DATABASE_URL: ${ziel}`);
  console.error(`  Fehler:       ${err.code || ''} ${err.message}\n`);
  if (err.code === 'EAI_AGAIN' || err.code === 'ENOTFOUND') {
    console.error(`  Der Rechnername "${err.hostname || '?'}" ist unbekannt.`);
    console.error('  Bei Coolify: die INTERNE Postgres-Adresse nehmen. Der Teil zwischen');
    console.error('  @ und :5432 ist eine lange zufällige Zeichenfolge, kein kurzes Wort.\n');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('  Der Rechner antwortet, aber nicht auf diesem Port. Läuft die Datenbank?\n');
  } else if (err.code === '28P01' || /password/i.test(err.message)) {
    console.error('  Das Passwort in der Adresse stimmt nicht.\n');
  }
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Name und Passwort vor der ganzen Website — solange die Seite nicht oeffentlich
// sein soll. Steht NACH /health (Coolify fragt dort ohne Zugangsdaten) und VOR
// allem anderen: Bilder, Cockpit, Schnittstelle, Seiten. Ohne die beiden
// Umgebungsvariablen ist der Schutz aus und lokal merkt man nichts davon.
const schutz = zugangsschutz({ name: process.env.USER_NAME, passwort: process.env.USER_PASSWORD });
if (schutz) {
  app.use(schutz);
  console.log('[Motor] Zugangsschutz AN — die Website verlangt Name und Passwort.');
} else if (process.env.NODE_ENV === 'production') {
  console.warn('[Motor] [WARN] Zugangsschutz AUS — die Website ist für jeden offen. '
    + 'Gewollt? Sonst USER_NAME und USER_PASSWORD setzen.');
}

// Hochgeladene Bilder. Der Hash im Dateinamen macht sie unveraenderlich.
app.use('/uploads', express.static('data/uploads', { maxAge: '365d', immutable: true }));

// Das Logo als Datei, falls jemand es verlinken will.
app.use('/assets', express.static('assets', { maxAge: '7d' }));

// Bilder, die zur Website gehoeren. Kommen mit dem Deploy, nicht vom Volume.
// Der Inhalts-Hash im Dateinamen macht sie unveraenderlich.
app.use('/bilder', express.static('assets/bilder', { maxAge: '365d', immutable: true }));

app.use('/api', api);

// Das Cockpit. Die Oberflaeche selbst ist KEIN Geheimnis und wird immer
// ausgeliefert — geschuetzt sind die Daten dahinter, unter /api/.
//
// Falle, hier gebaut und im Browser gefunden: wer auch app.js hinter die
// Anmeldung stellt, sperrt das Cockpit aus sich selbst aus. Ohne app.js gibt
// es kein Anmeldeformular, das funktioniert — und der Fehler sieht aus, als
// waere das Passwort falsch.
//
// Und: wird das Cockpit gecacht, sieht der Mensch nach dem naechsten Bau die
// alte Oberflaeche, waehrend die Versionsnummer schon die neue zeigt.
app.use('/admin', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, express.static('admin', { etag: false, lastModified: false }));

app.use(oeffentlich);

app.use((_req, res) => res.status(404).type('html').send(
  '<!doctype html><meta charset="utf-8"><title>Nicht gefunden</title>'
  + '<style>body{font:17px/1.7 system-ui;margin:0;display:grid;place-items:center;min-height:100vh}'
  + 'a{color:#0050ff}</style><div><h1>Diese Seite gibt es nicht.</h1>'
  + '<p><a href="/">Zurück zur Startseite</a></p></div>'));

app.use((err, _req, res, _next) => {
  console.error('[Motor] [FEHLER]', err);
  res.status(500).type('html').send('<h1>Da ist etwas schiefgegangen</h1>');
});

const port = process.env.PORT || 3000;
const server = app.listen(port,
  () => console.log(`[Motor] läuft auf http://localhost:${port}`));

/**
 * Sauber herunterfahren. Coolify schickt SIGTERM und wartet ein paar Sekunden.
 * In der Zeit: keine neuen Verbindungen mehr annehmen, laufende zu Ende
 * bringen, und die gesammelten Aufrufe wegschreiben.
 */
for (const zeichen of ['SIGTERM', 'SIGINT']) {
  process.on(zeichen, async () => {
    console.log(`[Motor] ${zeichen} — fahre herunter.`);
    server.close();
    try {
      const { gleichSchreiben } = await import('./src/zaehler.js');
      await gleichSchreiben();
    } catch { /* nicht der Rede wert beim Beenden */ }
    setTimeout(() => process.exit(0), 300).unref();
  });
}
