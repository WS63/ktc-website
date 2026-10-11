/**
 * Zeit in Berliner Ortszeit — unabhaengig davon, wo der Server steht.
 *
 * Ein Spiel beginnt 'um 9 Uhr' in Kriftel. Der Container auf dem Server laeuft
 * aber in UTC: wer dort `new Date('2026-05-09T09:00:00')` schreibt, meint 9 Uhr
 * UTC, also 11 Uhr in Kriftel. Fuer die Abfragezeiten (8, 16, 24 Stunden nach
 * Spielbeginn) waere das zwei Stunden daneben, im Winter eine. Deshalb hier
 * einmal sauber, mit der Zeitzone und ihrer Sommerzeit-Regel.
 */
const ZONE = 'Europe/Berlin';

const teile = (epoch) => {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
  return Object.fromEntries(f.formatToParts(epoch).map((p) => [p.type, Number(p.value)]));
};

/** Um wie viele Millisekunden Berlin zu diesem Zeitpunkt vor UTC liegt (3,6 oder 7,2 Mio.). */
function versatz(epoch) {
  const p = teile(epoch);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(epoch / 1000) * 1000;
}

/** '2026-05-09', '09:00' in Berliner Zeit → Millisekunden seit 1970 (UTC). */
export function berlinEpoch(datum, uhrzeit = '00:00') {
  const [j, m, t] = String(datum).split('-').map(Number);
  const [h, mi] = String(uhrzeit || '00:00').split(':').map(Number);
  if (![j, m, t, h, mi].every(Number.isFinite)) return NaN;
  const roh = Date.UTC(j, m - 1, t, h, mi);
  // Zweimal, weil der Versatz selbst vom Zeitpunkt abhaengt (Umstellung im Maerz/Oktober).
  const v1 = versatz(roh - versatz(roh));
  return roh - v1;
}

/** Der Kalendertag in Berlin, 'JJJJ-MM-TT'. */
export function berlinTag(epoch = Date.now()) {
  const p = teile(epoch);
  const z = (n) => String(n).padStart(2, '0');
  return `${p.year}-${z(p.month)}-${z(p.day)}`;
}

/** Tag plus n Tage, 'JJJJ-MM-TT' (gerechnet auf dem Kalender, nicht in Stunden). */
export function tagPlus(datum, n) {
  const [j, m, t] = datum.split('-').map(Number);
  const d = new Date(Date.UTC(j, m - 1, t + n));
  const z = (x) => String(x).padStart(2, '0');
  return `${d.getUTCFullYear()}-${z(d.getUTCMonth() + 1)}-${z(d.getUTCDate())}`;
}

/** Uhrzeit in Berlin, 'HH:MM'. */
export function berlinUhr(epoch) {
  const p = teile(epoch);
  const z = (n) => String(n).padStart(2, '0');
  return `${z(p.hour)}:${z(p.minute)}`;
}

/** 'Heute, 14:05' / 'Gestern, 22:10' / '8. Mai, 09:30' — fuer die Anzeige. */
export function berlinWann(epoch, jetzt = Date.now()) {
  const tag = berlinTag(epoch), heute = berlinTag(jetzt);
  if (tag === heute) return `Heute, ${berlinUhr(epoch)} Uhr`;
  if (tag === tagPlus(heute, -1)) return `Gestern, ${berlinUhr(epoch)} Uhr`;
  const [j, m, t] = tag.split('-').map(Number);
  const monat = new Date(Date.UTC(j, m - 1, t)).toLocaleDateString('de-DE', { month: 'long', timeZone: 'UTC' });
  return `${t}. ${monat}, ${berlinUhr(epoch)} Uhr`;
}
