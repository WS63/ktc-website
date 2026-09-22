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

const BEREICHE = ['anlage', 'themen', 'beitraege', 'logos'];
const GROESSEN = [1600, 800, 400];

// Logos sind keine Fotos: eine Groesse reicht, und sie werden nie beschnitten.
const LOGO_GROESSEN = [600];

/** Breite und Hoehe eines Bildes, ohne es zu laden. */
function masse(pfad) {
  const raus = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', pfad],
    { encoding: 'utf8' });
  const b = Number((raus.match(/pixelWidth:\s*(\d+)/) || [])[1]);
  const h = Number((raus.match(/pixelHeight:\s*(\d+)/) || [])[1]);
  return { breite: b || 0, hoehe: h || 0 };
}
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

    // Quellen gehoeren ins Repository — deshalb duerfen sie nicht riesig sein.
    // Git vergisst nichts: jede Fassung bleibt fuer immer in der Geschichte.
    // 2400 Pixel reichen fuer die groesste Ausgabe (1600) mit Reserve.
    const quellGroesse = readFileSync(join(ordner, datei)).length;
    if (quellGroesse > 1_000_000) {
      console.log(`  [WARN] ${datei} ist ${Math.round(quellGroesse / 1024)} KB. `
        + 'Verkleinern auf 2400 px:');
      console.log(`         sips -Z 2400 -s formatOptions 82 "${join(ordner, datei)}" --out "${join(ordner, datei)}"`);
    }

    const { breite: qb, hoehe: qh } = masse(join(ordner, datei));
    const verhaeltnis = qh ? qb / qh : 0;

    /**
     * Niemals hochrechnen.
     *
     * Ein Logo mit 210 Pixeln wurde vorher auf 1600 aufgeblasen: unscharf UND
     * groesser als das Original. sips rechnet ohne Rueckfrage hoch.
     */
    const ziele = (bereich === 'logos' ? LOGO_GROESSEN : GROESSEN)
      .filter((b) => b <= qb);
    if (!ziele.length) ziele.push(qb);          // kleiner als jede Vorgabe

    if (bereich !== 'logos' && qb < 1600) {
      console.log(`  [WARN] ${name} ist nur ${qb} px breit. Auf grossen Schirmen unscharf.`);
    }
    // 3:2 ist das Mass der Karten, 16:9 bis 2:1 taugt fuer Aufmacher.
    if (bereich !== 'logos' && verhaeltnis > 2.6) {
      console.log(`  [WARN] ${name} ist sehr breit (${verhaeltnis.toFixed(1)}:1). `
        + 'In Karten wird oben und unten viel abgeschnitten.');
    }
    if (bereich !== 'logos' && verhaeltnis < 1.2) {
      console.log(`  [WARN] ${name} ist hochformatig (${verhaeltnis.toFixed(2)}:1). `
        + 'Für Aufmacher und Karten ungeeignet.');
    }

    const eintrag = { bereich, alt: texte[name] || '', breite: qb, hoehe: qh, groessen: {} };
    for (const breite of ziele) {
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
    // Bequemlichkeit fuer die Seiten — faellt auf die naechstkleinere zurueck,
    // wenn eine Groesse fehlt, weil die Quelle zu klein war.
    const vorhanden = ziele.slice().sort((a, b) => b - a);
    const nimm = (wunsch) => {
      const b = vorhanden.find((x) => x <= wunsch) ?? vorhanden.at(-1);
      return eintrag.groessen[b].pfad;
    };
    eintrag.gross = nimm(1600);
    eintrag.mittel = nimm(800);
    eintrag.klein = nimm(400);
    verzeichnis[name] = eintrag;

    const ohneAlt = eintrag.alt ? '' : '   ⚠ kein Alt-Text';
    console.log(`  ${bereich.padEnd(10)} ${name.padEnd(24)} `
      + ziele.map((b) => `${b}:${eintrag.groessen[b].kb}KB`).join(' ') + ohneAlt);
  }
}

writeFileSync('inhalte/bilder.json', JSON.stringify(verzeichnis, null, 1) + '\n');

