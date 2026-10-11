/**
 * Der Redaktionsbereich: Ergebnisse beim HTV nachsehen, ein Wochenende ansehen,
 * die Kurzinfo fuer WhatsApp holen, einen Spielbericht als Entwurf erzeugen.
 *
 * Erreichbar fuer die Redaktion UND den Administrator (siehe src/auth.js).
 * Alles hier, was Geld oder den Verbandsserver kostet, ist gebremst:
 *   - Abruf beim HTV:  hoechstens alle 10 Minuten
 *   - Berichtsentwurf: hoechstens sechs je Stunde (jeder ist ein Modellaufruf)
 */
import { Router } from 'express';
import { query } from '../db.js';
import { loadSite } from '../config.js';
import { spielstand, abrufen, infoStand } from '../spielstand.js';
import { ansicht, wochenenden, wochenendeText } from '../ergebnisse.js';
import { spielwochenende, kurzinfo } from '../spielbericht.js';
import { erzeugeEntwurf, BerichtFehler } from '../berichte.js';
import { berlinWann } from '../zeit.js';

const router = Router();

const zeiten = { abruf: [], bericht: [] };
function bremse(art, fensterMs, hoechstens) {
  const jetzt = Date.now();
  zeiten[art] = zeiten[art].filter((t) => jetzt - t < fensterMs);
  if (zeiten[art].length >= hoechstens) {
    return Math.ceil((fensterMs - (jetzt - zeiten[art][0])) / 60000);
  }
  zeiten[art].push(jetzt);
  return 0;
}

const GUELTIG = /^\d{4}-\d{2}-\d{2}$/;
const fenster = (we) => wochenenden(spielstand()).find((w) => we >= w.von && we <= w.bis);

router.get('/status', async (_req, res) => {
  const { stand, laeuft, anzahl } = infoStand();
  const letzte = await query('SELECT zeit, art, gruppen, neu, fehler, meldung FROM abrufe ORDER BY zeit DESC LIMIT 6');
  res.json({
    zeitplan: process.env.HTV_ABRUF === '1', laeuft, anzahl,
    stand: stand ? berlinWann(Date.parse(stand)) : '',
    letzte: letzte.map((a) => ({ ...a, wann: berlinWann(Date.parse(a.zeit)) })),
  });
});

router.get('/wochenenden', (_req, res) => {
  const spiele = spielstand();
  res.json(wochenenden(spiele).reverse().map((w) => {
    const dabei = spiele.filter((s) => s.datum >= w.von && s.datum <= w.bis);
    return { we: w.von, bis: w.bis, text: `${wochenendeText(w)} ${w.von.slice(0, 4)}`,
      begegnungen: dabei.length, offen: dabei.filter((s) => !s.gespielt).length };
  }));
});

router.get('/ansicht', (req, res) => {
  const we = GUELTIG.test(String(req.query.we)) ? String(req.query.we) : '';
  res.json(ansicht(spielstand(), { we, jetzt: Date.now() }));
});

/** Jetzt beim HTV nachsehen — im Hintergrund; der Knopf fragt danach den Status ab. */
router.post('/abruf', (_req, res) => {
  if (infoStand().laeuft) return res.status(409).json({ fehler: 'Es läuft gerade schon ein Abruf.' });
  const warten = bremse('abruf', 10 * 60 * 1000, 1);
  if (warten) {
    return res.status(429).json({ fehler: `Der Verband wurde gerade erst gefragt. In ${warten} Minute${warten === 1 ? '' : 'n'} wieder.` });
  }
  abrufen({ art: 'manuell' }).catch((e) => console.error('[Redaktion] [FEHLER] Abruf:', e.message));
  res.status(202).json({ gestartet: true });
});

/** Die Kurzinfo: aus den Daten gebaut, ohne Modell, ohne Namen. */
router.get('/whatsapp', (req, res) => {
  const we = GUELTIG.test(String(req.query.we)) ? String(req.query.we) : '';
  const w = we && fenster(we);
  if (!w) return res.status(404).json({ fehler: 'Dieses Wochenende gibt es nicht.' });
  const liste = spielwochenende({ begegnungen: spielstand() }, w.von, w.bis);
  if (!liste.length) return res.status(404).json({ fehler: 'Für dieses Wochenende ist noch kein Ergebnis gemeldet.' });
  const dabei = spielstand().filter((s) => s.datum >= w.von && s.datum <= w.bis);
  const domain = String(loadSite().domain || '').replace(/\/+$/, '');
  const format = req.query.format === 'text' ? 'text' : 'whatsapp';
  const text = kurzinfo(liste, w.von, w.bis, {
    format, offen: dabei.filter((s) => !s.gespielt).length, link: domain ? `${domain}/ergebnisse/?we=${w.von}` : '' });
  res.json({ text, format, zeichen: text.length,
    wa: `https://wa.me/?text=${encodeURIComponent(text)}` });
});

/** Einen Spielbericht als ENTWURF erzeugen. Veroeffentlicht wird er von Hand. */
router.post('/bericht', async (req, res) => {
  const we = GUELTIG.test(String(req.body?.we)) ? String(req.body.we) : '';
  const w = we && fenster(we);
  if (!w) return res.status(404).json({ fehler: 'Dieses Wochenende gibt es nicht.' });
  const warten = bremse('bericht', 60 * 60 * 1000, 6);
  if (warten) return res.status(429).json({ fehler: `Das waren viele Entwürfe in kurzer Zeit. In ${warten} Minuten wieder.` });
  try {
    const { stand } = infoStand();
    const r = await erzeugeEntwurf({ von: w.von, bis: w.bis, spiele: spielstand(),
      stand: stand ? berlinWann(Date.parse(stand)) : '' });
    res.json({ id: r.id, slug: r.slug, titel: r.titel, hinweise: r.hinweise });
  } catch (err) {
    if (err instanceof BerichtFehler) return res.status(err.status).json({ fehler: err.message });
    console.error('[Redaktion] [FEHLER] Bericht:', err);
    res.status(500).json({ fehler: 'Das hat nicht geklappt. Versuch es später noch einmal.' });
  }
});

export default router;
