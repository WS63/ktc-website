/**
 * Das Kalender-Abo: drei Arten von .ics-Dateien, die ein Kalender auf Handy oder
 * Computer abonniert und selbst auffrischt.
 *
 *   /kalender/club.ics                 Vereinstermine (inhalte/termine.json)
 *   /kalender/heimspiele.ics           Heimspiele auf unserer Anlage, je Anwurfzeit gebuendelt
 *   /kalender/mannschaft/<name>.ics    eine Mannschaft, jede Begegnung einzeln
 *
 * Kein "Alles"-Abo: zweihundert Termine im Kalender kuendigt man nach einer Woche.
 *
 * Rein: bekommt Daten, gibt Text zurueck. Woher die Daten kommen, entscheidet die
 * Route (src/routes/public.js) — dort steht auch, dass es IMMER die echten sind und
 * nie die verschobenen aus dem Demo-Modus.
 *
 * ── Zeiten ──────────────────────────────────────────────────────────────
 * Ortszeit mit TZID=Europe/Berlin, nicht UTC. Ein Camp, das taeglich um 9 Uhr
 * beginnt und ueber die Zeitumstellung im Oktober laeuft, beginnt auch danach um
 * 9 Uhr — in UTC gerechnet sprang es um eine Stunde.
 *
 * Medenspiele dauern laut facts.kalender.dauer_wettkampf_stunden (der HTV nennt
 * nur den Anfang). Vereinstermine haben KEINE Standarddauer:
 *
 *   nur datum                          ganztaegig
 *   datum + bis                        mehrtaegig, ganztaegig
 *   uhrzeit                            nur die Startzeit (Putztag, Versammlung)
 *   uhrzeit + ende                     feste Zeitspanne
 *   datum + bis + uhrzeit (+ ende)     taeglich wiederholt bis 'bis' (Trainingscamp)
 */
import { createHash } from 'node:crypto';
import { ergebnis } from './spielbericht.js';
import { sgArt } from './ergebnisse.js';

/**
 * Derselbe Schluessel wie spielstand.schluessel() — hier nachgebaut statt importiert:
 * spielstand.js laedt db.js, und db.js entscheidet BEIM IMPORT, welche Datenbank
 * laeuft. Dieses Modul haengt an src/seiten.js und damit am Seed; es darf keine
 * Datenbank anfassen. tests/kalender-abo.test.js haelt fest, dass beide gleich bleiben.
 */
export const begegnungsSchluessel = (saison, b) => `${saison}|${b.gruppe}|${b.heim}|${b.gast}|${b.lauf || 1}`;

const ZONE = 'Europe/Berlin';
const UHR = /^([01]\d|2[0-3]):[0-5]\d$/;
const TAG = /^\d{4}-\d{2}-\d{2}$/;

/** 'Herren 40 II' → 'herren-40-ii'. Die Adresse eines Mannschafts-Abos. */
export function slugVon(name) {
  return String(name || '').toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c]))
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Format (RFC 5545) ──────────────────────────────────────────────────

/** Text maskieren: Backslash, Semikolon, Komma, Zeilenumbruch. */
const txt = (s) => String(s ?? '')
  .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/**
 * Eine Zeile hoechstens 75 Byte, Fortsetzungen beginnen mit einem Leerzeichen.
 * In BYTE gezaehlt, nicht in Zeichen — ein 'ü' sind zwei — und nie mitten in
 * einem Zeichen getrennt.
 */
export function falten(zeile) {
  if (Buffer.byteLength(zeile) <= 75) return zeile;
  const teile = [];
  let akt = '', laenge = 0, grenze = 75;
  for (const z of zeile) {
    const n = Buffer.byteLength(z);
    if (laenge + n > grenze) { teile.push(akt); akt = ''; laenge = 0; grenze = 74; }
    akt += z; laenge += n;
  }
  teile.push(akt);
  return teile.join('\r\n ');
}

const kompakt = (datum) => datum.replace(/-/g, '');
const ortszeit = (datum, uhrzeit) => `${kompakt(datum)}T${uhrzeit.replace(':', '')}00`;

/** Kalendertag plus n Tage, auf dem Kalender gerechnet. */
function tagPlus(datum, n) {
  const [j, m, t] = datum.split('-').map(Number);
  return new Date(Date.UTC(j, m - 1, t + n)).toISOString().slice(0, 10);
}

/** Datum und Uhrzeit plus h Stunden, als Wanduhr gerechnet (ueber Mitternacht hinweg). */
function plusStunden(datum, uhrzeit, h) {
  const [j, m, t] = datum.split('-').map(Number);
  const [st, mi] = uhrzeit.split(':').map(Number);
  const d = new Date(Date.UTC(j, m - 1, t, st + h, mi));
  return { datum: d.toISOString().slice(0, 10), uhrzeit: d.toISOString().slice(11, 16) };
}