/**
 * Ein Kontaktbogen zum Durchsehen, erreichbar unter /admin/kontaktbogen.html.
 * Laeuft bei jedem Bau mit, damit er nie veraltet.
 */
const nachBereich = {};
for (const [name, e] of Object.entries(verzeichnis)) (nachBereich[e.bereich] ??= []).push({ name, ...e });

const bogen = `<!doctype html><meta charset="utf-8"><title>Bilder</title><style>
body{margin:0;font:14px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;padding:18px;color:#1e1e18}
h1{font-size:20px;font-weight:500;margin:0 0 4px}
p.u{color:#777;margin:0 0 18px;font-size:13px}
h2{font-size:12px;font-weight:500;margin:22px 0 8px;color:#666;text-transform:uppercase;letter-spacing:.09em}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
figure{margin:0}
img{width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:5px;background:#f0f0f0;border:1px solid #e0e0e0}
figcaption{font-size:12px;margin-top:4px;line-height:1.35}
b{font-weight:500}.m{color:#999}.w{color:#c0392b}.a{color:#777;display:block;margin-top:2px}
</style>
<h1>Bilder</h1>
<p class="u">Quellen liegen in <code>bilder/</code>. Austauschen: Datei ersetzen, dann
<code>npm run bilder &amp;&amp; npm run seed</code>. Nie in <code>data/uploads/</code> arbeiten.</p>
` + ['anlage', 'themen', 'beitraege', 'logos'].map((b) => {
  const liste = nachBereich[b] || [];
  if (!liste.length) return '';
  return `<h2>${b} · ${liste.length}</h2><div class="g">` + liste.map((x) => {
    const v = x.hoehe ? x.breite / x.hoehe : 0;
    const marke = x.breite < 1600 && b !== 'logos' ? `<span class="w">nur ${x.breite} px</span>`
      : v > 2.6 ? `<span class="w">${v.toFixed(1)}:1 sehr breit</span>`
      : `<span class="m">${x.breite}×${x.hoehe} · ${v.toFixed(2)}:1</span>`;
    const alt = x.alt ? `<span class="a">${x.alt.replace(/[<>&]/g, '')}</span>`
      : '<span class="a w">kein Alt-Text</span>';
    return `<figure><img src="${x.mittel}" alt="${(x.alt || '').replace(/"/g, '')}">`
      + `<figcaption><b>${x.name}</b><br>${marke}${alt}</figcaption></figure>`;
  }).join('') + '</div>';
}).join('');

writeFileSync('admin/kontaktbogen.html', bogen + '\n');

const ohneAlt = Object.entries(verzeichnis).filter(([, e]) => !e.alt).map(([n]) => n);
console.log(`\n${Object.keys(verzeichnis).length} Bilder, ${neu} neu erzeugt.`);
if (ohneAlt.length) {
  console.log(`\n[WARN] Ohne Alt-Text: ${ohneAlt.join(', ')}`);
  console.log('       Eintragen in inhalte/bild-texte.json — sonst sind die Bilder');
  console.log('       für einen Vorleser nicht vorhanden.');
}

/**
 * Aufraeumen, aber nur die eigenen Reste.
 *
 * Eine alte Fassung erkennt man am Muster <name>-<breite>-<hash>.jpg mit einem
 * Namen, den dieser Lauf kennt. Was anders heisst, hat jemand ueber das
 * Cockpit hochgeladen — das bleibt liegen.
 */
const eigene = new RegExp(`^(${Object.keys(verzeichnis).join('|')})-(\\d+)-[0-9a-f]{8}\\.jpg$`);
let entfernt = 0;
const fremd = [];
for (const f of readdirSync('data/uploads')) {
  if (!f.endsWith('.jpg') || behalten.has(f)) continue;
  if (Object.keys(verzeichnis).length && eigene.test(f)) {
    unlinkSync(`data/uploads/${f}`);
    entfernt++;
  } else fremd.push(f);
}
if (entfernt) console.log(`${entfernt} überholte Fassungen entfernt.`);
if (fremd.length) {
  console.log(`\n[Hinweis] ${fremd.length} Dateien stammen nicht aus bilder/ —`);
  console.log('          vermutlich über das Cockpit hochgeladen. Bleiben liegen.');
}
