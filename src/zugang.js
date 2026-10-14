/**
 * Zugangsschutz fuer die ganze Website: Name und Passwort, bevor irgendetwas
 * zu sehen ist.
 *
 * Gedacht fuer die Zeit, in der die Seite auf dem Server steht, aber noch
 * nicht oeffentlich sein soll — der Verein schaut sich den Entwurf an, die
 * Suchmaschine und der Zufallsbesucher nicht. Das ist etwas anderes als
 * 'suchmaschinen: false' in config/site.json: das sagt Google nur 'bitte
 * nicht aufnehmen', es sperrt niemanden aus.
 *
 * Eingeschaltet wird es allein ueber zwei Umgebungsvariablen, USER_NAME und
 * USER_PASSWORD. Fehlt eine, ist der Schutz AUS — lokal laeuft alles wie
 * bisher, und beim Livegang genuegt es, die beiden Werte zu loeschen. Beide
 * stehen in der Coolify-Oberflaeche, nie im Quelltext.
 *
 * Es ist HTTP-Basic-Authentifizierung, bewusst nichts Eigenes: der Browser
 * kennt sie, merkt sich die Eingabe fuer die Sitzung und schickt sie bei
 * jedem Aufruf mit — auch bei den Bildern und beim Assistenten.
 *
 * Nicht geschuetzt ist nur /health: Coolify fragt dort ohne Zugangsdaten, ob
 * der Server lebt. Dort steht kein Inhalt.
 */
import { createHash, timingSafeEqual } from 'node:crypto';

const hash = (s) => createHash('sha256').update(String(s)).digest();

/** Vergleich in gleicher Zeit, egal wie viele Zeichen stimmen. */
const gleich = (a, b) => timingSafeEqual(hash(a), hash(b));

/** 'Basic dXNlcjpwdw==' → { name, passwort } oder null. */
export function zugangsdaten(kopf) {
  const m = /^Basic\s+(\S+)$/i.exec(String(kopf || ''));
  if (!m) return null;
  const klar = Buffer.from(m[1], 'base64').toString('utf8');
  const i = klar.indexOf(':');             // das Passwort darf selbst Doppelpunkte enthalten
  return i < 0 ? null : { name: klar.slice(0, i), passwort: klar.slice(i + 1) };
}

/**
 * @returns eine Express-Middleware — oder null, wenn der Schutz aus ist.
 */
export function zugangsschutz({ name, passwort, ausnahmen = ['/health'] } = {}) {
  if (!name || !passwort) return null;

  return (req, res, next) => {
    if (ausnahmen.includes(req.path)) return next();

    const z = zugangsdaten(req.headers.authorization);
    // Beide Vergleiche IMMER ausfuehren: sonst verraet die Antwortzeit, ob
    // wenigstens der Name gestimmt hat.
    const nameOk = gleich(z?.name ?? '', name);
    const passwortOk = gleich(z?.passwort ?? '', passwort);
    if (z && nameOk && passwortOk) return next();

    // Eine kurze Pause bremst das Durchprobieren, ohne einen Menschen zu
    // stoeren, der sich einmal vertippt hat.
    setTimeout(() => {
      res.status(401)
        .set('WWW-Authenticate', 'Basic realm="Krifteler Tennis-Club (Vorschau)", charset="UTF-8"')
        // Nie zwischenspeichern: sonst bliebe die Sperrseite im Browser, auch
        // nachdem jemand das richtige Passwort kennt.
        .set('Cache-Control', 'no-store')
        .type('text/plain; charset=utf-8')
        .send('Diese Website ist noch nicht öffentlich. Bitte Name und Passwort eingeben.');
    }, z ? 400 : 0);
  };
}
