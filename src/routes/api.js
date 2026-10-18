import { loadArten } from '../config.js';
import { Router } from 'express';
import express from 'express';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { extname } from 'node:path';
import { query, queryOne } from '../db.js';
import { blocks } from '../blocks/index.js';
import { alleTypen, getType, validateContent } from '../archetypes.js';
import { aktualisiere } from '../config.js';
import { anmelden, abmelden, schuetzen, nurErlaubtes, istAngemeldet, rolle } from '../auth.js';
import redaktion from './redaktion.js';
import { leereCache } from '../cache.js';
import { bremseFuer } from '../bremse.js';

const router = Router();
const jetzt = () => new Date().toISOString();

// ── Anmeldung ────────────────────────────────────────────────────────
router.post('/login', express.json(), anmelden);
router.post('/logout', abmelden);
router.get('/ich', (req, res) => res.json({ angemeldet: istAngemeldet(req), rolle: rolle(req) }));

// ── Die eine Handlung: ein Formular. OEFFENTLICH, bewusst vor schuetzen(). ──
//
// Fuenf Anfragen in zehn Minuten von derselben Adresse reichen jedem Menschen,
// auch einer Familie hinter einem Anschluss. Was darueber liegt, fuellt nur die
// Tabelle — der Honigtopf faengt dumme Bots, die Bremse die anderen.
const formularZuSchnell = bremseFuer({ fensterMs: 10 * 60 * 1000, hoechstens: 5 });

router.post('/form/:name', express.json({ limit: '64kb' }), async (req, res) => {
  const { website, ...daten } = req.body || {};
  if (website) return res.json({ ok: true });          // 1. Honigtopf: Bots fuellen ihn aus
  if (formularZuSchnell(req.ip)) {
    return res.status(429).json({
      fehler: 'Das waren gerade viele Anfragen auf einmal. Probier es in ein paar Minuten noch einmal.' });
  }

  try {
    // 2. ZUERST speichern, DANN benachrichtigen. Nie umgekehrt — sonst gehen
    //    Anfragen verloren, sobald der Versand klemmt, und niemand merkt es.
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO submissions (id, form, page_slug, daten, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, String(req.params.name).slice(0, 40), daten._seite || null,
       JSON.stringify(daten), jetzt()]);

    // 3. Eine scheiternde Benachrichtigung scheitert leise (P6).
    //    Die Anfrage liegt in der Tabelle, jemand sieht sie im Cockpit.
    try { await benachrichtige(id, daten); }
    catch (err) { console.error(`[Motor] [FEHLER] Benachrichtigung zu ${id}: ${err.message}`); }

    res.json({ ok: true });
  } catch (err) {
    console.error('[Motor] [FEHLER] Anfrage:', err);
    res.status(500).json({ fehler: 'Konnte nicht gespeichert werden.' });
  }
});

// ── Der Assistent. OEFFENTLICH, bewusst vor schuetzen(). ──────────────
//
// Eine einfache Bremse: mehr als 12 Fragen in 10 Minuten von derselben
// Adresse sind kein Mensch, der sich informiert.
const zuSchnell = bremseFuer({ fensterMs: 10 * 60 * 1000, hoechstens: 12 });

