import crypto from 'node:crypto';

/**
 * Passwort-Anmeldung mit Cookie. KEINE Zugangsdaten im Code — nur in der Umgebung.
 *
 * Das Cookie traegt eine Signatur, damit niemand sich eine Sitzung basteln kann.
 * Fehlt ADMIN_PASSWORT, ist das Cockpit geschlossen statt offen: lieber
 * unbenutzbar als ungeschuetzt oeffentlich.
 */
const PASSWORT = process.env.ADMIN_PASSWORT || '';
const GEHEIM = process.env.SESSION_GEHEIMNIS || crypto.randomBytes(32).toString('hex');
const GUELTIG_MS = 1000 * 60 * 60 * 12;
const NAME = 'ktc_sitzung';

const zeichne = (bis) =>
  `${bis}.${crypto.createHmac('sha256', GEHEIM).update(String(bis)).digest('hex')}`;

function gueltig(keks) {
  if (!keks) return false;
  const [bis, sig] = String(keks).split('.');
  if (!bis || !sig) return false;
  if (Number(bis) < Date.now()) return false;
  const soll = zeichne(Number(bis)).split('.')[1];
  return sig.length === soll.length
    && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(soll));
}

const keksLesen = (req) => Object.fromEntries(
  (req.headers.cookie || '').split(';').map((t) => {
    const i = t.indexOf('=');
    return i < 0 ? ['', ''] : [t.slice(0, i).trim(), decodeURIComponent(t.slice(i + 1))];
  }))[NAME];

export const istAngemeldet = (req) => gueltig(keksLesen(req));

export function anmelden(req, res) {
  const eingabe = String(req.body?.passwort || '');
  if (!PASSWORT) {
    return res.status(503).json({ fehler: 'ADMIN_PASSWORT ist nicht gesetzt. Trag es in die .env ein.' });
  }
  // Gleich lange Puffer, damit die Laufzeit nichts ueber das Passwort verraet.
  const a = crypto.createHash('sha256').update(eingabe).digest();
  const b = crypto.createHash('sha256').update(PASSWORT).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ fehler: 'Passwort stimmt nicht.' });
  }
  const bis = Date.now() + GUELTIG_MS;
  res.setHeader('Set-Cookie',
    `${NAME}=${zeichne(bis)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${GUELTIG_MS / 1000}`
    + (process.env.NODE_ENV === 'production' ? '; Secure' : ''));
  res.json({ ok: true });
}

export function abmelden(_req, res) {
  res.setHeader('Set-Cookie', `${NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
  res.json({ ok: true });
}

/** Alles unter /api/ verlangt die Anmeldung. Die oeffentlichen Routen kennen sie nicht. */
export function schuetzen(req, res, next) {
  if (istAngemeldet(req)) return next();
  res.status(401).json({ fehler: 'Nicht angemeldet.' });
}
