import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { renderPage } from '../renderer.js';
import { loadSite, loadArten, loadAssistent, loadFacts } from '../config.js';
import { mannschaften, saison } from '../mannschaften.js';
import { kalenderText, vereinsEreignisse, mannschaftsEreignisse, heimspielEreignisse, slugVon,
  mannschaftenImPlan } from '../kalender-abo.js';
import { readFileSync, existsSync } from 'node:fs';
import { holen, legen, bisMitternacht } from '../cache.js';
import { zaehle } from '../zaehler.js';
import { kalenderTermine, kuenftige, vergangene, spielplanHinweis, vereinsTermine, echterSpielplan } from '../termin-quelle.js';
import { suchtext, begriffe, beitraegeFiltern, termineFiltern } from '../suche.js';
import { spielstand, infoStand } from '../spielstand.js';
import { ansicht, neuesteErgebnisse } from '../ergebnisse.js';
import { berlinWann, berlinTag, tagPlus } from '../zeit.js';

const router = Router();

// Wie viele Beitraege eine Uebersichtsseite zeigt. Vorher stand hier eine
// harte Grenze von 100 ohne Blaetterwerk: bei ueber 50 Beitraegen im Jahr
// waere der aelteste nach zwei Jahren unerreichbar gewesen — die Seite
// existiert, aber kein Link fuehrt mehr hin.
const JE_SEITE = 10;
const GRENZE_START = 6;

// ── Umleitungen: vor allen Seitenrouten, nach den statischen Dateien ──
router.use(async (req, res, next) => {
  try {
    const pfad = req.path.endsWith('/') ? req.path : `${req.path}/`;
    const ziel = await queryOne(
      'SELECT to_path, code FROM redirects WHERE from_path = $1', [pfad]);
    if (!ziel) return next();

    // Eine ECHTE Seite schlaegt eine Umleitung.
    //
    // Sonst ueberschattet ein alter Eintrag eine neu angelegte Seite: sie ist
    // unerreichbar, obwohl sie im Cockpit veroeffentlicht dasteht — und niemand
    // kommt darauf, in der Umleitungsliste nachzusehen.
    const slug = pfad.replace(/^\/|\/$/g, '') || 'start';
    if (await seiteFinden(slug)) return next();

    res.redirect(ziel.code || 301, ziel.to_path);
  } catch (err) { next(err); }
});

// ── robots.txt und sitemap.xml: laufen mit, blockieren nichts (P6) ──
router.get('/robots.txt', (_req, res) => {
  const site = loadSite();
  // Eine Testdomain gehoert nicht in den Suchindex. Sonst konkurriert sie
  // spaeter mit der echten Seite um dieselben Inhalte, und Google entscheidet,
  // welche es zeigt — nicht du.
  if (site.suchmaschinen === false) {
    return res.type('text/plain').send('User-agent: *\nDisallow: /\n');
  }
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);
});

