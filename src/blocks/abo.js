import { html, raw, escapeAttr } from './_util.js';

/**
 * Das Kalender-Abo: drei Zuschnitte als Karten, "Deine Mannschaft" vorn.
 *
 * Die Wege fuehren ueber /kalender/abo/… (src/routes/public.js), das auf webcal:
 * oder Google Kalender weiterleitet. Die Mannschaft waehlt ein schlichtes
 * GET-Formular — kein Skript, keine Ausnahme in der Content-Security-Policy.
 * Zwei Knoepfe statt einem, weil Android-Handys webcal: nicht oeffnen.
 *
 * Kein Gelb: der gelbe Knopf gehoert 'Mitglied werden'. Die Knoepfe hier sind
 * leise, die Karte der Mannschaft traegt die Akzentkante.
 */
export default {
  name: 'abo',
  label: 'Kalender-Abo',
  schema: {
    eyebrow:  { type: 'text', default: 'Kalender-Abo', label: 'Kleine Zeile darüber' },
    titel:    { type: 'text', default: '', label: 'Überschrift' },
    vorspann: { type: 'longtext', default: '', label: 'Text darunter' },
    mannschaften: { type: 'liste', default: [],
                    label: 'Mannschaften zur Auswahl: name, slug, gruppe (Erwachsene oder Jugend)' },
    hinweis:  { type: 'longtext', default: '', label: 'Kleingedrucktes unter den Karten' },
  },
  css: `
    .abo__kopf { max-width: var(--breite-text); margin-bottom: var(--raum-4); }
    .abo__eyebrow { font-size: var(--fs-xs); font-weight: 600; letter-spacing: .1em;
      text-transform: uppercase; color: var(--signal); margin: 0 0 var(--raum-1); }
    .abo__titel { font-size: var(--fs-2xl); font-weight: 500; line-height: 1.2;
      letter-spacing: -.015em; margin: 0 0 var(--raum-2); }
    .abo__vorspann { color: var(--text-leise); margin: 0; }

    /* Die Mannschaft ist der haeufigste Wunsch: sie bekommt die breitere Spalte. */
    .abo__gitter { display: grid; gap: var(--raum-3); grid-template-columns: 1.35fr 1fr 1fr;
      align-items: stretch; }
    @media (max-width: 900px) { .abo__gitter { grid-template-columns: 1fr; } }

    .abo__karte { display: flex; flex-direction: column; gap: var(--raum-1);
      background: var(--karte); border: 1px solid var(--linie); border-radius: var(--r-lg);
      padding: var(--raum-3); transition: transform var(--t-schnell) var(--ease),
      border-color var(--t-schnell) var(--ease); }
    .abo__karte:hover { transform: translateY(-2px); border-color: var(--linie-aktiv); }
    .abo__karte--vorn { border-left: 3px solid var(--signal); }
    .abo__zeichen { width: 40px; height: 40px; color: var(--signal); margin-bottom: var(--raum-1); }
    .abo__fuer { font-size: var(--fs-xs); letter-spacing: .08em; text-transform: uppercase;
      color: var(--text-leise); margin: 0; }
    .abo__karte h3 { font-size: var(--fs-xl); font-weight: 500; line-height: 1.2; margin: 0; }
    .abo__karte p.abo__text { font-size: var(--fs-sm); color: var(--text-leise); line-height: 1.6;
      margin: 0 0 var(--raum-2); }

    /* Die Wege stehen am Fuss jeder Karte, auf derselben Hoehe. */
    .abo__wege { display: flex; flex-wrap: wrap; gap: var(--raum-1); margin-top: auto; }
    .abo__weg { display: inline-flex; align-items: center; justify-content: center; min-height: 44px;
      padding: 0 18px; font: inherit; font-size: var(--fs-sm); line-height: 1.2; cursor: pointer;
      text-decoration: none; color: var(--signal); background: transparent;
      border: 1px solid var(--signal); border-radius: var(--radius-knopf);
      transition: background var(--t-schnell) var(--ease), transform var(--t-schnell) var(--ease); }
    .abo__weg:hover { background: var(--signal-leise); transform: translateY(-1px); }
    .abo__weg:focus-visible { outline: 2px solid var(--signal); outline-offset: 3px; }

    .abo__form { display: flex; flex-direction: column; gap: var(--raum-1); margin-top: auto; }
    .abo__form label { font-size: var(--fs-xs); letter-spacing: .08em; text-transform: uppercase;
      color: var(--text-leise); }
    .abo__form select { font: inherit; font-size: var(--fs-sm); color: var(--text); min-height: 44px;
      padding: 0 12px; background: var(--erhoben); border: 1px solid var(--linie);
      border-radius: var(--r-md); max-width: 100%; }
    .abo__form select:focus-visible { outline: 2px solid var(--signal); outline-offset: 3px; }

    /* So geht's: drei Nummernkreise (design-prinzipien.md, Abschnitt 9). */
    .abo__schritte { list-style: none; display: grid; grid-template-columns: repeat(3, 1fr);
      gap: var(--raum-3); margin: var(--raum-4) 0 0; padding: 0; }
    @media (max-width: 640px) { .abo__schritte { grid-template-columns: 1fr; gap: var(--raum-2); } }
    .abo__schritte li { display: flex; align-items: center; gap: var(--raum-2);
      font-size: var(--fs-sm); color: var(--text-leise); }
    .abo__nr { flex: none; display: grid; place-items: center; width: 36px; height: 36px;
      border-radius: var(--r-pill); background: var(--karte); border: 1px solid var(--linie);
      color: var(--text); font-weight: 600; }
    .abo__schritte b { color: var(--text); font-weight: 500; }
    .abo__klein { font-size: var(--fs-sm); color: var(--text-leise); margin: var(--raum-3) 0 0;
      max-width: var(--breite-text); }
  `,
  render(data) {
    const gruppen = ['Erwachsene', 'Jugend'].map((g) => ({
      g, liste: (data.mannschaften || []).filter((m) => m?.slug && m.gruppe === g) }))
      .filter((x) => x.liste.length);

    const wege = (feed) => html`<div class="abo__wege">
        <a class="abo__weg" href="/kalender/abo/${raw(escapeAttr(feed))}/">iPhone, Mac, Outlook</a>
        <a class="abo__weg" href="/kalender/abo/${raw(escapeAttr(feed))}/?google=1">Google Kalender</a>
      </div>`;

    const karte = ({ zeichen, fuer, titel, text, unten, vorn = false }) => html`
      <article class="abo__karte${raw(vorn ? ' abo__karte--vorn' : '')}">
        ${raw(zeichen)}
        <p class="abo__fuer">${fuer}</p>
        <h3>${titel}</h3>
        <p class="abo__text">${text}</p>
        ${unten}
      </article>`;

    const mannschaft = gruppen.length ? karte({
      vorn: true, zeichen: ZEICHEN.team, fuer: 'Für Spielerinnen und Spieler', titel: 'Deine Mannschaft',
      text: 'Jedes Spiel mit Gegner und Anwurfzeit. Nach dem Spiel steht das Ergebnis im Termin.',
      unten: html`<form class="abo__form" method="get" action="/kalender/abo/">
          <label for="abo-mannschaft">Mannschaft</label>
          <select id="abo-mannschaft" name="mannschaft" required>
            <option value="">Bitte wählen …</option>
            ${gruppen.map(({ g, liste }) => html`<optgroup label="${raw(escapeAttr(g))}">${
              liste.map((m) => html`<option value="${raw(escapeAttr(m.slug))}">${m.name}</option>`)}</optgroup>`)}
          </select>
          <div class="abo__wege">
            <button class="abo__weg" type="submit" name="weg" value="apple">iPhone, Mac, Outlook</button>
            <button class="abo__weg" type="submit" name="weg" value="google">Google Kalender</button>
          </div>
        </form>`,
    }) : '';

    return html`
      <section class="section section--ruhig abo" id="abo"><div class="container">
        <div class="abo__kopf">
          ${data.eyebrow ? html`<p class="abo__eyebrow">${data.eyebrow}</p>` : ''}
          ${data.titel ? html`<h2 class="abo__titel">${data.titel}</h2>` : ''}
          ${data.vorspann ? html`<p class="abo__vorspann">${data.vorspann}</p>` : ''}
        </div>
        <div class="abo__gitter">
          ${mannschaft}
          ${karte({ zeichen: ZEICHEN.ball, fuer: 'Zum Zuschauen', titel: 'Heimspiele',
            text: 'Alle Medenspiele auf unserer Anlage, je Anwurfzeit ein Termin mit allen Begegnungen.',
            unten: wege('heimspiele') })}
          ${karte({ zeichen: ZEICHEN.club, fuer: 'Für alle Mitglieder', titel: 'Clubleben',
            text: 'Feste, Arbeitseinsätze, Camps und Versammlungen. Was der Verein plant.',
            unten: wege('club') })}
        </div>
        <ol class="abo__schritte">
          <li><span class="abo__nr" aria-hidden="true">1</span><span><b>Auswählen</b>, was du sehen willst</span></li>
          <li><span class="abo__nr" aria-hidden="true">2</span><span>Im Kalender <b>Abonnieren</b> bestätigen</span></li>
          <li><span class="abo__nr" aria-hidden="true">3</span><span><b>Fertig.</b> Änderungen kommen von selbst</span></li>
        </ol>
        ${data.hinweis ? html`<p class="abo__klein">${data.hinweis}</p>` : ''}
      </div></section>`;
  },
};

