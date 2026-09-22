import { query } from '../db.js';

/**
 * Suche im Bestand — in JavaScript, nicht in der Datenbank.
 *
 * Warum nicht FTS5: das gibt es nur in SQLite. Postgres braeuchte tsvector,
 * und damit wuesste der Suchcode ploetzlich, welche Datenbank laeuft — genau
 * das, was src/db.js verhindern soll. Bei ein paar hundert Stuecken kostet
 * das Durchrechnen unter eine Millisekunde.
 *
 * Wann das kippt: jenseits von etwa 50.000 Stuecken. Dann ist Postgres mit
 * tsvector oder pgvector dran. Das ist ein Umzug, kein Umbau.
 */

// Woerter, die in jeder Frage stehen und nichts unterscheiden.
const FUELLWOERTER = new Set(['der','die','das','den','dem','des','ein','eine','einen','einem','einer',
  'und','oder','aber','ist','sind','war','waren','hat','habe','haben','wird','werden','kann','koennen',
  'ich','du','er','sie','es','wir','ihr','man','mir','mich','dir','dich','uns','euch',
  'wie','was','wo','wann','wer','warum','wieso','welche','welcher','welches','ob',
  'in','an','auf','bei','mit','von','zu','zur','zum','fuer','ueber','unter','nach','aus','vor','durch',
  'es','gibt','denn','noch','auch','nur','schon','mal','bitte','danke','hallo']);