router.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const site = loadSite();
    // Keine Sitemap fuer eine Seite, die nicht gefunden werden soll.
    if (site.suchmaschinen === false) return res.status(404).type('text/plain').send('');
    // Nur Veroeffentlichtes. Entwuerfe und Pflichtseiten gehoeren nicht hinein.
    const zeilen = await query(
      `SELECT slug, updated_at, page_type FROM pages
        WHERE status = 'published' ORDER BY updated_at DESC`);
    const url = (z) => {
      const pfad = z.page_type === 'beitrag' ? `/aktuelles/${z.slug}/`
                 : z.slug === 'start' ? '/' : `/${z.slug}/`;
      return `  <url><loc>${site.domain}${pfad}</loc>`
           + `<lastmod>${String(z.updated_at).slice(0, 10)}</lastmod></url>`;
    };
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n`
      + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
      + zeilen.filter((z) => !['impressum', 'datenschutz'].includes(z.slug)).map(url).join('\n')
      + `\n</urlset>\n`);
  } catch (err) { next(err); }
});

// ── Kalender-Abo (src/kalender-abo.js) ──────────────────────────────────
//
// Die Feeds nehmen IMMER die echten Spieltermine (echterSpielplan), nie die im
// Demo-Modus verschobenen: was einmal in einem fremden Kalender steht, holt
// niemand mehr zurueck.
//
// Mannschaften: Erwachsene behalten eine Adresse ueber die Jahre (dieselben Leute,
// das Abo laeuft weiter), die Jugend bekommt eine je Saison (/kalender/mannschaft/
// 2026/junioren-u15.ics) — die Teams wechseln jedes Jahr, ein altes Abo bleibt auf
// seiner Saison stehen. Eine aufgeloeste Mannschaft liefert weiter ihre alten Spiele
// statt 404: sonst zeigt der Kalender des Abonnenten einen Fehler.
const ABO_FEST = { club: '/kalender/club.ics', heimspiele: '/kalender/heimspiele.ics' };
const istJugend = (slug) => (saison.jugend || []).some((t) => slugVon(t.name) === slug);

/** Der Name zu einer Abo-Adresse: aus der laufenden Saison, sonst aus dem Spielstand. */
function aboName(slug) {
  const jetzt = mannschaften.find((t) => slugVon(t.name) === slug);
  if (jetzt) return jetzt.name;
  return mannschaftenImPlan(echterSpielplan()).find((n) => slugVon(n) === slug) || null;
}

/** Wohin /kalender/abo/<feed>/ fuehrt — die Jugend in die laufende Saison. */
function aboPfad(feed) {
  if (ABO_FEST[feed]) return ABO_FEST[feed];
  if (!aboName(feed)) return null;
  return istJugend(feed) && saison.saison
    ? `/kalender/mannschaft/${saison.saison}/${feed}.ics` : `/kalender/mannschaft/${feed}.ics`;
}

function aboText(feed, basis, nurSaison = '') {
  const f = loadFacts();
  // Fehlt die Dauer in den Fakten, haben Spiele nur einen Anfang — nichts wird erfunden (P2).
  const stunden = Number(f.kalender?.dauer_wettkampf_stunden) > 0 ? Number(f.kalender.dauer_wettkampf_stunden) : null;
  const v = f.verein || {};
  const anschrift = v.strasse ? `${v.name}, ${v.strasse}, ${v.plz} ${v.ort}` : '';
  if (feed === 'club') {
    return kalenderText({ name: 'KTC · Clubleben', beschreibung: 'Termine des Krifteler Tennis-Clubs',
      ereignisse: vereinsEreignisse(vereinsTermine().filter((t) => !t.beispiel), { basis }) });
  }
  if (feed === 'heimspiele') {
    return kalenderText({ name: 'KTC · Heimspiele', beschreibung: 'Medenspiele auf der Anlage des Krifteler Tennis-Clubs',
      ereignisse: heimspielEreignisse(echterSpielplan(), { stunden, anschrift }) });
  }
  const name = aboName(feed);
  if (!name) return null;
  const ereignisse = mannschaftsEreignisse(echterSpielplan(), name, { stunden, anschrift, saison: nurSaison });
  // Eine Saison, in der die Mannschaft nie gespielt hat, ist eine falsche Adresse.
  if (nurSaison && !ereignisse.length) return null;
  const gemeldet = mannschaften.some((t) => t.name === name);
  return kalenderText({
    name: `KTC · ${name}${nurSaison ? ` · ${nurSaison}` : ''}`,
    beschreibung: `Medenspiele der Mannschaft ${name}${nurSaison ? ` in der Saison ${nurSaison}` : ''}.`
      + (gemeldet || nurSaison ? '' : ' In der laufenden Saison ist sie nicht gemeldet. Hier stehen ihre bisherigen Spiele.'),
    ereignisse });
}

function aboSenden(req, res, next, feed, nurSaison = '') {
  const text = aboText(feed, `${req.protocol}://${req.get('host')}`, nurSaison);
  if (!text) return next();
  // Jedes Abholen zaehlt: so steht im Cockpit, welche Abos benutzt werden.
  zaehle(req.path);
  res.type('text/calendar; charset=utf-8')
    .set('Cache-Control', 'max-age=3600')
    .set('Content-Disposition', `inline; filename="ktc-${feed}${nurSaison ? `-${nurSaison}` : ''}.ics"`)
    .send(text);
}

router.get('/kalender/mannschaft/:saison/:datei', (req, res, next) => {
  const m = /^([a-z0-9-]+)\.ics$/.exec(req.params.datei);
  return m && /^\d{4}$/.test(req.params.saison) ? aboSenden(req, res, next, m[1], req.params.saison) : next();
});

