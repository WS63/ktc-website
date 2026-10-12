import { html, raw, escapeAttr, ziel } from './_util.js';

/**
 * Ergebnisse — der Infodienst: die Spiele eines Wochenendes, alle Mannschaften.
 *
 * Er zeigt, was die Route ihm gibt (src/ergebnisse.js), und rechnet nichts.
 * Mannschaften und Ergebnisse, keine Spielernamen.
 *
 * Der Ausgang steht als WORT neben dem Symbol. Ein Farbpunkt allein sagt einem
 * Menschen mit Rot-Gruen-Schwaeche nichts, und ein Vorleser liest ihn gar nicht.
 */
const AUSGANG = { Sieg: ['🟢', 'Sieg'], Unentschieden: ['🟡', 'Remis'], Niederlage: ['🔴', 'Niederlage'] };

export default {
  name: 'ergebnisse',
  label: 'Ergebnisse — holt sich den Spielstand selbst',
  schema: {
    ansicht:  { type: 'auto', default: null, label: 'Die Ansicht — kommt aus dem Spielstand' },
    stand:    { type: 'auto', default: '', label: 'Stand der letzten Abfrage beim Verband' },
    basis:    { type: 'auto', default: '', label: 'Adresse der Seite, für das Blättern' },
    leerText: { type: 'text', default: 'Zurzeit liegen keine Spiele vor.', label: 'Text, wenn nichts da ist' },
  },
  css: `
    .erg__kopf { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--raum-1) var(--raum-3);
      justify-content: space-between; margin-bottom: var(--raum-2); }
    .erg__titel { font-size: clamp(24px, 3vw, 32px); }
    .erg__blaettern { font-size: var(--fs-sm); display: flex; gap: var(--raum-3); }
    .erg__blaettern a { color: var(--signal); text-decoration: none; }
    .erg__blaettern a:hover { text-decoration: underline; }
    .erg__bilanz { font-size: var(--fs-md); margin-bottom: 4px; }
    .erg__bilanz b { font-weight: 700; }
    .erg__stand { font-size: 14px; color: var(--text-leise); margin-bottom: var(--raum-3); }

    /* Gerade gemeldet: das Fenster fuer das, was sich zuletzt getan hat. */
    .erg__zuletzt { background: var(--flaeche); border-radius: var(--radius); padding: var(--raum-2) var(--raum-3);
      margin-bottom: var(--raum-4); }
    .erg__zuletzt h3 { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em;
      color: var(--text-leise); margin-bottom: 6px; }
    .erg__zuletzt li { list-style: none; font-size: 14px; padding: 2px 0; display: flex; gap: var(--raum-2);
      flex-wrap: wrap; align-items: baseline; }
    .erg__zuletzt ul { margin: 0; padding: 0; }
    .erg__wann { color: var(--text-leise); font-size: 14px; min-width: 9.5em; }

    /* Eine Tabelle je Anwurfzeit, aber ALLE mit denselben Spalten: 'table-layout:
       fixed' und feste Breiten rechts. Vorher richtete sich jede Tabelle nach dem
       laengsten Namen in ihr, und die Ergebnisse standen in jedem Block woanders.
       Jetzt stehen Zahl und Ausgang in der Zeitfolge IMMER an derselben Stelle ganz
       rechts — das Auge faehrt senkrecht an ihnen entlang. */
    .erg__slot { margin-top: var(--raum-3); }
    .erg__slot h3 { font-size: 17px; font-weight: 700; letter-spacing: -.01em; margin-bottom: 2px;
      padding-bottom: 5px; border-bottom: 2px solid var(--linie-stark); }
    .erg__tabelle { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 14px; line-height: 1.35; }
    .erg__tabelle td { padding: 4px 10px; vertical-align: baseline; }
    .erg__tabelle tr:nth-child(odd) { background: var(--flaeche); }
    .erg__paar .sie { color: var(--text-leise); }
    .erg__paar .wir { font-weight: 600; }
    .erg__sie { color: var(--text-leise); }
    .erg__wir { font-weight: 600; }

    /* Kriftel steht in JEDER Zeile links, der Gegner in einer eigenen Spalte, Heim oder
       Gast als Blase dazwischen. Beide Kennzeichen sind vier Buchstaben und gleich breit,
       damit die Spalte ruhig bleibt. Die Spaltenbreiten stehen in der colgroup: die erste
       Zeile kann eine ohne Ergebnis sein (zusammengefasste Zellen) und wuerde sie sonst
       falsch vorgeben. */
    .erg__blase { display: inline-block; width: 4.2em; text-align: center; box-sizing: border-box;
      font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
      border-radius: var(--r-pill); padding: 1px 0; border: 1px solid; line-height: 1.4; }
    .erg__blase--heim { color: var(--signal); background: var(--signal-leise); border-color: var(--linie-aktiv); }
    .erg__blase--gast { color: var(--text-leise); background: var(--grund); border-color: var(--linie-stark); }
    .erg__bericht-sp { text-align: right; }
    .erg__bericht { font-size: 13px; white-space: nowrap; }
    .erg__msg { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: .04em;
      color: var(--signal); border: 1px solid var(--linie-aktiv); border-radius: 3px;
      padding: 0 4px; margin-left: 4px; white-space: nowrap; }
    .erg__zahl { font-variant-numeric: tabular-nums; font-weight: 700; text-align: right; }
    .erg__aus { color: var(--text-leise); white-space: nowrap; }
    .erg__offen { color: var(--text-leise); text-align: right; white-space: nowrap; }
    .erg__tabelle a { color: var(--signal); text-decoration: none; }
    .erg__tabelle a:hover { text-decoration: underline; }

    @media (max-width: 640px) {
      .erg__tabelle { table-layout: auto; }
      .erg__tabelle colgroup { display: none; }
      .erg__tabelle, .erg__tabelle tbody, .erg__tabelle tr, .erg__tabelle td { display: block; }
      .erg__tabelle tr { padding: 5px 4px; }
      .erg__tabelle td { padding: 1px 6px; }
      .erg__tabelle td.erg__ort, .erg__tabelle td.erg__sie, .erg__tabelle td.erg__bericht-sp { display: inline-block; }
      .erg__tabelle td.erg__bericht-sp { margin-left: 6px; }
      /* 'td.' davor: die Regel 'tabelle td { display: block }' ist sonst staerker. */
      .erg__tabelle td.erg__zahl, .erg__tabelle td.erg__offen { text-align: left; display: inline-block; }
      .erg__tabelle td.erg__aus { display: inline-block; }
    }
  `,
  render(data) {
    const a = data.ansicht;
    if (!a || a.leer) {
      return html`<section class="section"><div class="container"><p>${data.leerText}</p></div></section>`;
    }
    const basis = ziel(data.basis) || '/ergebnisse/';
    const link = (we, text, pfeil) => we
      ? html`<a href="${raw(escapeAttr(`${basis}?we=${we}`))}">${pfeil === 'z' ? '← ' : ''}${text}${pfeil === 'v' ? ' →' : ''}</a>` : '';

    const paarung = (e) => {
      const wir = html`<span class="wir">${e.mannschaft}</span>${e.sg ? html`<span class="erg__msg" title="Spielgemeinschaft mit Partnervereinen">MSG</span>` : ''}`;
      const sie = html`<span class="sie">${e.gegner}</span>`;
      return e.zuhause ? html`${wir} - ${sie}` : html`${sie} - ${wir}`;
    };

    // Gruppiert nach Tag und Anwurfzeit: wer um 14 Uhr zuschaut, sucht den 14-Uhr-Block.
    const slots = [];
    for (const e of a.eintraege) {
      const schluessel = `${e.tag} ${e.uhrzeit}`;
      let s = slots.at(-1);
      if (!s || s.schluessel !== schluessel) { s = { schluessel, e, zeilen: [] }; slots.push(s); }
      s.zeilen.push(e);
    }

    const b = a.bilanz;
    const zeile = (e) => {
      const [sym, wort] = AUSGANG[e.ausgang] || [];
      // Der Berichtslink hat eine eigene Spalte: er beginnt in jeder Zeile an derselben Stelle.
      const bericht = e.bericht
        ? html`<a class="erg__bericht" href="${raw(escapeAttr(ziel(e.bericht)))}" target="_blank" rel="noopener noreferrer">Bericht ↗</a>` : '';
      return html`<tr>
        <td class="erg__wir">${e.mannschaft}${e.sg ? html`<span class="erg__msg" title="Spielgemeinschaft mit Partnervereinen">MSG</span>` : ''}</td>
        <td class="erg__ort"><span class="erg__blase erg__blase--${e.zuhause ? 'heim' : 'gast'}"
          title="${e.zuhause ? 'Heimspiel' : 'Auswärtsspiel'}">${e.zuhause ? 'Heim' : 'Gast'}</span></td>
        <td class="erg__sie">${e.gegner}</td>
        <td class="erg__bericht-sp">${bericht}</td>
        ${e.status === 'gespielt'
          ? html`<td class="erg__zahl">${e.matchpunkte}</td>
                 <td class="erg__aus"><span aria-hidden="true">${sym}</span> ${wort}</td>`
          : html`<td class="erg__offen" colspan="2">${e.status === 'kommt' ? `${e.uhrzeit} Uhr` : 'Ergebnis steht noch aus'}</td>`}
      </tr>`;
    };

    return html`
      <section class="section"><div class="container">
        <div class="erg__kopf">
          <h2 class="erg__titel">${a.fenster.text} ${a.fenster.jahr}</h2>
          <nav class="erg__blaettern" aria-label="Andere Wochenenden">${link(a.vorher?.we, a.vorher?.text, 'z')}${link(a.nachher?.we, a.nachher?.text, 'v')}</nav>
        </div>
        ${b.begegnungen
          ? html`<p class="erg__bilanz"><b>${b.siege}</b> ${b.siege === 1 ? 'Sieg' : 'Siege'} · <b>${b.unentschieden}</b> Remis ·
              <b>${b.niederlagen}</b> ${b.niederlagen === 1 ? 'Niederlage' : 'Niederlagen'}${
              a.offen ? html` · ${a.offen} noch offen` : ''}</p>` : ''}
        ${data.stand ? html`<p class="erg__stand">Stand: ${data.stand}. Die Ergebnisse stammen vom Hessischen Tennisverband; maßgeblich ist dort der Spielbericht.</p>` : ''}

        ${a.zuletzt.length ? html`<div class="erg__zuletzt"><h3>Gerade gemeldet</h3><ul>${a.zuletzt.map((e) => {
          const [sym, wort] = AUSGANG[e.ausgang] || [];
          return html`<li><span class="erg__wann">${e.wann}</span><span class="erg__paar">${paarung(e)}</span>
            <b>${e.matchpunkte}</b> <span aria-hidden="true">${sym}</span> ${wort}</li>`;
        })}</ul></div>` : ''}

        ${slots.map((s) => html`<div class="erg__slot">
          <h3>${s.e.wochentag}${s.e.uhrzeit ? `, ${s.e.uhrzeit} Uhr` : ''}</h3>
          <table class="erg__tabelle"><colgroup><col style="width:230px"><col style="width:68px"><col><col style="width:88px"><col style="width:56px"><col style="width:112px"></colgroup><tbody>${s.zeilen.map(zeile)}</tbody></table>
        </div>`)}
      </div></section>`;
  },
};