// Outline-Zeichen, 1,75 px, in der Textfarbe der Karte (design-prinzipien.md, Abschnitt 7).
const svg = (innen) => `<svg class="abo__zeichen" viewBox="0 0 40 40" fill="none" stroke="currentColor"
  stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${innen}</svg>`;
const ZEICHEN = {
  // Zwei Koepfe: ein Team.
  team: svg('<circle cx="15" cy="14" r="5"/><circle cx="27" cy="16" r="4"/>'
    + '<path d="M6 32c0-5 4-9 9-9s9 4 9 9"/><path d="M24 24.5c1-.3 2-.5 3-.5 4 0 7 3 7 7.5"/>'),
  // Ein Tennisball mit seiner Naht.
  ball: svg('<circle cx="20" cy="20" r="13"/><path d="M9.5 12.5c4 2.5 6 6 6 7.5s-2 5-6 7.5"/>'
    + '<path d="M30.5 12.5c-4 2.5-6 6-6 7.5s2 5 6 7.5"/>'),
  // Ein Kalenderblatt.
  club: svg('<rect x="7" y="9" width="26" height="24" rx="3"/><path d="M7 16h26"/>'
    + '<path d="M14 6v6M26 6v6"/><path d="M13 22h4M23 22h4M13 27h4"/>'),
};