router.get('/kalender/:datei', (req, res, next) => {
  const m = /^(club|heimspiele)\.ics$/.exec(req.params.datei);
  return m ? aboSenden(req, res, next, m[1]) : next();
});

router.get('/kalender/mannschaft/:datei', (req, res, next) => {
  const m = /^([a-z0-9-]+)\.ics$/.exec(req.params.datei);
  return m ? aboSenden(req, res, next, m[1]) : next();
});

/**
 * Der Weg zum Abonnieren: /kalender/abo/<feed>/ leitet auf webcal:// weiter, mit
 * ?google=1 zu Google Kalender. Dadurch stehen auf den Seiten nur RELATIVE Links —
 * beim Umzug auf die echte Domain muss nichts neu geseedet werden, und ziel()
 * braucht keine Ausnahme fuer webcal:. Die Adresse kommt aus der Anfrage selbst.
 */
function aboWeiter(req, res, next, feed, google) {
  const pfad = aboPfad(String(feed || ''));
  if (!pfad) return next();
  const webcal = `webcal://${req.get('host')}${pfad}`;
  if (google) {
    return res.redirect(302, `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`);
  }
  res.redirect(302, webcal);
}

// Das Formular "Deine Mannschaft": /kalender/abo/?mannschaft=herren-40&weg=google
router.get('/kalender/abo', (req, res, next) => {
  if (!req.query.mannschaft) return res.redirect(302, '/kalender/#abo');
  return aboWeiter(req, res, next, req.query.mannschaft, req.query.weg === 'google');
});

router.get('/kalender/abo/:feed', (req, res, next) =>
  aboWeiter(req, res, next, req.params.feed, Boolean(req.query.google)));

// Die Bilder, wie 'npm run bilder' sie erzeugt hat (Name → Adressen). Einmal beim Start gelesen.
const bilderVerzeichnis = existsSync('inhalte/bilder.json')
  ? JSON.parse(readFileSync('inhalte/bilder.json', 'utf8')) : {};

/**
 * Zu jeder erzeugten Bildadresse die ganze Reihe ihrer Groessen als srcset:
 * '/bilder/x-1600-….jpg' → '/bilder/x-400-….jpg 400w, … 1600w'.
 *
 * Damit laedt ein Telefon im Aufmacher die 400er- oder 800er-Fassung statt
 * acht Bilder in 1600 Pixeln. Die Seite selbst nennt weiter nur eine Adresse —
 * die Reihe kommt hier dazu, beim Ausliefern, und braucht kein Feld im Cockpit.
 * Im Cockpit hochgeladene Bilder haben keine Reihe und bleiben, wie sie sind (P6).
 */
const SRCSETS = Object.fromEntries(Object.values(bilderVerzeichnis).flatMap((b) => {
  const reihe = Object.entries(b.groessen || {})
    .sort(([a], [z]) => Number(a) - Number(z))
    .map(([breite, g]) => `${g.pfad} ${breite}w`).join(', ');
  return reihe ? Object.values(b.groessen).map((g) => [g.pfad, reihe]) : [];
}));

/**
 * Der Aufhaenger eines Beitrags in Listen: der erste Satz, sonst am Wortende gekuerzt. Die Beschreibung
 * ist auf 160 Zeichen gekuerzt (fuer Google); in der Liste fing sie mitten im Wort an zu fehlen.
 */
export function aufhaenger(text, grenze = 150) {
  const t = String(text || '').replace(/\s+/g, ' ').replace(/…$/, '').trim();
  if (!t) return '';
  // Satzende ist ein Punkt nach einem Wort, nicht nach einer Ordnungszahl ('24. Oktober') oder einer Abkuerzung ('ca.').
  let satz = '';
  for (const m of t.matchAll(/[.!?](?=\s|$)/g)) {
    const vor = t.slice(0, m.index);
    if (/\d$/.test(vor) || /(^|\s)(ca|bzw|ggf|usw|nr|evtl|inkl|z\. ?b|d\. ?h|u\. ?a|vgl|max|min)$/i.test(vor)) continue;
    satz = t.slice(0, m.index + 1);
    break;
  }
  if (satz && satz.length <= grenze) return satz;
  if (t.length <= grenze) return t;
  const schnitt = t.slice(0, grenze);
  const wortende = schnitt.lastIndexOf(' ');
  return schnitt.slice(0, wortende > 0 ? wortende : grenze).replace(/[\s,;:–-]+$/, '') + '…';
}

