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
    .erg__bilanz { font-size: var(--fs-md); margin-bottom: var(--raum-1); }
    .erg__bilanz b { font-weight: 700; }
    .erg__stand { font-size: 14px; color: var(--text-leise); margin-bottom: var(--raum-4); }

    /* Gerade gemeldet: das Fenster fuer das, was sich zuletzt getan hat. */
    .erg__zuletzt { background: var(--flaeche); border-radius: var(--radius); padding: var(--raum-2) var(--raum-3);
      margin-bottom: var(--raum-4); }
    .erg__zuletzt h3 { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em;
      color: var(--text-leise); margin-bottom: 6px; }
    .erg__zuletzt li { list-style: none; font-size: var(--fs-sm); padding: 3px 0; display: flex; gap: var(--raum-2);
      flex-wrap: wrap; align-items: baseline; }
    .erg__zuletzt ul { margin: 0; padding: 0; }
    .erg__wann { color: var(--text-leise); font-size: 14px; min-width: 9.5em; }

    .erg__slot { margin-top: var(--raum-4); }
    .erg__slot h3 { font-size: var(--fs-md); font-weight: 600; margin-bottom: 4px;
      padding-bottom: 6px; border-bottom: 1px solid var(--linie); }
    .erg__tabelle { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
    .erg__tabelle td { padding: 9px var(--raum-1); vertical-align: baseline; }
    .erg__tabelle tr:nth-child(odd) { background: var(--flaeche); }
    .erg__team { font-weight: 600; white-space: nowrap; }
    .erg__paar .sie { color: var(--text-leise); }
    .erg__paar .wir { font-weight: 600; }
    .erg__msg { display: inline-block; font-size: 12px; font-weight: 600; letter-spacing: .04em;
      color: var(--signal); border: 1px solid var(--linie-aktiv); border-radius: 3px;
      padding: 0 5px; margin-left: 4px; white-space: nowrap; }
    .erg__zahl { font-variant-numeric: tabular-nums; font-weight: 700; white-space: nowrap; text-align: right; }
    .erg__aus { white-space: nowrap; color: var(--text-leise); font-size: 14px; }
    .erg__offen { color: var(--text-leise); font-size: 14px; text-align: right; white-space: nowrap; }
    .erg__tabelle a { color: var(--signal); text-decoration: none; font-size: 14px; }

    @media (max-width: 640px) {
      .erg__tabelle, .erg__tabelle tbody, .erg__tabelle tr, .erg__tabelle td { display: block; }
      .erg__tabelle tr { padding: 8px var(--raum-1); }
      .erg__tabelle td { padding: 1px 0; }
      .erg__zahl, .erg__offen { text-align: left; }
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
      return html`<tr>
        <td class="erg__paar">${paarung(e)}</td>
        ${e.status === 'gespielt'
          ? html`<td class="erg__zahl">${e.matchpunkte}</td>
                 <td class="erg__aus"><span aria-hidden="true">${sym}</span> ${wort}</td>`
          : html`<td class="erg__offen" colspan="2">${e.status === 'kommt' ? `${e.uhrzeit} Uhr` : 'Ergebnis steht noch aus'}</td>`}
        <td>${e.bericht ? html`<a href="${raw(escapeAttr(ziel(e.bericht)))}" target="_blank" rel="noopener noreferrer">Bericht ↗</a>` : ''}</td>
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
          <table class="erg__tabelle"><tbody>${s.zeilen.map(zeile)}</tbody></table>
        </div>`)}
      </div></section>`;
  },
};