const utcStempel = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const kurzHash = (s) => createHash('sha256').update(String(s)).digest('hex').slice(0, 20);

/** Die Zeitzone einmal beschrieben, damit jeder Kalender die Ortszeit richtig liest. */
const VTIMEZONE = [
  'BEGIN:VTIMEZONE', `TZID:${ZONE}`,
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST',
  'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET',
  'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

/**
 * Ein Ereignis in Zeilen.
 * @param e { uid, titel, text, ort, url, datum, uhrzeit?, ende?: {datum, uhrzeit}, bis?, taeglichBis? }
 */
function vevent(e, stempel) {
  const z = ['BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${stempel}`];
  if (!e.uhrzeit) {
    // Ganztaegig: DTEND ist der Tag NACH dem letzten, so will es die Norm.
    z.push(`DTSTART;VALUE=DATE:${kompakt(e.datum)}`, `DTEND;VALUE=DATE:${kompakt(tagPlus(e.bis || e.datum, 1))}`);
  } else {
    z.push(`DTSTART;TZID=${ZONE}:${ortszeit(e.datum, e.uhrzeit)}`);
    if (e.ende) z.push(`DTEND;TZID=${ZONE}:${ortszeit(e.ende.datum, e.ende.uhrzeit)}`);
    // Ohne DTEND hat der Termin nur einen Anfang — gewollt, wo niemand das Ende kennt.
    if (e.taeglichBis) z.push(`RRULE:FREQ=DAILY;UNTIL=${kompakt(e.taeglichBis)}T235959Z`);
  }
  z.push(`SUMMARY:${txt(e.titel)}`);
  if (e.text) z.push(`DESCRIPTION:${txt(e.text)}`);
  if (e.ort) z.push(`LOCATION:${txt(e.ort)}`);
  if (e.url) z.push(`URL:${e.url}`);
  z.push('END:VEVENT');
  return z;
}

/**
 * Der ganze Kalender als Text, mit CRLF.
 * REFRESH-INTERVAL bittet die App, alle sechs Stunden nachzusehen. Ob sie es
 * tut, entscheidet sie: Apple haelt sich daran, Google oft nur einmal am Tag.
 */
export function kalenderText({ name, beschreibung = '', ereignisse, jetzt = new Date() }) {
  const stempel = utcStempel(jetzt);
  const zeilen = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Krifteler Tennis-Club//Website//DE',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${txt(name)}`, `X-WR-TIMEZONE:${ZONE}`,
    ...(beschreibung ? [`X-WR-CALDESC:${txt(beschreibung)}`] : []),
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H',
    ...VTIMEZONE,
    ...ereignisse.flatMap((e) => vevent(e, stempel)),
    'END:VCALENDAR',
  ];
  return zeilen.map(falten).join('\r\n') + '\r\n';
}

// ── Vereinstermine ─────────────────────────────────────────────────────

const absolut = (href, basis) => (/^https:\/\//.test(href || '') ? href
  : /^\/(?!\/)/.test(href || '') ? `${basis}${href}` : '');

/** Aus inhalte/termine.json die Ereignisse — mit genau der Dauer, die dort steht. */
export function vereinsEreignisse(termine, { basis = '' } = {}) {
  return (termine || []).filter((t) => TAG.test(t?.datum || '') && t.titel).map((t) => {
    const uhrzeit = UHR.test(t.uhrzeit || '') ? t.uhrzeit : '';
    const ende = uhrzeit && UHR.test(t.ende || '') ? t.ende : '';
    const bis = TAG.test(t.bis || '') && t.bis > t.datum ? t.bis : '';
    const url = absolut(t.mehr, basis);
    const e = {
      uid: `verein-${kurzHash(`${t.datum}|${t.titel}`)}@tennisclub-kriftel`,
      titel: t.titel, ort: t.ort || '', url,
      text: [t.text, url ? `${t.mehrLabel || 'Mehr dazu'}: ${url}` : ''].filter(Boolean).join('\n\n'),
      datum: t.datum,
    };
    if (!uhrzeit) return { ...e, bis };
    // Ein Ende vor dem Anfang (22:00 bis 01:00) liegt am naechsten Tag.
    const endeAm = ende ? { datum: ende > uhrzeit ? t.datum : tagPlus(t.datum, 1), uhrzeit: ende } : null;
    return { ...e, uhrzeit, ...(endeAm ? { ende: endeAm } : {}), ...(bis ? { taeglichBis: bis } : {}) };
  });
}

// ── Medenspiele ────────────────────────────────────────────────────────

/** Spielt die Begegnung auf UNSERER Anlage? Heimspiele einer Partner-SG finden dort statt. */
const beiUns = (b) => b.zuhause && sgArt(b.sg) !== 'partner';

const mitDauer = (b, stunden) => (UHR.test(b.uhrzeit || '')
  ? { uhrzeit: b.uhrzeit, ...(stunden ? { ende: plusStunden(b.datum, b.uhrzeit, stunden) } : {}) }
  : {});

const HINWEIS_DAUER = 'Das Ende ist geschätzt, der Verband nennt nur die Anfangszeit. Maßgeblich ist der Spielplan beim HTV.';

/** Die Saison einer Begegnung: aus der Datenbank je Zeile, aus der Jahresdatei fuer alle. */
const saisonVon = (plan, b) => String(b.saison || plan?.saison || '');

/** Alle Mannschaftsnamen, die im Spielstand vorkommen — auch aufgeloeste aus frueheren Saisons. */
export const mannschaftenImPlan = (plan) => [...new Set((plan?.begegnungen || []).map((b) => b.mannschaft).filter(Boolean))];

/**
 * Eine Mannschaft: jede Begegnung einzeln, nach dem Spiel mit Ergebnis im Titel.
 *
 * @param saison  leer = alle Saisons (Erwachsene: dieselben Leute ueber Jahre, das Abo
 *                laeuft weiter). Gesetzt = nur diese (Jugend: die Mannschaft gibt es so
 *                nur ein Jahr — ein altes Abo zeigt nie die Spiele fremder Kinder).
 */
export function mannschaftsEreignisse(plan, name, { stunden = null, anschrift = '', saison: nur = '' } = {}) {
  return (plan?.begegnungen || [])
    .filter((b) => b.mannschaft === name && TAG.test(b.datum || '') && (!nur || saisonVon(plan, b) === String(nur)))
    .map((b) => {
      const saison = saisonVon(plan, b);
      const e = b.gespielt ? ergebnis(b) : null;
      const titel = e ? `${name} · ${e.wir}:${e.sie} gegen ${b.gegner}`
        : b.zuhause ? `${name} · Heimspiel gegen ${b.gegner}`
        : `${name} · Auswärts bei ${b.gegner}`;
      const text = [
        `${b.heim} – ${b.gast}`,
        b.sg ? `Spielgemeinschaft ${b.sg}` : '',
        e ? `Ergebnis ${b.matchpunkte} (${e.ausgang})` : '',
        stunden && b.uhrzeit ? HINWEIS_DAUER : '',
        b.bericht ? `Spielbericht: ${b.bericht}` : '',
      ].filter(Boolean).join('\n');
      return {
        // Fest ueber die ganze Saison, auch wenn das Spiel verlegt wird: der Schluessel
        // kennt Gruppe, Heim, Gast und Runde, aber kein Datum.
        uid: `spiel-${kurzHash(b.id || begegnungsSchluessel(saison, b))}@tennisclub-kriftel`,
        titel, text, ort: beiUns(b) ? anschrift : '', url: b.bericht || '',
        datum: b.datum, ...mitDauer(b, stunden),
      };
    });
}

/**
 * Heimspiele auf unserer Anlage, ein Termin je Datum und Anwurfzeit — wer zuschauen
 * will, braucht nicht jede Begegnung als eigenen Eintrag.
 */
export function heimspielEreignisse(plan, { stunden = null, anschrift = '' } = {}) {
  const gruppen = new Map();
  for (const b of plan?.begegnungen || []) {
    if (!beiUns(b) || !TAG.test(b.datum || '')) continue;
    const k = `${b.datum}|${b.uhrzeit || ''}`;
    if (!gruppen.has(k)) gruppen.set(k, []);
    gruppen.get(k).push(b);
  }
  return [...gruppen.entries()].sort(([a], [z]) => a.localeCompare(z)).map(([k, liste]) => {
    liste.sort((a, b) => a.mannschaft.localeCompare(b.mannschaft, 'de', { numeric: true }));
    const namen = liste.map((b) => b.mannschaft);
    const titel = namen.length <= 3 ? `Heimspiel: ${namen.join(', ')}` : `Heimspiele: ${namen.length} Mannschaften`;
    const zeilen = liste.map((b) => {
      const e = b.gespielt ? ergebnis(b) : null;
      return `${b.mannschaft} gegen ${b.gegner}${e ? ` · ${e.wir}:${e.sie} (${e.ausgang})` : ''}`;
    });
    return {
      uid: `heim-${kurzHash(k)}@tennisclub-kriftel`,
      titel, ort: anschrift,
      text: [...zeilen, '', stunden && liste[0].uhrzeit ? HINWEIS_DAUER : ''].join('\n').trim(),
      datum: liste[0].datum, ...mitDauer(liste[0], stunden),
    };
  });
}