/** Ein Termin, der auf einen gezeigten Beitrag verweist ('mehr'), steht nicht noch einmal daneben. */
export function ohneBeitragsDoppel(termine, eintraege) {
  const gezeigt = new Set((eintraege || []).map((e) => e.href));
  return (termine || []).filter((t) => !(t.mehr && gezeigt.has(t.mehr)));
}

/**
 * Menue, Fusszeile und Uebersichten sind Abfragen, keine gepflegten Listen (P3).
 * Neue Seite im Menue → sie steht drin, ohne dass jemand einen Baustein anfasst.
 */
async function dynamischeDaten(inhalt, page) {
  const typen = new Set((inhalt.blocks || []).map((b) => b.type));
  const daten = {};

  if (typen.has('nav') || typen.has('footer')) {
    const zeilen = await query(
      'SELECT id, parent_id, ort, label, href FROM navigation WHERE visible = 1 ORDER BY sort');
    if (zeilen.length) {
      const bauen = (ort) => zeilen.filter((z) => z.ort === ort && !z.parent_id)
        .map((z) => ({ ...z, kinder: zeilen.filter((k) => k.parent_id === z.id) }));
      const kopf = bauen('kopf');
      const fuss = bauen('fuss');
      // Leer lassen heisst: der Baustein behaelt, was in seinen Daten steht.
      // So bleibt die Seite bedienbar, auch wenn die Navigation noch nicht gepflegt ist.
      if (kopf.length) daten.nav = { baum: kopf };
      if (fuss.length) daten.footer = { baum: fuss };
    }
  }

  if (typen.has('hero')) {
    // Der naechste Vereinstermin fuer das Thema 'Dabei sein' im Aufmacher; ohne Termin faellt die Zahl weg.
    const naechster = kuenftige(vereinsTermine())[0];
    daten.hero = { srcsets: SRCSETS, naechsterTermin: naechster ? { tag: naechster.tag, titel: naechster.titel } : null };
  }
  if (typen.has('kapitel')) daten.kapitel = { srcsets: SRCSETS };

  // Lisa kommt aus der Konfiguration, nicht aus dem, was beim Seeden in der Seite gelandet ist:
  // sonst zeigten Seiten, die im Cockpit bearbeitet wurden (der Seed ueberspringt sie), den alten
  // Namen, den alten Text und kein Bild. 'begruessung' leer = der Standardtext im Baustein.
  if (typen.has('assistent')) {
    const a = loadAssistent();
    daten.assistent = {
      name: '{{facts.assistent.name}}', rolle: '{{facts.assistent.rolle}}', begruessung: '',
      avatar: bilderVerzeichnis[a.avatarBild]?.klein || '',
      foto: bilderVerzeichnis[a.fotoBild]?.mittel || '', fotoAlt: bilderVerzeichnis[a.fotoBild]?.alt || '',
      vorschlaege: a.vorschlaege || [],
    };
  }

  if (typen.has('beitragsliste')) {
    const uebersicht = page.page_type === 'aktuelles';
    const grenze = uebersicht ? JE_SEITE : GRENZE_START;
    const seite = uebersicht ? Math.max(1, Number(page.seitenzahl) || 1) : 1;
    // Mit Suchtext: ALLE Treffer, ohne Blaettern. Die Treffer kommen aus derselben
    // Quelle wie die Liste (P3) und werden hier nur gefiltert.
    // Die Arten, nach denen sich die Uebersicht filtern laesst: nur die, zu denen es Beitraege gibt, mit ihrer Zahl
    // (gerechnet, nie getippt). Eine gewaehlte Art oder ein Suchtext zeigt ALLE Treffer ohne Blaettern.
    const kategorien = uebersicht ? await beitragsArten() : [];
    if (page.suche || page.art) {
      const treffer = await beitraegeSuchen(page.suche || '', page.art || '');
      daten.beitragsliste = { gesamt: treffer.length, seite: 1, seiten: 1, basis: '/aktuelles/',
        eintraege: treffer, q: page.suche || '', art: page.art || '', kategorien };
    } else {
    const { gesamt, eintraege } = await beitraegeLaden(grenze, (seite - 1) * grenze);
    daten.beitragsliste = {
      gesamt,
      seite: uebersicht ? seite : 1,
      seiten: uebersicht ? Math.max(1, Math.ceil(gesamt / grenze)) : 1,
      basis: '/aktuelles/',
      eintraege, kategorien,
    };
    }
  }
  // Der Startseiten-Baustein 'aktuell' bekommt dieselben Beitraege und
  // dieselben Termine wie /aktuelles/ und /kalender/ — andere Ansicht, gleiche
  // Quelle (P3). Die Zahl steht im Baustein; hier wird nur geholt.
  if (typen.has('aktuell')) {
    const b = inhalt.blocks.find((x) => x?.type === 'aktuell');
    const nB = Number(b?.data?.anzahlBeitraege) > 0 ? Number(b.data.anzahlBeitraege) : 2;
    const { gesamt, eintraege } = await beitraegeLaden(nB, 0);
    // Ein Termin, der auf einen Beitrag in dieser Reihe verweist ('mehr'), steht nicht noch einmal daneben:
    // der Beitrag ist die Nachricht, der Termin waere dieselbe Sache zum zweiten Mal.
    const termine = ohneBeitragsDoppel(kuenftige(kalenderTermine()), eintraege);
    daten.aktuell = { gesamt, beitraege: eintraege, termine: mitSymbol(termine),
      // Am Spieltag stehen hier die frischen Ergebnisse statt der naechsten Termine.
      ergebnisse: neuesteErgebnisse(spielstand(), { jetzt: Date.now() }) };
  }
  if (typen.has('ergebnisse')) {
    const { stand } = infoStand();
    daten.ergebnisse = {
      ansicht: ansicht(spielstand(), { we: page.we || '', jetzt: Date.now() }),
      stand: stand ? berlinWann(Date.parse(stand)) : '',
      basis: `/${page.slug}/`,
    };
  }
  if (typen.has('termine')) {
    // Abgelaufene Termine fliegen HIER raus und nicht im Baustein: renderPage()
    // ist eine reine Funktion (P1). Ein new Date() im Baustein machte sie vom
    // Tag abhaengig — dieselbe Seite saehe im April anders aus als im Mai, und
    // kein Test koennte das festhalten.
    const arten = loadArten();
    const vergangen = page.zeit === 'vergangen';
    let liste = vergangen ? vergangene(kalenderTermine()) : kuenftige(kalenderTermine());
    // Was vor mehr als zwei Wochen war, interessiert kaum noch: nur das Juengere bleibt
    // aufgeklappt. Die Grenze rechnet die Route, nicht der Baustein (P1).
    if (vergangen) {
      const grenze = tagPlus(berlinTag(), -14);
      liste = liste.map((t) => ({ ...t, frisch: String(t.bis || t.datum) >= grenze }));
    }
    if (page.art) liste = liste.filter((t) => t.art === page.art);
    if (page.suche) liste = termineFiltern(liste, page.suche);
    daten.termine = {
      termine: mitSymbol(liste),
      stand: spielplanHinweis(), q: page.suche || '', basis: `/${page.slug}/`,
      // Die Arten, nach denen sich filtern laesst: die mit einem Namen fuer Termine.
      kategorien: Object.entries(arten).filter(([k, v]) => k[0] !== '_' && v.termin)
        .map(([key, v]) => ({ key, label: v.termin, symbol: v.symbol })),
      art: page.art || '', zeit: vergangen ? 'vergangen' : 'kommend',
    };
  }
  return daten;
}