/** Klein, ohne Umlaute, ohne Satzzeichen — damit „Beiträge" und „beitraege" gleich sind. */
export function normalisieren(s) {
  return String(s).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

const woerter = (s) => normalisieren(s).split(' ')
  .filter((w) => w.length > 2 && !FUELLWOERTER.has(w));

/**
 * Wortstamm, grob: deutsche Endungen abschneiden. Kein Linguistik-Projekt.
 *
 * Die Laengenschwelle ist der Punkt, an dem es sonst kippt: ohne sie wird
 * aus „Bus" der Stamm „bu", der als zu kurz wegfaellt — und die Frage nach
 * der Anfahrt findet nichts mehr. Ein Stamm unter vier Zeichen bringt keine
 * Trennschaerfe, also bleibt das Wort dann lieber, wie es ist.
 */
const ENDUNGEN = /(ungen|erinnen|innen|ungs|ung|heit|keit|isch|lich|bar|ern|end|est|en|er|es|em|et|st|e|s|n)$/;

function stamm(w) {
  if (w.length < 6) return w;                 // kurze Woerter nicht anfassen
  const kurz = w.replace(ENDUNGEN, '');
  return kurz.length >= 4 ? kurz : w;
}

export async function finde(frage, n = 6) {
  const suchworte = woerter(frage);
  if (!suchworte.length) return [];
  const staemme = [...new Set(suchworte.map(stamm))].filter((s) => s.length > 2);

  const stuecke = await query(
    `SELECT c.id, c.page_slug, c.page_titel, c.pfad, c.ueberschrift, c.text,
            c.stichworte, p.page_type
       FROM chunks c LEFT JOIN pages p ON p.slug = c.page_slug`);
  if (!stuecke.length) return [];

  // In wie vielen Stuecken kommt ein Wort vor? Seltene Woerter wiegen mehr —
  // „Mitgliedsbeitrag" unterscheidet, „Tennis" steht auf jeder Seite.
  const haeufigkeit = {};
  const vorbereitet = stuecke.map((s) => {
    const norm = normalisieren(`${s.ueberschrift} ${s.page_titel} ${s.text} ${s.stichworte || ''}`);
    const gesehen = new Set();
    for (const st of staemme) if (norm.includes(st)) gesehen.add(st);
    gesehen.forEach((st) => { haeufigkeit[st] = (haeufigkeit[st] || 0) + 1; });
    return { ...s, norm, gesehen };
  });

  const gesamt = stuecke.length;
  const bewertet = vorbereitet.map((s) => {
    let punkte = 0;
    for (const st of s.gesehen) {
      const selten = Math.log(1 + gesamt / (haeufigkeit[st] || 1));
      // Wie oft, aber gedaempft: zehnmal dasselbe Wort ist nicht zehnmal so gut.
      const anzahl = (s.norm.match(new RegExp(st, 'g')) || []).length;
      punkte += selten * (1 + Math.log(anzahl));
      // In einer Ueberschrift wiegt ein Treffer schwerer als im Fliesstext.
      if (normalisieren(s.ueberschrift).includes(st)) punkte += selten * 0.9;
      if (normalisieren(s.page_titel).includes(st)) punkte += selten * 0.5;
      // Was der Baustein IST, wiegt wie eine Ueberschrift.
      if (normalisieren(s.stichworte || '').includes(st)) punkte += selten * 0.8;
    }
    // Wie viele der gesuchten Woerter kommen ueberhaupt vor?
    const abdeckung = s.gesehen.size / staemme.length;

    // Ein Beitrag von 2026 beantwortet selten eine Sachfrage. Die 14 Beitraege
    // verdraengen sonst die fuenf Seiten, auf denen die Auskuenfte stehen.
    const gewicht = s.page_type === 'beitrag' ? 0.62 : 1;

    return { ...s, punkte: punkte * (0.35 + 0.65 * abdeckung) * gewicht };
  });

  const rang = bewertet
    .filter((s) => s.punkte > 0 && s.gesehen.size > 0)
    .sort((a, b) => b.punkte - a.punkte);
  if (!rang.length) return [];

  /**
   * Erst Seiten bewerten, dann die besten Seiten VOLLSTAENDIG mitgeben.
   *
   * Warum nicht einfach die besten Stuecke: dreimal gemessen, dreimal
   * derselbe Fehlschlag. Auf „Wie komme ich mit oeffentlichen Verkehrsmitteln
   * zu euch?" traf die Seite /kontakt/, aber nicht der Abschnitt „Mit Bus und
   * Bahn" — kein gemeinsames Wort mit der Frage. Eine Seite mit vielen
   * mittelguten Stuecken (/sport/) verdraengte dabei die Seite mit dem einen
   * richtigen (/kontakt/).
   *
   * Die Seite ist die richtige Einheit: wer nach der Anfahrt fragt, will die
   * Seite „Kontakt und Anfahrt", nicht einen Absatz daraus. Bei Seiten dieser
   * Groesse kostet das ein paar hundert Zeichen mehr Zusammenhang und
   * beseitigt die Wortschatz-Luecke innerhalb einer Seite vollstaendig.
   */
  const jeSeite = new Map();
  for (const st of rang) {
    const e = jeSeite.get(st.page_slug)
      || { slug: st.page_slug, beste: 0, summe: 0, anzahl: 0 };
    e.beste = Math.max(e.beste, st.punkte);
    e.summe += st.punkte;
    e.anzahl += 1;
    jeSeite.set(st.page_slug, e);
  }

  // Das beste Stueck zaehlt am meisten; mehrere Treffer auf derselben Seite
  // geben einen Zuschlag, aber keinen, der eine lange Seite gewinnen laesst.
  const seiten = [...jeSeite.values()]
    .map((e) => ({ ...e, punkte: e.beste + 0.25 * (e.summe - e.beste) }))
    .sort((a, b) => b.punkte - a.punkte);

  const ausgabe = [];
  const drin = new Set();

  // Die zwei besten Seiten kommen ganz mit — hoechstens fuenf Stuecke je
  // Seite, sonst erschlaegt eine lange Seite alles andere.
  for (const seite of seiten.slice(0, 2)) {
    const alle = bewertet
      .filter((x) => x.page_slug === seite.slug)
      .sort((a, b) => b.punkte - a.punkte)
      .slice(0, 5);
    for (const st of alle) {
      if (drin.has(st.id)) continue;
      ausgabe.push(st); drin.add(st.id);
    }
  }

  // Der Rest wird mit den besten einzelnen Stuecken anderer Seiten aufgefuellt.
  for (const st of rang) {
    if (ausgabe.length >= n + 6) break;
    if (drin.has(st.id)) continue;
    ausgabe.push(st); drin.add(st.id);
  }

  return ausgabe
    .slice(0, n + 6)
    .map(({ norm, gesehen, page_type, punkte, stichworte, ...rest }) => rest);
}
