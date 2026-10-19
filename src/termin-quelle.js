/**
 * Die Termine des Clubs — eine Quelle, mehrere Ansichten (P3).
 *
 * Vorher standen sie als handgeschriebene Liste im Baustein der Kalenderseite.
 * Ein zweiter Auftritt auf der Startseite haette dieselbe Liste an zwei Orten
 * bedeutet — und eine davon waere beim naechsten Termin vergessen worden.
 * Jetzt liest die Route beide Ansichten aus derselben Datei.
 *
 * Fehlt die Datei oder ist sie kaputt, ist die Liste leer und die Seite
 * steht trotzdem (P6): ein Kalender ohne Eintraege ist eine Seite mit dem
 * Satz 'Zurzeit steht nichts an', kein 500er.
 *
 * Vereinstermine (inhalte/termine.json) und Spieltermine (HTV-Import,
 * inhalte/spielplan/) kommen hier zusammen — Kalender, Startseite und
 * Assistent bekommen dieselbe Liste.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { planAusSpeicher } from './spielstand.js';
import { wochenenden } from './ergebnisse.js';

const DATEI = 'inhalte/termine.json';

export function vereinsTermine() {
  try {
    const liste = JSON.parse(readFileSync(DATEI, 'utf8')).termine;
    return Array.isArray(liste) ? liste : [];
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn(`[Termine] ${DATEI} nicht lesbar: ${err.message}`);
    return [];
  }
}

/**
 * Die Spieltermine aus dem HTV-Import (npm run spielplan).
 *
 * Ein Eintrag je TERMIN, und ein Termin ist Datum UND Uhrzeit: der Samstag
 * um 9 Uhr und der Samstag um 14 Uhr sind zwei Eintraege. Wer um 14 Uhr zum
 * Zuschauen kommen will, soll nicht durch die Spiele vom Vormittag lesen.
 * Bei 29 Mannschaften waere ein Eintrag je Begegnung dagegen ueber 190 Zeilen.
 *
 * Innerhalb eines Termins stehen zuerst die Heimspiele, dann die
 * Auswaertsspiele: wer zuschauen will, sucht die Heimspiele, und die stehen
 * damit oben. Spielgemeinschaften mit Partnervereinen tragen ihre 'sg' mit.
 *
 * Rein: bekommt die Daten, gibt Eintraege zurueck. Das Lesen der Datei steht
 * darunter, damit sich die Gruppierung ohne Dateien testen laesst.
 */
export function spieltageAus(plan) {
  const nachTermin = new Map();
  for (const b of plan?.begegnungen || []) {
    if (!b.datum) continue;
    const schluessel = `${b.datum}|${b.uhrzeit || ''}`;
    if (!nachTermin.has(schluessel)) nachTermin.set(schluessel, []);
    nachTermin.get(schluessel).push(b);
  }
  const zeile = (b) => ({ mannschaft: b.mannschaft, sg: b.sg || '', gegner: b.gegner });
  const nachName = (a, b) => a.mannschaft.localeCompare(b.mannschaft, 'de', { numeric: true });

  return [...nachTermin.values()]
    .map((liste) => {
      const heim = liste.filter((b) => b.zuhause).sort(nachName);
      const aus = liste.filter((b) => !b.zuhause).sort(nachName);
      return {
        datum: liste[0].datum,
        uhrzeit: liste[0].uhrzeit || '',
        art: 'spiel',
        titel: 'Spieltag der HTV-Medenrunde',
        // Gerechnet, nie getippt (P3/P4): die Zahlen kommen aus der Liste.
        text: `${liste.length} ${liste.length === 1 ? 'Begegnung' : 'Begegnungen'}`
          + (heim.length ? `, davon ${heim.length} ${heim.length === 1 ? 'Heimspiel' : 'Heimspiele'} auf unserer Anlage.` : '.'),
        gruppen: [
          ...(heim.length ? [{ titel: 'Heimspiele', zuhause: true, zeilen: heim.map(zeile) }] : []),
          ...(aus.length ? [{ titel: 'Auswärtsspiele', zuhause: false, zeilen: aus.map(zeile) }] : []),
        ],
      };
    })
    .sort((a, b) => (a.datum + a.uhrzeit).localeCompare(b.datum + b.uhrzeit));
}

/**
 * Die Spieltermine fuer den KALENDER: ein Eintrag je Spielwochenende statt eines je
 * Anwurfzeit. Der Kalender soll nicht durch 55 Zeilen fuehren, und die Spiele selbst
 * stehen auf der Ergebnisseite, sortiert und mit Ergebnissen — der Eintrag verweist dorthin.
 *
 * Der Assistent bekommt weiter die Einzelspiele (spieltageAus): er soll wissen, wann die
 * Herren 40 spielen, auch wenn der Kalender das nicht Zeile fuer Zeile zeigt.
 */