/**
 * Aus der Art eines Termins das Symbol machen. Die Bausteine kennen nur
 * 'symbol' und 'symbolText' — welche Arten es gibt, steht in config/arten.json.
 */
function mitSymbol(termine) {
  const arten = loadArten();
  return termine.map((t) => ({ ...t, symbol: arten[t.art]?.symbol || '', symbolText: arten[t.art]?.termin || '' }));
}

/**
 * Die neuesten Beitraege samt Gesamtzahl — fuer /aktuelles/ UND die Startseite.
 *
 * Die Gesamtzahl kommt aus einer eigenen Abfrage, nicht aus der Laenge der
 * geholten Zeilen: die Startseite holt nur ein paar Stueck, und ein Link
 * 'Alle Beitraege (2)' waere schlicht falsch, wenn es 14 sind.
 * Number(), weil COUNT(*) auf Postgres Text liefert und nicht Zahl.
 */
/**
 * Alle veroeffentlichten Beitraege, die den Suchtext enthalten — neueste zuerst.
 * Geholt wird alles und in JavaScript gefiltert (siehe src/suche.js); bei
 * einigen Dutzend Beitraegen im Jahr ist das billiger als eine zweite
 * Suchlogik in SQL, die je nach Datenbank anders waere.
 */
async function beitraegeSuchen(q, art = '') {
  let zeilen = await query(
    `SELECT slug, title, description, created_at, art, content_json FROM pages
     WHERE page_type = 'beitrag' AND status = 'published' ORDER BY created_at DESC`);
  if (art) zeilen = zeilen.filter((z) => z.art === art);
  return (q ? beitraegeFiltern(zeilen, q) : zeilen).map((z) => ({
    datum: new Date(z.created_at).toLocaleDateString('de-DE',
      { day: 'numeric', month: 'long', year: 'numeric' }),
    titel: z.title, text: aufhaenger(z.description), href: `/aktuelles/${z.slug}/`,
    symbol: loadArten()[z.art]?.symbol || '', symbolText: loadArten()[z.art]?.label || '',
  }));
}

