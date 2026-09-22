import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { renderPage } from '../renderer.js';
import { loadSite } from '../config.js';
import { holen, legen } from '../cache.js';
import { zaehle } from '../zaehler.js';

const router = Router();

const GRENZE_UEBERSICHT = 100;
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

  if (typen.has('beitragsliste')) {
    const grenze = page.page_type === 'aktuelles' ? GRENZE_UEBERSICHT : GRENZE_START;
    const zeilen = await query(
      `SELECT slug, title, description, created_at FROM pages
       WHERE page_type = 'beitrag' AND status = 'published'
       ORDER BY created_at DESC LIMIT $1`, [grenze]);
    daten.beitragsliste = {
      eintraege: zeilen.map((z) => ({
        datum: new Date(z.created_at).toLocaleDateString('de-DE',
          { day: 'numeric', month: 'long', year: 'numeric' }),
        titel: z.title,
        text: z.description,
        href: `/aktuelles/${z.slug}/`,
      })),
    };
  }
  return daten;
}

async function seiteFinden(pfad) {
  const direkt = await queryOne(
    "SELECT * FROM pages WHERE slug = $1 AND status = 'published'", [pfad]);
  if (direkt) return direkt;
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

    const zwischen = holen(pfad);
    if (zwischen) { zaehle(req.path); return res.type('html').send(zwischen); }

    const page = await seiteFinden(pfad);
    if (!page) return next();
    const inhalt = JSON.parse(page.content_json);
    const html = renderPage(page, { dynamicData: await dynamischeDaten(inhalt, page) });
    zaehle(req.path);
    res.type('html').send(legen(pfad, html));
  } catch (err) { next(err); }
});

export default router;