export function wochenendTermine(plan) {
  const begegnungen = (plan?.begegnungen || []).filter((b) => b.datum);
  return wochenenden(begegnungen).map((w) => {
    const dabei = begegnungen.filter((b) => b.datum >= w.von && b.datum <= w.bis);
    const heim = dabei.filter((b) => b.zuhause).length;
    return {
      datum: w.von, bis: w.bis, uhrzeit: '', art: 'spiel',
      titel: 'HTV-Medenspieltag',
      // Gerechnet, nie getippt (P3/P4).
      text: `${dabei.length} ${dabei.length === 1 ? 'Begegnung' : 'Begegnungen'}`
        + (heim ? `, davon ${heim} ${heim === 1 ? 'Heimspiel' : 'Heimspiele'} auf unserer Anlage.` : '.'),
      mehr: `/ergebnisse/?we=${w.von}`, mehrLabel: 'Spiele und Ergebnisse',
      // Einzeilig im Kalender: der Titel ist der Link. Zwanzig Spielwochenenden mit je
      // drei Zeilen drueckten die Clubtermine aus dem Blick.
      kompakt: true,
    };
  });
}

const SPIELPLAN_VERZ = 'inhalte/spielplan';

/**
 * Demo-Modus. Zwei Wege hinein: 'npm run dev' startet mit --demo (lokal), und
 * auf dem Server genuegt die Umgebungsvariable SPIELPLAN_DEMO=1 in Coolify —
 * ohne den Start-Befehl anzufassen. Zum Livegang die Variable loeschen.
 *
 * Die Saison 2026 ist vorbei, der Kalender blendet Vergangenes aus — ohne
 * diesen Schalter bliebe er bis zum April leer und niemand koennte sehen, wie
 * die Spieltage aussehen. Im Demo-Modus werden die Termine um ganze Jahre
 * nach vorn geschoben, bis sie in der Zukunft liegen. Der Betrieb ('npm
 * start') kennt den Schalter nicht, und sobald der Plan wieder aktuell ist,
 * schiebt er von selbst nichts mehr. Die Seite SAGT es: der Hinweis unter dem
 * Kalender nennt die Verschiebung, sonst fuehre jemand zu einem Spiel, das
 * es nicht gibt.
 */
export const DEMO_AN = process.argv.includes('--demo') || process.env.SPIELPLAN_DEMO === '1';
const DEMO = DEMO_AN;

/**
 * Verschoben wird in Schritten von 52 Wochen (364 Tagen), nicht um Kalenderjahre:
 * dann bleibt jeder Termin auf seinem Wochentag. Um ein Jahr verschoben wurde aus
 * dem Spielwochenende Fr–So ein Sa–Mo, und Medenspiele am Montag sehen in jeder
 * Vorfuehrung nach einem Fehler aus. 'jahre' zaehlt die Schritte.
 */
export function jahreVerschieben(plan, heute = new Date()) {
  const spaeteste = (plan.begegnungen || []).map((b) => b.datum).filter(Boolean).sort().pop();
  if (!spaeteste) return { plan, jahre: 0 };
  heute = new Date(heute); heute.setHours(0, 0, 0, 0);
  let jahre = 0;
  const verschoben = (d, n) => {
    const [j, m, t] = d.split('-').map(Number);
    return new Date(Date.UTC(j, m - 1, t + 364 * n)).toISOString().slice(0, 10);
  };
  while (new Date(`${verschoben(spaeteste, jahre)}T00:00:00`) < heute) jahre++;
  if (jahre === 0) return { plan, jahre: 0 };
  return { jahre, plan: { ...plan, begegnungen: plan.begegnungen.map((b) => (
    b.datum ? { ...b, datum: verschoben(b.datum, jahre) } : b)) } };
}

/** Die juengste Spielplan-Datei; fehlt sie, gibt es keine Spieltermine (P6). */
function spielplan({ echt = false } = {}) {
  try {
    // Erst der Spielstand aus der Datenbank (vom Server nach Zeitplan aufgefrischt),
    // dann die Jahresdatei: ohne Datenbank — Tests, ein frischer Checkout — bleibt
    // es wie vorher.
    let plan = planAusSpeicher();
    if (!plan) {
      if (!existsSync(SPIELPLAN_VERZ)) return { plan: null, jahre: 0 };
      const datei = readdirSync(SPIELPLAN_VERZ).filter((f) => f.endsWith('.json')).sort().pop();
      if (!datei) return { plan: null, jahre: 0 };
      plan = JSON.parse(readFileSync(`${SPIELPLAN_VERZ}/${datei}`, 'utf8'));
    }
    return DEMO && !echt ? jahreVerschieben(plan) : { plan, jahre: 0 };
  } catch (err) {
    console.warn(`[Termine] Spielplan nicht lesbar: ${err.message}`);
    return { plan: null, jahre: 0 };
  }
}

/**
 * Der Satz unter dem Kalender: woher die Spieltermine stammen, wie alt sie
 * sind — und, im Demo-Modus, dass sie nicht echt sind. Eine Kopie ist ab der
 * ersten Verlegung moeglicherweise falsch; deshalb steht der Stand sichtbar
 * da, und der Verband bleibt die massgebliche Quelle.
 */
