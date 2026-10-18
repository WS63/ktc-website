/**
 * Sicherheits-Kopfzeilen fuer jede Antwort.
 *
 * Die Website laedt nichts von fremden Servern — keine Schriften, keine Karten,
 * kein Zaehler. Die Content-Security-Policy schreibt das fest: was nicht von
 * hier kommt, fuehrt der Browser nicht aus. Damit ist auch ein Text, der doch
 * einmal als HTML in die Seite rutscht, ohne Wirkung.
 *
 * Inline-Skripte gibt es genau drei (Assistent, Formular, Eckdaten). Sie sind
 * feste Zeichenketten und werden ueber ihren SHA-256-Wert erlaubt, nicht ueber
 * 'unsafe-inline'. Jeder Baustein meldet seine Skripte unter `skripte` — wer ein
 * neues Inline-Skript einbaut und es dort nicht meldet, merkt es am Test
 * (tests/sicherheit.test.js) und nicht erst im Browser.
 *
 * Stile bleiben 'unsafe-inline': der Aufmacher schreibt Variablen und
 * Keyframes ins Markup, und jede Seite traegt ihr CSS im <style>. Ein Stil kann
 * nichts ausfuehren.
 */
import { createHash } from 'node:crypto';
import { blocks } from './blocks/index.js';

const hash = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

/** Die Hashes aller Inline-Skripte, die ein Baustein ausliefern kann. */
export function skriptHashes() {
  return [...new Set(Object.values(blocks).flatMap((b) => b.skripte || []).map(hash))];
}

export function inhaltsrichtlinie() {
  return [
    "default-src 'self'",
    `script-src 'self' ${skriptHashes().join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

/** Express-Middleware. Die Richtlinie wird einmal beim Start gebaut. */
export function sicherheitsKoepfe() {
  const csp = inhaltsrichtlinie();
  return (req, res, next) => {
    res.set({
      'Content-Security-Policy': csp,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    });
    // HSTS nur ueber HTTPS: lokal auf http://localhost wuerde der Browser es
    // ignorieren, und hinter Coolify sagt req.secure dank 'trust proxy' die
    // Wahrheit. Ohne includeSubDomains — die Domain gehoert nicht nur uns.
    if (req.secure) res.set('Strict-Transport-Security', 'max-age=31536000');
    next();
  };
}
