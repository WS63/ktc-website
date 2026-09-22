/**
 * Aus bilder/** werden web-taugliche Fassungen und ein Verzeichnis.
 *
 *   npm run bilder
 *
 * Je Original entstehen drei Größen (400, 800, 1600 px) in data/uploads/,
 * jeweils mit einer Prüfsumme des Inhalts im Dateinamen. Deshalb darf der
 * Browser sie ein Jahr lang behalten, und ein ausgetauschtes Bild bekommt
 * von allein eine neue Adresse.
 *
 * Das Verzeichnis inhalte/bilder.json bildet NAME → Adressen ab. Die Seiten
 * beziehen sich auf den Namen — dadurch ist ein Bildwechsel eine Datei und
 * ein Befehl, keine Suche durch den Quelltext.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname, basename } from 'node:path';

const BEREICHE = ['anlage', 'themen', 'beitraege'];
const GROESSEN = [1600, 800, 400];
const QUALITAET = '50';          // gemessen: bei Fotos kaum sichtbar, spart 40 %

const texte = existsSync('inhalte/bild-texte.json')
  ? JSON.parse(readFileSync('inhalte/bild-texte.json', 'utf8')) : {};

mkdirSync('data/uploads', { recursive: true });

const verzeichnis = {};
const behalten = new Set();
let neu = 0;

for (const bereich of BEREICHE) {
  const ordner = join('bilder', bereich);
  if (!existsSync(ordner)) continue;

  for (const datei of readdirSync(ordner).sort()) {
    if (!/\.(jpe?g|png|heic)$/i.test(datei)) continue;
    const name = basename(datei, extname(datei)).toLowerCase()
      .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c]))
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const eintrag = { bereich, alt: texte[name] || '', groessen: {} };
    for (const breite of GROESSEN) {
      const tmp = `/tmp/bild-${name}-${breite}.jpg`;
      execFileSync('sips', ['-Z', String(breite), '-s', 'format', 'jpeg',
        '-s', 'formatOptions', QUALITAET, join(ordner, datei), '--out', tmp],
        { stdio: 'ignore' });
      const daten = readFileSync(tmp);
      unlinkSync(tmp);
      const hash = createHash('sha256').update(daten).digest('hex').slice(0, 8);
      const ziel = `${name}-${breite}-${hash}.jpg`;
      behalten.add(ziel);
      if (!existsSync(`data/uploads/${ziel}`)) {
        writeFileSync(`data/uploads/${ziel}`, daten);
        neu++;
      }
      eintrag.groessen[breite] = { pfad: `/uploads/${ziel}`, kb: Math.round(daten.length / 1024) };
    }
    // Bequemlichkeit fuer die Seiten
    eintrag.gross = eintrag.groessen[1600].pfad;
    eintrag.mittel = eintrag.groessen[800].pfad;
    eintrag.klein = eintrag.groessen[400].pfad;
    verzeichnis[name] = eintrag;

    const ohneAlt = eintrag.alt ? '' : '   ⚠ kein Alt-Text';
    console.log(`  ${bereich.padEnd(10)} ${name.padEnd(24)} `
      + GROESSEN.map((b) => `${b}:${eintrag.groessen[b].kb}KB`).join(' ') + ohneAlt);
  }
}

writeFileSync('inhalte/bilder.json', JSON.stringify(verzeichnis, null, 1) + '\n');

const ohneAlt = Object.entries(verzeichnis).filter(([, e]) => !e.alt).map(([n]) => n);
console.log(`\n${Object.keys(verzeichnis).length} Bilder, ${neu} neu erzeugt.`);
if (ohneAlt.length) {
  console.log(`\n[WARN] Ohne Alt-Text: ${ohneAlt.join(', ')}`);
  console.log('       Eintragen in inhalte/bild-texte.json — sonst sind die Bilder');
  console.log('       für einen Vorleser nicht vorhanden.');
}

// Verwaiste Fassungen melden, aber nicht loeschen: es koennen Bilder sein,
// die jemand ueber das Cockpit hochgeladen hat.
const uebrig = readdirSync('data/uploads')
  .filter((f) => f.endsWith('.jpg') && !behalten.has(f));
if (uebrig.length) {
  console.log(`\n[Hinweis] ${uebrig.length} Dateien in data/uploads/ stammen nicht aus bilder/.`);
  console.log('          Entweder über das Cockpit hochgeladen oder Reste alter Fassungen.');
}