/** Die Arten der veroeffentlichten Beitraege mit ihrer Zahl, in der Reihenfolge von config/arten.json. */
async function beitragsArten() {
  const zeilen = await query(
    `SELECT art, COUNT(*) AS n FROM pages WHERE page_type = 'beitrag' AND status = 'published' GROUP BY art`);
  const zahl = Object.fromEntries(zeilen.filter((z) => z.art).map((z) => [z.art, Number(z.n)]));
  return Object.entries(loadArten())
    .filter(([k, v]) => k[0] !== '_' && v.beitraege && zahl[k] > 0)
    .map(([key, v]) => ({ key, label: v.beitraege, symbol: v.symbol, anzahl: zahl[key] }));
}

async function beitraegeLaden(grenze, versatz) {
  const zeilen = await query(
    `SELECT slug, title, description, created_at, bild, bild_alt, art FROM pages
     WHERE page_type = 'beitrag' AND status = 'published'
     ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [grenze, versatz]);
  const gezaehlt = await queryOne(
    `SELECT COUNT(*) AS n FROM pages
     WHERE page_type = 'beitrag' AND status = 'published'`);
  return {
    gesamt: Number(gezaehlt?.n ?? 0),
    eintraege: zeilen.map((z) => ({
      datum: new Date(z.created_at).toLocaleDateString('de-DE',
        { day: 'numeric', month: 'long', year: 'numeric' }),
      titel: z.title,
      text: aufhaenger(z.description),
      href: `/aktuelles/${z.slug}/`,
      symbol: loadArten()[z.art]?.symbol || '',
      symbolText: loadArten()[z.art]?.label || '',
    })),
  };
}

// Die Terminlogik wohnt in src/termin-quelle.js — der Assistent braucht sie auch.
// Von hier weiter exportiert, damit Tests und Aufrufer ihren Import behalten.
export { kuenftige };

async function seiteFinden(pfad) {
  const direkt = await queryOne(
    "SELECT * FROM pages WHERE slug = $1 AND status = 'published'", [pfad]);
  if (direkt) return direkt;

  // /aktuelles/seite-2/ ist dieselbe Seite, nur ein anderer Ausschnitt. Die
  // Pruefung steht VOR der Beitragssuche: 'seite-2' saehe sonst aus wie der
  // Slug eines Beitrags, und die Blaetterseiten waeren alle 404.
  const blatt = pfad.match(/^aktuelles\/seite-(\d+)$/);
  if (blatt) {
    const nr = Number(blatt[1]);
    const uebersicht = await queryOne(
      "SELECT * FROM pages WHERE slug = 'aktuelles' AND status = 'published'");
    if (!uebersicht) return null;
    // Seite 1 heisst '/aktuelles/' — zwei Adressen fuer denselben Inhalt waeren
    // ein Fehler, auch wenn beide funktionieren wuerden.
    if (nr < 2) return null;
    // Und hinter der letzten Seite ist nichts. Ohne diese Pruefung antwortet
    // '/aktuelles/seite-99/' mit 200 und einer leeren Liste: beliebig viele
    // Adressen, die alle nichts zeigen.
    const { n } = await queryOne(
      `SELECT COUNT(*) AS n FROM pages
       WHERE page_type = 'beitrag' AND status = 'published'`);
    if (nr > Math.ceil(Number(n) / JE_SEITE)) return null;
    return { ...uebersicht, seitenzahl: nr };
  }

  const m = pfad.match(/^aktuelles\/([^/]+)$/);
  if (!m) return null;
  return queryOne(
    "SELECT * FROM pages WHERE slug = $1 AND page_type = 'beitrag' AND status = 'published'",
    [m[1]]);
}

// ── Vorschau: Entwuerfe sehen, ohne sie zu veroeffentlichen ──
router.get('/vorschau/:id', async (req, res, next) => {
  try {
    const { istAngemeldet } = await import('../auth.js');
    if (!istAngemeldet(req)) return res.status(401).type('html').send('<h1>Nicht angemeldet</h1>');
    const page = await queryOne('SELECT * FROM pages WHERE id = $1', [req.params.id]);
    if (!page) return next();
    const inhalt = JSON.parse(page.content_json);
    res.type('html').set('Cache-Control', 'no-store')
      .send(renderPage(page, { dynamicData: await dynamischeDaten(inhalt, page) }));
  } catch (err) { next(err); }
});

router.get(/^\/(.*)$/, async (req, res, next) => {
  try {
    const pfad = (req.params[0] || 'start').replace(/\/+$/, '') || 'start';

    // Eine Seite mit Suchtext (?q=…) wird nie aus dem Speicher geholt und nie
    // hineingelegt: der Speicher kennt nur den Pfad, und jeder Suchtext waere
    // sonst fuer alle die richtige Antwort.
    const q = suchtext(req.query.q);
    // ?we=JJJJ-MM-TT waehlt ein Spielwochenende. Wie die Suche: nie aus dem Speicher.
    const we = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.we || '')) ? String(req.query.we) : '';
    // ?art=… waehlt eine Art von Terminen (nur eine, die es gibt), ?zeit=vergangen die Rueckschau.
    const art = Object.entries(loadArten()).some(([k, v]) => k[0] !== '_' && v.termin && k === String(req.query.art || ''))
      ? String(req.query.art) : '';
    const zeit = req.query.zeit === 'vergangen' ? 'vergangen' : '';
    if (!q && !we && !art && !zeit) {
      const zwischen = holen(pfad);
      if (zwischen) { zaehle(req.path); return res.type('html').send(zwischen); }
    }

    const geladen = await seiteFinden(pfad);
    if (!geladen) return next();
    const inhalt = JSON.parse(geladen.content_json);
    // Nur Seiten, die ein Suchfeld haben, nehmen den Suchtext an.
    const suchbar = begriffe(q).length > 0 && inhalt.blocks.some((b) =>
      ['beitragsliste', 'termine'].includes(b?.type) && b.data?.suche === 'an');
    const page = { ...geladen, ...(suchbar ? { suche: q } : {}), ...(we ? { we } : {}), ...(art ? { art } : {}), ...(zeit ? { zeit } : {}) };
    const html = renderPage(page, { dynamicData: await dynamischeDaten(inhalt, page) });
    zaehle(req.path);
    // Eine Seite mit Terminen gilt nur bis Mitternacht: danach kann ein
    // Termin vorbei sein, und der Speicher wuesste nichts davon.
    const hatTermine = inhalt.blocks.some((b) => b?.type === 'termine' || b?.type === 'aktuell');
    if (q || we || art || zeit) return res.type('html').set('Cache-Control', 'no-store').send(html);
    // Der Spielstand aendert sich im Lauf des Tages: eine Minute, nicht bis Mitternacht.
    if (inhalt.blocks.some((b) => b?.type === 'ergebnisse' || b?.type === 'aktuell')) {
      return res.type('html').send(legen(pfad, html, Date.now() + 60 * 1000));
    }
    res.type('html').send(legen(pfad, html, hatTermine ? bisMitternacht() : 0));
  } catch (err) { next(err); }
});

export default router;