export function spielplanHinweis() {
  const { plan, jahre } = spielplan();
  const d = plan?.stand ? new Date(plan.stand) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  const stand = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  if (jahre > 0) {
    return `DEMO: Die Spieltermine der Saison ${plan.saison} sind um ${jahre * 52} Wochen`
      + ` verschoben, damit der Kalender etwas zeigt. Es sind keine echten Termine.`;
  }
  return `Spieltermine vom HTV, Stand ${stand}. Verlegungen stehen erst nach dem nächsten Abruf hier`
    + ' — maßgeblich ist immer der Spielplan beim Verband.';
}

/** Alles, was im Kalender stehen soll — vor dem Aussortieren abgelaufener. */
/**
 * @param echt  true = nie verschieben. Der Assistent bekommt IMMER die echten
 *              Daten: er soll einem Mitglied nicht ein Spiel am 8. Mai 2027
 *              nennen, das es nicht gibt, nur weil die Vorschau Demodaten zeigt.
 */
/**
 * Die echten Begegnungen, nie verschoben — fuer das Kalender-Abo. Ein Demo-Termin
 * in einem fremden Kalender waere nicht mehr zurueckzuholen.
 */
export const echterSpielplan = () => spielplan({ echt: true }).plan;

export const alleTermine = ({ echt = false } = {}) =>
  [...vereinsTermine(), ...spieltageAus(spielplan({ echt }).plan)];

/**
 * Was der KALENDER und die Startseite zeigen: Vereinstermine und je Spielwochenende ein
 * Eintrag. Die Einzelspiele (alleTermine) bleiben dem Assistenten.
 */
export const kalenderTermine = () => [...vereinsTermine(), ...wochenendTermine(spielplan().plan)];

/** Heute 0:00 — ein Termin von heute Abend ist noch nicht vorbei. */
function heuteNull() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const MONATE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONATSNAMEN = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September',
  'Oktober', 'November', 'Dezember'];
const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const teile = (datum) => (/^\d{4}-\d{2}-\d{2}$/.test(datum || '')
  ? { j: datum.slice(2, 4), m: Number(datum.slice(5, 7)) - 1, t: Number(datum.slice(8)),
      w: WOCHENTAGE[new Date(`${datum}T12:00:00Z`).getUTCDay()] }
  : null);

/**
 * Das Datum kurz und mit Jahr: "17. Apr ’27", bei mehreren Tagen "9.–10. Mai ’26".
 * Fertiger Text, damit der Baustein kein Datum formatieren muss und frei von Gebietsschema
 * bleibt (P1). Ein ungueltiges Datum kommt unveraendert zurueck.
 */
export function tagText(datum, bis = '') {
  const a = teile(datum);
  if (!a) return datum || '';
  const b = bis && bis !== datum ? teile(bis) : null;
  if (!b) return `${a.t}. ${MONATE[a.m]} ’${a.j}`;
  if (a.m === b.m && a.j === b.j) return `${a.t}.–${b.t}. ${MONATE[a.m]} ’${a.j}`;
  return `${a.t}. ${MONATE[a.m]}${a.j === b.j ? '' : ` ’${a.j}`}–${b.t}. ${MONATE[b.m]} ’${b.j}`;
}

/** "Oktober ’26": die Ueberschrift, unter der ein Termin steht. */
export const monatText = (datum) => {
  const a = teile(datum);
  return a ? `${MONATSNAMEN[a.m]} ’${a.j}` : '';
};

/** Wochentag, kurz: "Sa", bei mehreren Tagen "Fr–So". */
export const wochentagText = (datum, bis = '') => {
  const a = teile(datum);
  if (!a) return '';
  const b = bis && bis !== datum ? teile(bis) : null;
  return b ? `${a.w}–${b.w}` : a.w;
};

const mitText = (t) => ({
  ...t,
  tag: tagText(t.datum, t.bis), wochentag: wochentagText(t.datum, t.bis), monat: monatText(t.datum),
});

const ende = (t) => new Date(`${t.bis || t.datum}T00:00:00`);
const schluessel = (t) => `${t.datum}${t.uhrzeit || ''}`;

/**
 * Die Termine, die noch kommen — aelteste zuerst.
 *
 * Das Datum steht als JJJJ-MM-TT in den Daten. Ein Termin ohne gueltiges
 * Datum bleibt drin: lieber ein Eintrag zu viel als einer, der stumm
 * verschwindet, weil jemand sich vertippt hat. Ein mehrtaegiger Termin
 * gilt bis zu seinem LETZTEN Tag.
 */
export function kuenftige(termine) {
  const schwelle = heuteNull();
  return termine
    .filter((t) => { const d = ende(t); return Number.isNaN(d.getTime()) || d >= schwelle; })
    .sort((a, b) => schluessel(a).localeCompare(schluessel(b)))
    .map(mitText);
}

/** Die Termine, die vorbei sind — juengste zuerst. Ein ungueltiges Datum zaehlt nie als vorbei. */
export function vergangene(termine) {
  const schwelle = heuteNull();
  return termine
    .filter((t) => { const d = ende(t); return !Number.isNaN(d.getTime()) && d < schwelle; })
    .sort((a, b) => schluessel(b).localeCompare(schluessel(a)))
    .map(mitText);
}
