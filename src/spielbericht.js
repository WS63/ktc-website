/**
 * Spielberichte aus den Ergebnissen eines Spielwochenendes (Schritt C).
 *
 * Die Arbeitsteilung ist der Kern, und sie folgt P3:
 *
 *   CODE rechnet:    welche Begegnungen, wer gewonnen hat, die Bilanz, die
 *                    Ergebnistabelle. Das sind Zahlen — sie duerfen nicht
 *                    vom Modell kommen, nicht einmal 'ungefaehr'.
 *   MODELL schreibt: den Bericht. Zwei bis vier Absaetze aus dem, was der
 *                    Code ihm vorlegt.
 *
 * Die Tabelle am Ende des Beitrags ist deshalb NIE Modellausgabe. Und eine
 * letzte Pruefung vergleicht jedes 'a:b' im Text mit dem Rohmaterial: steht
 * ein Ergebnis im Bericht, das es nicht gab, wird es gemeldet (unbelegteErgebnisse).
 *
 * Alles hier ist rein — Daten hinein, Daten heraus. Das Lesen der Dateien, der
 * Aufruf des Modells und das Speichern stehen in scripts/spielbericht.js.
 */

const TAG = 24 * 60 * 60 * 1000;

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const zuDatum = (s) => new Date(`${s}T12:00:00`);
const lang = (s) => zuDatum(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
const wochentag = (s) => zuDatum(s).toLocaleDateString('de-DE', { weekday: 'long' });

/** '5:1' → { heim: 5, gast: 1 }. Alles andere: null. */
function punkte(b) {
  const m = /^(\d+):(\d+)$/.exec(String(b.matchpunkte || ''));
  return m ? { heim: Number(m[1]), gast: Number(m[2]) } : null;
}

/**
 * Das Ergebnis aus Sicht des KTC.
 *
 * Der HTV nennt es Heim:Gast. Wer aber 2:4 liest und nicht weiss, ob wir
 * zuhause waren, kann Sieg und Niederlage verwechseln — und genau diese
 * Verwechslung darf im Bericht nie passieren. Deshalb hier einmal sauber:
 * 'wir' sind immer vorn.
 */
export function ergebnis(b) {
  const p = punkte(b);
  if (!p) return null;
  const wir = b.zuhause ? p.heim : p.gast;
  const sie = b.zuhause ? p.gast : p.heim;
  return { wir, sie, ausgang: wir > sie ? 'Sieg' : wir < sie ? 'Niederlage' : 'Unentschieden' };
}

/** Alle GESPIELTEN Begegnungen zwischen zwei Tagen, einschliesslich beider. */
export function spielwochenende(plan, von, bis) {
  return (plan?.begegnungen || [])
    .filter((b) => b.gespielt && b.datum >= von && b.datum <= bis && ergebnis(b))
    .sort((a, b) => (a.datum + a.uhrzeit).localeCompare(b.datum + b.uhrzeit)
      || a.mannschaft.localeCompare(b.mannschaft, 'de', { numeric: true }));
}

/**
 * Das juengste Spielwochenende: der letzte Tag mit Ergebnissen und die zwei
 * Tage davor. Drei Tage, weil ein Spielwochenende Freitag bis Sonntag laeuft —
 * wer ein anderes meint, nennt die Tage selbst.
 */
export function letztesWochenende(plan) {
  const tage = (plan?.begegnungen || []).filter((b) => b.gespielt && b.datum).map((b) => b.datum).sort();
  const bis = tage.pop();
  if (!bis) return null;
  return { von: iso(new Date(zuDatum(bis).getTime() - 2 * TAG)), bis };
}

/** Siege, Unentschieden, Niederlagen — gerechnet, nie vom Modell geschaetzt. */
export function bilanz(liste) {
  const z = { begegnungen: liste.length, siege: 0, unentschieden: 0, niederlagen: 0 };
  for (const b of liste) {
    const a = ergebnis(b).ausgang;
    if (a === 'Sieg') z.siege++; else if (a === 'Niederlage') z.niederlagen++; else z.unentschieden++;
  }
  return z;
}

const mehrzahl = (n, ein, mehr) => `${n} ${n === 1 ? ein : mehr}`;

/** '14 Begegnungen — 9 Siege, 2 Unentschieden, 3 Niederlagen', mit richtiger Mehrzahl. */
export function bilanzText(b) {
  return `${mehrzahl(b.begegnungen, 'Begegnung', 'Begegnungen')} — ${mehrzahl(b.siege, 'Sieg', 'Siege')}, `
    + `${b.unentschieden} Unentschieden, ${mehrzahl(b.niederlagen, 'Niederlage', 'Niederlagen')}`;
}

const mannschaftsname = (b) => (b.sg ? `${b.mannschaft} (Spielgemeinschaft ${b.sg})` : b.mannschaft);

/** Der Zeitraum als Satzteil: '8. bis 10. Mai 2026' oder '30. Mai bis 1. Juni 2026'. */
export function zeitraumText(von, bis) {
  if (von === bis) return lang(von);
  const a = zuDatum(von), b = zuDatum(bis);
  const monat = (d) => d.toLocaleDateString('de-DE', { month: 'long' });
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
    ? `${a.getDate()}. bis ${lang(bis)}`
    : `${a.getDate()}. ${monat(a)} bis ${lang(bis)}`;
}

/**
 * Das Rohmaterial fuer das Modell. Jede Zahl, die im Bericht stehen darf,
 * steht hier — und nur hier.
 */
export function rohmaterial(liste, von, bis) {
  const b = bilanz(liste);
  const zeilen = liste.map((x) => {
    const e = ergebnis(x);
    return `- ${wochentag(x.datum)}, ${x.uhrzeit ? x.uhrzeit + ' Uhr, ' : ''}${mannschaftsname(x)}: `
      + (x.zuhause ? 'Heimspiel gegen ' : 'Auswärtsspiel bei ') + x.gegner
      + ` — Ergebnis ${e.wir}:${e.sie} aus Sicht des KTC (${e.ausgang})`;
  });
  return `SPIELWOCHENENDE ${zeitraumText(von, bis)} — Medenrunde des Hessischen Tennisverbands (HTV)

BILANZ (gerechnet): ${bilanzText(b)}.

ALLE ERGEBNISSE (Matchpunkte, immer zuerst die Punkte des KTC):
${zeilen.join('\n')}

HINWEISE ZUM MATERIAL:
- Es liegen nur die Gesamtergebnisse vor, keine Einzel- und Doppelergebnisse und keine Spielernamen.
- 'Spielgemeinschaft' heißt: die Mannschaft spielt gemeinsam mit Partnervereinen.
`;
}

/** Was das Modell zusätzlich zum Rohmaterial wissen muss. */
export function anweisung(von, bis) {
  return `Schreibe einen Spielbericht über das Spielwochenende ${zeitraumText(von, bis)} für die Vereinsseite.

- Nur richtext-Bausteine, zwei bis vier Absätze, insgesamt höchstens 220 Wörter. KEINE Tabelle und KEINE Liste aller Ergebnisse: die Ergebnistabelle ergänzt das System selbst aus den Daten.
- Nenne die Gesamtbilanz genau so, wie sie im Rohmaterial steht.
- Hebe zwei bis drei Begegnungen hervor: den klarsten Sieg, das knappste Ergebnis, eine Spielgemeinschaft. Ergebnisse als "a:b", genau wie im Rohmaterial und aus Sicht des KTC.
- Nichts dazuerfinden: kein Wetter, keine Stimmung, keine Zuschauer, keine Spielernamen, keine Satzergebnisse. Was nicht im Rohmaterial steht, steht nicht im Bericht.
- Eine Niederlage wird nicht schöngeredet und nicht dramatisiert. Sachlich, mit der Wärme eines Vereins.
- Jugendmannschaften nennst du mit ihrem Mannschaftsnamen, wie im Rohmaterial.`;
}

/**
 * Jedes 'a:b' im Text muss aus dem Rohmaterial stammen.
 *
 * Die Ergebnisse stehen dort aus Sicht des KTC; im Bericht darf ein Modell sie
 * auch umdrehen ('der Gegner gewann 4:2'). Beide Richtungen zaehlen als belegt.
 * Alles andere ist ein Ergebnis, das es nicht gab, und wird gemeldet.
 */
export function unbelegteErgebnisse(text, roh) {
  const belegt = new Set();
  for (const [, a, b] of String(roh).matchAll(/(\d+):(\d+)/g)) { belegt.add(`${a}:${b}`); belegt.add(`${b}:${a}`); }
  const gefunden = [...String(text).matchAll(/\b(\d+):(\d+)\b/g)].map((m) => m[0]);
  return [...new Set(gefunden.filter((g) => !belegt.has(g)))];
}

/** Die Ergebnistabelle als Baustein-Daten. Aus den Daten gebaut, nie vom Modell. */
export function ergebnisTabelle(liste, stand) {
  return {
    titel: 'Alle Ergebnisse',
    kopf: ['Tag', 'Mannschaft', 'Begegnung', 'Ergebnis', 'Bericht'],
    zeilen: liste.map((b) => {
      const e = ergebnis(b);
      const heim = b.zuhause ? mannschaftsname(b) : b.gegner;
      const gast = b.zuhause ? b.gegner : mannschaftsname(b);
      return [
        zuDatum(b.datum).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' }),
        b.mannschaft,
        `${heim} - ${gast}`,
        // Aus Sicht des Verbands (Heim:Gast), weil die Begegnung daneben genauso steht.
        `${b.matchpunkte} (${e.ausgang})`,
        b.bericht ? { text: 'Spielbericht', href: b.bericht } : '',
      ];
    }),
    hinweis: `Ergebnisse vom Hessischen Tennisverband${stand ? `, Stand ${stand}` : ''}. Maßgeblich ist immer der Verband.`,
  };
}
