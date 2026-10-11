import crypto from 'node:crypto';

/**
 * Passwort-Anmeldung mit Cookie. KEINE Zugangsdaten im Code — nur in der Umgebung.
 *
 * Das Cookie traegt eine Signatur, damit niemand sich eine Sitzung basteln kann.
 * Fehlt ADMIN_PASSWORT, ist das Cockpit geschlossen statt offen: lieber
 * unbenutzbar als ungeschuetzt oeffentlich.
 *
 * ZWEI Rollen, je ein Passwort:
 *   admin      ADMIN_PASSWORT       alles
 *   redaktion  REDAKTION_PASSWORT   Beitraege, Medien und der Ergebnisdienst —
 *                                   sonst nichts (Pressewartin, ausgewaehlte Personen)
 * Die Rolle steht SIGNIERT im Cookie: wer das Cookie aendert, hat eine
 * ungueltige Signatur und gar keine. Das Anmeldeformular bleibt ein einziges
 * Feld — welche Rolle jemand bekommt, entscheidet das Passwort.
 */
const PASSWORT = process.env.ADMIN_PASSWORT || '';
const REDAKTION = process.env.REDAKTION_PASSWORT || '';
const GEHEIM = process.env.SESSION_GEHEIMNIS || crypto.randomBytes(32).toString('hex');
const GUELTIG_MS = 1000 * 60 * 60 * 12;
const NAME = 'ktc_sitzung';

const zeichne = (bis, rolle) =>
  `${bis}.${rolle}.${crypto.createHmac('sha256', GEHEIM).update(`${bis}.${rolle}`).digest('hex')}`;

/** Die Rolle aus einem Cookie — oder null, wenn es abgelaufen oder gefaelscht ist. */
function rolleAus(keks) {
  if (!keks) return null;
  const [bis, rolle, sig] = String(keks).split('.');
  if (!bis || !rolle || !sig || !['admin', 'redaktion'].includes(rolle)) return null;
  if (Number(bis) < Date.now()) return null;
  const soll = zeichne(Number(bis), rolle).split('.')[2];
  return sig.length === soll.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(soll))
    ? rolle : null;
}

const keksLesen = (req) => Object.fromEntries(
  (req.headers.cookie || '').split(';').map((t) => {
    const i = t.indexOf('=');
    return i < 0 ? ['', ''] : [t.slice(0, i).trim(), decodeURIComponent(t.slice(i + 1))];
  }))[NAME];

/** 'admin', 'redaktion' oder null. */
export const rolle = (req) => rolleAus(keksLesen(req));
export const istAngemeldet = (req) => rolle(req) !== null;
export const istAdmin = (req) => rolle(req) === 'admin';

const gleich = (a, b) => crypto.timingSafeEqual(
  crypto.createHash('sha256').update(a).digest(), crypto.createHash('sha256').update(b).digest());

export function anmelden(req, res) {
  const eingabe = String(req.body?.passwort || '');
  if (!PASSWORT) {
    return res.status(503).json({ fehler: 'ADMIN_PASSWORT ist nicht gesetzt. Trag es in die .env ein.' });
  }
  // Beide Vergleiche IMMER ausfuehren: sonst verraet die Laufzeit, ob es das
  // Redaktions-Passwort ueberhaupt gibt. Der Administrator gewinnt bei Gleichheit.
  const istAdminPw = gleich(eingabe, PASSWORT);
  const istRedaktionPw = REDAKTION ? gleich(eingabe, REDAKTION) : false;
  const wer = istAdminPw ? 'admin' : istRedaktionPw ? 'redaktion' : null;
  if (!wer) return res.status(401).json({ fehler: 'Passwort stimmt nicht.' });

  const bis = Date.now() + GUELTIG_MS;
  res.setHeader('Set-Cookie',
    `${NAME}=${zeichne(bis, wer)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${GUELTIG_MS / 1000}`
    + (process.env.NODE_ENV === 'production' ? '; Secure' : ''));
  res.json({ ok: true, rolle: wer });
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

/**
 * Was die Redaktion darf. Alles andere ist dem Administrator vorbehalten —
 * die Voreinstellung ist 'nein', und eine neue Route ist damit von selbst
 * gesperrt, bis jemand sie bewusst hier einreiht.
 *
 * Seiten werden zusaetzlich in den Routen selbst geprueft: die Redaktion darf
 * nur BEITRAEGE lesen und schreiben, keine Startseite und kein Impressum.
 */
const REDAKTION_DARF = [
  ['GET', /^\/(schema|arten)$/],
  ['GET', /^\/pages(\/[\w-]+)?$/], ['POST', /^\/pages$/], ['PUT', /^\/pages\/[\w-]+$/],
  ['GET', /^\/media$/], ['POST', /^\/media$/], ['PUT', /^\/media\/[\w-]+$/],
  ['GET', /^\/redaktion\/.*$/], ['POST', /^\/redaktion\/.*$/],
];
export function nurErlaubtes(req, res, next) {
  if (istAdmin(req)) return next();
  if (REDAKTION_DARF.some(([m, p]) => m === req.method && p.test(req.path))) return next();
  res.status(403).json({ fehler: 'Dafür fehlt dir die Berechtigung.' });
}