router.post('/chat', express.json({ limit: '16kb' }), async (req, res) => {
  const { antworte, istBereit } = await import('../assistent/antworten.js');

  if (!istBereit()) {
    return res.status(503).json({
      fehler: 'Der Assistent ist noch nicht eingerichtet (ANTHROPIC_API_KEY fehlt).' });
  }
  const frage = String(req.body?.frage || '').trim().slice(0, 500);
  if (frage.length < 3) return res.status(400).json({ fehler: 'Die Frage ist zu kurz.' });
  if (zuSchnell(req.ip)) {
    return res.status(429).json({
      fehler: 'Das waren jetzt viele Fragen auf einmal. Probier es in ein paar Minuten noch einmal.' });
  }

  // Strom statt eine Antwort am Stueck: der Mensch sieht, dass etwas passiert.
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache',
            Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders?.();

  const schicke = (d) => res.write(`data: ${JSON.stringify(d)}\n\n`);
  let ganzeAntwort = '';
  let quellen = [];
  let gefunden = 0;

  try {
    const verlauf = Array.isArray(req.body?.verlauf) ? req.body.verlauf.slice(-6) : [];
    for await (const stueck of antworte(frage, verlauf)) {
      if (stueck.art === 'text') { ganzeAntwort += stueck.text; schicke(stueck); }
      else if (stueck.art === 'fertig') {
        quellen = stueck.quellen; gefunden = stueck.gefunden;
        schicke({ art: 'fertig', quellen });
      } else schicke(stueck);
    }
  } catch (err) {
    console.error('[Motor] [FEHLER] Chat:', err);
    schicke({ art: 'fehler', text: 'Da ist etwas schiefgegangen.' });
  } finally {
    res.end();
    // Nach dem Antworten mitschreiben. Das ist der wertvollste Nebeneffekt:
    // du siehst, was Leute wissen wollen und nicht finden.
    query(`INSERT INTO chat_log (id, frage, antwort, quellen, gefunden, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), frage, ganzeAntwort.slice(0, 4000),
       JSON.stringify(quellen), gefunden, jetzt()])
      .catch((e) => console.error('[Motor] [FEHLER] Chat-Log:', e.message));
  }
});

async function benachrichtige(id, daten) {
  // Noch kein Mailversand eingerichtet. Bis dahin: sichtbar im Log und im Cockpit.
  console.log(`[Motor] Neue Anfrage ${id}:`, Object.keys(daten).join(', '));
}

// ── Ab hier: nur angemeldet ──────────────────────────────────────────
router.use(schuetzen);
router.use(express.json({ limit: '2mb' }));
// Die Redaktion darf nur, was in src/auth.js ausdruecklich freigegeben ist.
router.use(nurErlaubtes);
router.use('/redaktion', redaktion);

/** Die Redaktion darf nur Beitraege. Antwortet mit 403 und gibt true zurueck, wenn nicht. */
const nichtFuerRedaktion = (req, res, seitenTyp) => {
  if (rolle(req) === 'redaktion' && seitenTyp !== 'beitrag') {
    res.status(403).json({ fehler: 'Als Redaktion kannst du nur Beiträge bearbeiten.' });
    return true;
  }
  return false;
};

// ── Bausteine und Seitentypen: das Cockpit baut seine Formulare daraus ──
router.get('/schema', (_req, res) => {
  res.json({
    bausteine: Object.values(blocks).map((b) => ({
      name: b.name, label: b.label, schema: b.schema,
    })),
    typen: alleTypen().map((t) => ({
      name: t.name, label: t.label, beschreibung: t.beschreibung,
      allowedBlocks: t.schema.allowedBlocks || [],
      requiredBlocks: t.schema.requiredBlocks || [],
    })),
  });
});

// ── Seiten ───────────────────────────────────────────────────────────
router.get('/pages', async (req, res) => {
  res.json(await query(
    `SELECT id, slug, page_type, status, title, description, og_image, updated_at
       FROM pages ${rolle(req) === 'redaktion' ? "WHERE page_type = 'beitrag'" : ''}
       ORDER BY page_type, sort, title`));
});

router.get('/pages/:id', async (req, res) => {
  const p = await queryOne('SELECT * FROM pages WHERE id = $1', [req.params.id]);
  if (!p) return res.status(404).json({ fehler: 'Gibt es nicht.' });
  if (nichtFuerRedaktion(req, res, p.page_type)) return;
  res.json({ ...p, content_json: JSON.parse(p.content_json) });
});

/** Anlegen: der Motor setzt die Pflichtbausteine des Typs, Status draft. */
router.post('/pages', async (req, res) => {
  const { slug, page_type, title } = req.body || {};
  if (nichtFuerRedaktion(req, res, page_type)) return;
  const typ = getType(page_type);
  if (!typ) return res.status(400).json({ fehler: `Seitentyp '${page_type}' gibt es nicht.` });
  const sauber = saubererSlug(slug);
  if (!sauber) return res.status(400).json({ fehler: 'Die Adresse fehlt oder ist unbrauchbar.' });
  if (await queryOne('SELECT id FROM pages WHERE slug = $1', [sauber])) {
    return res.status(409).json({ fehler: `Die Adresse /${sauber}/ ist schon vergeben.` });
  }

  const pflicht = typ.schema.requiredBlocks || [];
  const inhalt = { blocks: pflicht.map((t) => ({ type: t, data: vorgaben(t) })) };
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, created_at, updated_at)
     VALUES ($1, $2, $3, 'draft', $4, '', $5, $6, $7)`,
    [id, sauber, page_type, title || sauber, JSON.stringify(inhalt), jetzt(), jetzt()]);
  res.json({ id, slug: sauber });
});

router.put('/pages/:id', async (req, res) => {
  const alt = await queryOne('SELECT * FROM pages WHERE id = $1', [req.params.id]);
  if (!alt) return res.status(404).json({ fehler: 'Gibt es nicht.' });
  if (nichtFuerRedaktion(req, res, alt.page_type)) return;

  const { title, description, og_image, status, content_json, art } = req.body || {};
  const neuSlug = saubererSlug(req.body?.slug) || alt.slug;
  const inhalt = content_json || JSON.parse(alt.content_json);

  const pruefung = validateContent(alt.page_type, inhalt);
  if (!pruefung.ok) return res.status(400).json({ fehler: pruefung.fehler.join(' · ') });

  if (neuSlug !== alt.slug
      && await queryOne('SELECT id FROM pages WHERE slug = $1 AND id <> $2', [neuSlug, alt.id])) {
    return res.status(409).json({ fehler: `Die Adresse /${neuSlug}/ ist schon vergeben.` });
  }

  // Aendert sich der Slug einer VEROEFFENTLICHTEN Seite, schreibt der Motor
  // ungefragt eine 301. Nicht als Angebot, nicht als Haekchen — automatisch.
  // Sonst bricht irgendwann jemand einen Link und merkt es in sechs Monaten.
  if (alt.status === 'published' && neuSlug !== alt.slug) {
    await umleitungSetzen(`/${alt.slug}/`, `/${neuSlug}/`, 301);
  }

  await query(
    `UPDATE pages SET slug = $1, title = $2, description = $3, og_image = $4,
       status = $5, content_json = $6, updated_at = $7, art = $8 WHERE id = $9`,
    [neuSlug, title ?? alt.title, description ?? alt.description,
     og_image ?? alt.og_image, status ?? alt.status,
     JSON.stringify(inhalt), jetzt(),
     // Leer heisst 'keine Art', fehlt das Feld ganz, bleibt die alte. Nur Arten aus
     // config/arten.json sind erlaubt — ein Beitrag erfindet kein Symbol.
     // Die Platzhalter stehen in der Reihenfolge der Parameter: die SQLite-
     // Uebersetzung in src/db.js zaehlt positionell.
     art === undefined ? alt.art : (loadArten()[art] ? art : null),
     alt.id]);

  leereCache();

  // Der Assistent antwortet sonst monatelang aus einer Fassung, die niemand
  // mehr sieht. Er darf das Speichern aber nicht aufhalten (P6).
  const frisch = await queryOne('SELECT * FROM pages WHERE id = $1', [alt.id]);
  import('../assistent/zerlegen.js')
    .then((m) => m.indiziere(frisch))
    .catch((e) => console.error('[Motor] [FEHLER] Index:', e.message));

  res.json({ ok: true, slug: neuSlug });
});

/** Loeschen: bei veroeffentlichten Seiten mit Pflichtangabe, wohin umgeleitet wird. */
router.delete('/pages/:id', async (req, res) => {
  const p = await queryOne('SELECT * FROM pages WHERE id = $1', [req.params.id]);
  if (!p) return res.status(404).json({ fehler: 'Gibt es nicht.' });

  const ziel = String(req.query.ziel || '').trim();
  if (p.status === 'published') {
    if (!/^\/[\w\-/]*$/.test(ziel)) {
      return res.status(400).json({
        fehler: 'Diese Seite ist veröffentlicht. Sag, wohin ihre Adresse künftig führen soll.',
        brauchtZiel: true,
      });
    }
    await umleitungSetzen(`/${p.slug}/`, ziel, 301);
  }
  await query('DELETE FROM pages WHERE id = $1', [p.id]);
  await query('DELETE FROM chunks WHERE page_slug = $1', [p.slug]);
  await query('UPDATE navigation SET visible = 0 WHERE href = $1', [`/${p.slug}/`]);
  leereCache();
  res.json({ ok: true });
});

// ── Navigation ───────────────────────────────────────────────────────
router.get('/navigation', async (_req, res) => {
  res.json(await query('SELECT * FROM navigation ORDER BY ort, sort'));
});

router.put('/navigation', async (req, res) => {
  const punkte = Array.isArray(req.body?.punkte) ? req.body.punkte : null;
  if (!punkte) return res.status(400).json({ fehler: 'punkte fehlt.' });

  // Ganz ersetzen: das Cockpit schickt den Baum, wie er sein soll.
  await query('DELETE FROM navigation');
  let i = 0;
  for (const p of punkte) {
    if (!p?.label || !p?.href) continue;
    await query(
      `INSERT INTO navigation (id, parent_id, ort, label, href, sort, visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [p.id || crypto.randomUUID(), p.parent_id || null,
       p.ort === 'fuss' ? 'fuss' : 'kopf', String(p.label).slice(0, 60),
       String(p.href).slice(0, 300), i++, p.visible === false ? 0 : 1]);
  }
  leereCache();
  res.json({ ok: true });
});

/** Warnt vor Menuepunkten, die ins Leere zeigen — statt sie still zu lassen. */
router.get('/navigation/pruefung', async (_req, res) => {
  const punkte = await query('SELECT * FROM navigation');
  const lebendig = new Set((await query(
    "SELECT slug FROM pages WHERE status = 'published'")).map((z) => `/${z.slug}/`));
  lebendig.add('/');
  const warnungen = [];
  for (const p of punkte) {
    if (/^https?:|^mailto:|^tel:|^#/.test(p.href)) continue;
    if (!lebendig.has(p.href)) {
      warnungen.push({ id: p.id, label: p.label, href: p.href,
        grund: 'zeigt auf keine veröffentlichte Seite' });
    }
  }
  res.json({ warnungen });
});

// ── Medien ───────────────────────────────────────────────────────────
const ERLAUBT = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                  '.png': 'image/png', '.svg': 'image/svg+xml', '.gif': 'image/gif' };

router.get('/media', async (_req, res) => {
  res.json(await query('SELECT * FROM media ORDER BY created_at DESC'));
});

// type: () => true statt '*/*' — ohne Content-Type-Kopfzeile laesst type-is
// sonst nichts durch und der Rumpf kommt leer an. Der Dateityp wird ohnehin
// an der Endung geprueft, nicht an einer Angabe, die der Absender frei waehlt.
router.post('/media', express.raw({ type: () => true, limit: '12mb' }), async (req, res) => {
  const name = String(req.query.name || '');
  const endung = extname(name).toLowerCase();
  if (!ERLAUBT[endung]) {
    return res.status(400).json({
      fehler: `Dateityp nicht erlaubt. Möglich sind: ${Object.keys(ERLAUBT).join(', ')}` });
  }
  if (!req.body?.length) return res.status(400).json({ fehler: 'Datei ist leer.' });

  // Dateiname mit Inhalts-Hash. Wer unter demselben Namen ueberschreibt,
  // kaempft danach gegen den Browser-Cache.
  const hash = createHash('sha256').update(req.body).digest('hex').slice(0, 8);
  const basis = name.replace(endung, '').toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c]))
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'bild';
  const datei = `${basis}-${hash}${endung}`;

  mkdirSync('data/uploads', { recursive: true });
  writeFileSync(`data/uploads/${datei}`, req.body);

  const vorhanden = await queryOne('SELECT * FROM media WHERE file_path = $1', [`/uploads/${datei}`]);
  if (vorhanden) return res.json(vorhanden);

  const eintrag = { id: crypto.randomUUID(), file_path: `/uploads/${datei}`,
                    alt: '', bytes: req.body.length, created_at: jetzt() };
  await query(
    'INSERT INTO media (id, file_path, alt, bytes, created_at) VALUES ($1, $2, $3, $4, $5)',
    [eintrag.id, eintrag.file_path, eintrag.alt, eintrag.bytes, eintrag.created_at]);
  res.json(eintrag);
});

router.put('/media/:id', async (req, res) => {
  // Alt-Text ist ein Pflichtfeld, kein Zusatz.
  await query('UPDATE media SET alt = $1 WHERE id = $2',
    [String(req.body?.alt || '').slice(0, 300), req.params.id]);
  res.json({ ok: true });
});

router.delete('/media/:id', async (req, res) => {
  const m = await queryOne('SELECT * FROM media WHERE id = $1', [req.params.id]);
  if (!m) return res.status(404).json({ fehler: 'Gibt es nicht.' });
  const benutzt = await query(
    "SELECT slug FROM pages WHERE content_json LIKE $1 OR og_image = $2",
    [`%${m.file_path}%`, m.file_path]);
  if (benutzt.length) {
    return res.status(409).json({
      fehler: `Wird noch benutzt auf: ${benutzt.map((b) => '/' + b.slug + '/').join(', ')}` });
  }
  const pfad = `data${m.file_path}`;
  if (existsSync(pfad)) unlinkSync(pfad);
  await query('DELETE FROM media WHERE id = $1', [m.id]);
  res.json({ ok: true });
});

// ── Umleitungen ──────────────────────────────────────────────────────
async function umleitungSetzen(von, nach, code = 301) {
  await query('DELETE FROM redirects WHERE from_path = $1', [von]);
  // Kettenbildung vermeiden: zeigte etwas auf die alte Adresse, zeigt es jetzt direkt aufs Ziel.
  await query('UPDATE redirects SET to_path = $1 WHERE to_path = $2', [nach, von]);
  await query(
    'INSERT INTO redirects (from_path, to_path, code, created_at) VALUES ($1, $2, $3, $4)',
    [von, nach, code, jetzt()]);
  leereCache();
}

router.get('/redirects', async (_req, res) => {
  const liste = await query('SELECT * FROM redirects ORDER BY from_path');
  // Eine Umleitung, unter deren Adresse inzwischen eine echte Seite liegt,
  // greift nicht mehr. Das gehoert sichtbar gemacht, nicht stumm geregelt.
  const lebendig = new Set((await query(
    "SELECT slug FROM pages WHERE status = 'published'")).map((z) => `/${z.slug}/`));
  lebendig.add('/');
  res.json(liste.map((r) => ({ ...r, ueberschattet: lebendig.has(r.from_path) })));
});

router.post('/redirects', async (req, res) => {
  const von = String(req.body?.from_path || '').trim();
  const nach = String(req.body?.to_path || '').trim();
  if (!/^\/.*/.test(von) || !/^(\/|https:\/\/)/.test(nach)) {
    return res.status(400).json({ fehler: 'Von und Nach müssen Pfade sein, z. B. /alt/ und /neu/.' });
  }
  if (von === nach) return res.status(400).json({ fehler: 'Von und Nach sind gleich.' });
  await umleitungSetzen(von, nach, Number(req.body?.code) === 302 ? 302 : 301);
  res.json({ ok: true });
});

// Der Pfad kommt als Parameter, nicht im URL — sonst muesste er doppelt
// kodiert werden und Express 5 deutet die Schraegstriche als Route.
router.delete('/redirects', async (req, res) => {
  const von = String(req.body?.from_path || req.query.from || '');
  if (!von) return res.status(400).json({ fehler: 'from_path fehlt.' });
  await query('DELETE FROM redirects WHERE from_path = $1', [von]);
  leereCache();
  res.json({ ok: true });
});

// ── Anfragen ─────────────────────────────────────────────────────────
router.get('/submissions', async (_req, res) => {
  const zeilen = await query('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 300');
  res.json(zeilen.map((z) => ({ ...z, daten: JSON.parse(z.daten) })));
});

router.get('/submissions/offen', async (_req, res) => {
  const z = await queryOne('SELECT COUNT(*) AS n FROM submissions WHERE gelesen = 0');
  res.json({ offen: Number(z?.n || 0) });
});

router.put('/submissions/:id', async (req, res) => {
  await query('UPDATE submissions SET gelesen = $1 WHERE id = $2',
    [req.body?.gelesen ? 1 : 0, req.params.id]);
  res.json({ ok: true });
});

// ── Fakten und Farben ohne Deploy ────────────────────────────────────
router.get('/config/:was', async (req, res) => {
  const was = req.params.was;
  if (!['facts', 'theme', 'site'].includes(was)) {
    return res.status(404).json({ fehler: 'Gibt es nicht.' });
  }
  const { readFileSync } = await import('node:fs');
  const z = await queryOne('SELECT wert FROM config_overrides WHERE schluessel = $1', [was]);
  res.json({
    datei: JSON.parse(readFileSync(`config/${was}.json`, 'utf8')),
    override: z ? JSON.parse(z.wert) : {},
  });
});

router.put('/config/:was', async (req, res) => {
  const was = req.params.was;
  if (!['facts', 'theme', 'site'].includes(was)) {
    return res.status(404).json({ fehler: 'Gibt es nicht.' });
  }
  const wert = req.body?.override;
  if (!wert || typeof wert !== 'object') return res.status(400).json({ fehler: 'override fehlt.' });
  await query('DELETE FROM config_overrides WHERE schluessel = $1', [was]);
  await query(
    'INSERT INTO config_overrides (schluessel, wert, updated_at) VALUES ($1, $2, $3)',
    [was, JSON.stringify(wert), jetzt()]);
  await aktualisiere();
  leereCache();
  res.json({ ok: true });
});

// Die Arten von Beitraegen und Terminen, fuer das Auswahlfeld im Cockpit.
router.get('/arten', (_req, res) => res.json(loadArten()));

// ── Generator (Stufe 4) ──────────────────────────────────────────────
router.get('/generator', async (_req, res) => {
  const { istBereit } = await import('../generator.js');
  res.json({
    bereit: istBereit(),
    typen: alleTypen().map((t) => ({ name: t.name, label: t.label, beschreibung: t.beschreibung })),
  });
});

router.post('/generator', async (req, res) => {
  const { generiere } = await import('../generator.js');
  const quelle = String(req.body?.quelle || '').trim();
  const typ = String(req.body?.typ || 'standard');
  const anmerkung = String(req.body?.anmerkung || '').slice(0, 2000);

  if (quelle.length < 30) {
    return res.status(400).json({ fehler: 'Zu wenig Rohmaterial. Ein paar Sätze mindestens.' });
  }
  try {
    const r = await generiere({ quelle, typ, anmerkung });
    res.json(r);
  } catch (err) {
    console.error('[Generator] [FEHLER]', err.message);
    res.status(422).json({ fehler: err.message, inhalt: err.inhalt || null });
  }
});

/** Das Ergebnis übernehmen — als Entwurf mit Status 'generated', nie veröffentlicht. */
router.post('/generator/uebernehmen', async (req, res) => {
  const { slug, page_type, title, description, content_json } = req.body || {};
  const typ = getType(page_type);
  if (!typ) return res.status(400).json({ fehler: `Seitenart '${page_type}' gibt es nicht.` });
  const sauber = saubererSlug(slug);
  if (!sauber) return res.status(400).json({ fehler: 'Die Adresse fehlt.' });
  if (await queryOne('SELECT id FROM pages WHERE slug = $1', [sauber])) {
    return res.status(409).json({ fehler: `Die Adresse /${sauber}/ ist schon vergeben.` });
  }
  const pruefung = validateContent(page_type, content_json);
  if (!pruefung.ok) return res.status(400).json({ fehler: pruefung.fehler.join(' · ') });

  // P5: 'generated', nicht 'published'. Ein Mensch entscheidet.
  const id = crypto.randomUUID();
  await query(
    `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, created_at, updated_at)
     VALUES ($1, $2, $3, 'generated', $4, $5, $6, $7, $8)`,
    [id, sauber, page_type, String(title || sauber).slice(0, 120),
     String(description || '').slice(0, 200), JSON.stringify(content_json), jetzt(), jetzt()]);
  res.json({ id, slug: sauber });
});

// ── Assistent im Cockpit ─────────────────────────────────────────────
router.get('/assistent', async (_req, res) => {
  const { istBereit } = await import('../assistent/antworten.js');
  const n = await queryOne('SELECT COUNT(*) AS n FROM chunks');
  const s = await queryOne('SELECT COUNT(DISTINCT page_slug) AS n FROM chunks');
  const ohne = await query(
    "SELECT slug, title FROM pages WHERE status = 'published' AND chat_excluded = 1");
  res.json({
    bereit: istBereit(),
    stuecke: Number(n?.n || 0),
    seiten: Number(s?.n || 0),
    ausgenommen: ohne,
  });
});

router.post('/assistent/neu-indizieren', async (_req, res) => {
  const { indiziereAlles } = await import('../assistent/zerlegen.js');
  res.json(await indiziereAlles());
});

router.put('/assistent/ausnehmen/:id', async (req, res) => {
  await query('UPDATE pages SET chat_excluded = $1 WHERE id = $2',
    [req.body?.ausnehmen ? 1 : 0, req.params.id]);
  const p = await queryOne('SELECT * FROM pages WHERE id = $1', [req.params.id]);
  if (p) {
    const { indiziere } = await import('../assistent/zerlegen.js');
    await indiziere(p);
  }
  res.json({ ok: true });
});

router.get('/assistent/fragen', async (_req, res) => {
  res.json(await query(
    `SELECT id, frage, antwort, gefunden, created_at FROM chat_log
      ORDER BY created_at DESC LIMIT 200`));
});

// ── Aufrufe ──────────────────────────────────────────────────────────
router.get('/aufrufe', async (_req, res) => {
  const seit = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [seiten, tage] = await Promise.all([
    query(`SELECT pfad, SUM(anzahl) AS anzahl FROM aufrufe
            WHERE tag >= $1 GROUP BY pfad ORDER BY SUM(anzahl) DESC LIMIT 25`, [seit]),
    query(`SELECT tag, SUM(anzahl) AS anzahl FROM aufrufe
            WHERE tag >= $1 GROUP BY tag ORDER BY tag`, [seit]),
  ]);
  // Postgres liefert SUM als Text, SQLite als Zahl — hier vereinheitlicht.
  res.json({
    seiten: seiten.map((z) => ({ pfad: z.pfad, anzahl: Number(z.anzahl) })),
    tage: tage.map((z) => ({ tag: z.tag, anzahl: Number(z.anzahl) })),
  });
});

// ── Hilfen ───────────────────────────────────────────────────────────
function saubererSlug(s) {
  return String(s || '').trim().toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c]))
    .replace(/[^a-z0-9/-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 120);
}

function vorgaben(typ) {
  const b = blocks[typ];
  if (!b) return {};
  return Object.fromEntries(Object.entries(b.schema).map(([k, v]) => [k, v.default]));
}

export default router;
