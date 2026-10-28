import { html, raw, escapeAttr, ziel, markdownInline } from './_util.js';

export default {
  name: 'formular',
  // Fuer die Content-Security-Policy (src/sicherheit.js), siehe assistent.js.
  get skripte() { return [SKRIPT]; },
  label: 'Formular',
  schema: {
    name:     { type: 'text',  default: 'anfrage', label: 'Name des Formulars' },
    titel:    { type: 'text',  default: '', label: 'Überschrift' },
    vorspann: { type: 'longtext', default: '', label: 'Text darueber' },
    felder:   { type: 'liste', default: [], label: 'Felder: name, label, typ, pflicht' },
    knopf:    { type: 'text',  default: 'Absenden', label: 'Beschriftung des Knopfs' },
    danke:    { type: 'text',  default: 'Danke, wir melden uns.', label: 'Text nach dem Absenden' },
    grund:    { type: 'auswahl', default: 'weiss', label: 'Hintergrund', optionen: ['weiss', 'ruhig'] },
    aufbau:   { type: 'auswahl', default: 'einfach', label: 'Aufbau', optionen: ['einfach', 'zweispaltig', 'kompakt'] },
    mailLabel:   { type: 'text', default: '', label: 'Zweispaltig: Zeile über der Adresse' },
    mailAdresse: { type: 'text', default: '', label: 'Zweispaltig: E-Mail-Adresse, groß neben dem Formular' },
    knopfStil:   { type: 'auswahl', default: 'gelb', label: 'Knopf', optionen: ['gelb', 'leise'] },
    kontakte:    { type: 'liste', default: [], label: 'Kompakt: Zeilen unter dem Text, je: label, text, href (Anschrift, Telefon, E-Mail)' },
  },
  css: `
    .formular { max-width: 46rem; }
    .formular__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: 10px; }
    .formular__vorspann { color: var(--text-leise); margin-bottom: var(--raum-3); }
    .feld { margin-bottom: var(--raum-2); }
    .feld label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; }
    .feld input, .feld textarea {
      width: 100%; font: inherit; font-size: 16px; color: var(--text);
      padding: 11px 14px; border: 1px solid var(--linie); border-radius: var(--radius);
      background: var(--grund); }
    .feld input:focus, .feld textarea:focus { border-color: var(--signal); outline: none;
      box-shadow: 0 0 0 3px var(--signal-leise); }
    .feld textarea { min-height: 130px; resize: vertical; }
    .formular__topf { position: absolute; left: -9999px; width: 1px; height: 1px; }
    .formular__fuss { display: flex; gap: var(--raum-3); align-items: center;
      flex-wrap: wrap; margin-top: var(--raum-3); }
    .formular button { font: inherit; font-size: 16px; font-weight: 500; cursor: pointer;
      border: none; padding: 14px 30px; border-radius: var(--radius-knopf);
      background: var(--handlung); color: var(--handlung-text); }
    .formular button:hover { background: var(--handlung-hover); }
    /* Ist der gelbe Knopf der Seite schon vergeben (Aufmacher), bekommt das Formular den leisen. */
    .formular button.formular__knopf--leise { background: transparent; color: var(--signal);
      border: 1px solid var(--signal); padding: 13px 28px; font-weight: 400; }
    .formular button.formular__knopf--leise:hover { background: var(--signal-leise); }
    .formular button[disabled] { opacity: .5; cursor: default; }
    .formular__hinweis { font-size: 14px; color: var(--text-leise); }
    .formular__hinweis a { color: var(--signal); }
    /* Zweispaltig, offen: zwei gleich breite Haelften mit einer feinen Linie dazwischen. Links die
       Einladung und die Adresse, rechts das Formular ohne Kasten — die Felder sind nur Linien,
       wie auf einem Briefbogen. Nichts rahmt das Formular ein, es traegt durch seine Ordnung. */
    .formular__zwei { display: grid; gap: var(--raum-5); align-items: start;
      grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr); }
    .formular__linie { background: var(--linie-stark); align-self: stretch; }
    .formular__zwei .formular__titel { font-size: clamp(30px, 4vw, 44px); font-weight: 600;
      letter-spacing: -.02em; margin-bottom: var(--raum-2); }
    .formular__zwei .formular__vorspann { font-size: var(--fs-md); margin-bottom: var(--raum-4); }
    .formular__mail-label { font-size: 14px; color: var(--text-leise); margin: 0 0 4px; }
    .formular__mail { font-size: clamp(20px, 2.4vw, 26px); font-weight: 600; color: var(--signal);
      text-decoration: none; overflow-wrap: anywhere; border-bottom: 2px solid transparent; }
    .formular__mail:hover { border-bottom-color: var(--signal); }
    .formular--offen { max-width: none; margin: 0; }
    /* Der Datenschutzhinweis steht in zwei Zeilen NEBEN dem Knopf, nicht darunter. */
    .formular--offen .formular__fuss { flex-wrap: nowrap; align-items: center; gap: var(--raum-3); }
    .formular--offen .formular__fuss button { flex: none; }
    .formular--offen .formular__hinweis { flex: 1; min-width: 0; margin: 0; font-size: 14px; line-height: 1.45; }
    @media (max-width: 560px) { .formular--offen .formular__fuss { flex-wrap: wrap; } }
    .formular--offen .feld { margin-bottom: var(--raum-3); }
    .formular--offen .feld label { font-size: 12px; font-weight: 500; letter-spacing: .06em;
      text-transform: uppercase; color: var(--text-leise); margin-bottom: 0; }
    .formular--offen .feld input, .formular--offen .feld textarea { background: transparent;
      border: none; border-bottom: 1.5px solid var(--linie-stark); border-radius: 0;
      padding: 8px 0; box-shadow: none; }
    .formular--offen .feld textarea { min-height: 96px; }
    .formular--offen .feld input:focus, .formular--offen .feld textarea:focus {
      border-bottom-color: var(--signal); box-shadow: 0 1px 0 0 var(--signal); }
    /* Kompakt: links die Frage in kleiner Schrift, rechts das Formular im offenen Stil. Name und E-Mail stehen
       nebeneinander, die Nachricht ist kurz, Knopf und Datenschutzhinweis in einer Zeile. Etwa ein Drittel der
       Hoehe des einfachen Aufbaus. */
    .section--kompakt { padding: var(--raum-5) 0; }
    .formular__kompakt { display: grid; gap: var(--raum-5); align-items: start;
      grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); }
    .formular__kompakt .formular__titel { font-size: clamp(22px, 2.4vw, 28px); margin-bottom: 6px; }
    .formular__kompakt .formular__vorspann { font-size: var(--fs-sm); margin: 0; }
    .formular__kontakte { list-style: none; margin: var(--raum-3) 0 0; padding: 0; display: grid; gap: 6px; }
    .formular__kontakte li { display: flex; gap: var(--raum-2); align-items: baseline; font-size: var(--fs-sm); }
    .formular__kontakt-label { flex: none; width: 6.4em; font-size: 12px; font-weight: 500; letter-spacing: .06em;
      text-transform: uppercase; color: var(--text-leise); }
    .formular__kontakte a { color: var(--signal); font-weight: 500; overflow-wrap: anywhere; text-decoration: none;
      border-bottom: 1px solid transparent; }
    .formular__kontakte a:hover { border-bottom-color: var(--signal); }
    .formular--kompakt { display: grid; grid-template-columns: 1fr 1fr; column-gap: var(--raum-4); align-items: end; }
    .formular--kompakt .feld { margin-bottom: var(--raum-2); }
    .formular--kompakt .feld--breit, .formular--kompakt .formular__fuss, .formular--kompakt .formular__antwort,
    .formular--kompakt .formular__topf { grid-column: 1 / -1; }
    .formular--kompakt .feld textarea { min-height: 64px; }
    .formular--kompakt .formular__fuss { margin-top: var(--raum-1); }
    .formular--kompakt button { padding: 11px 24px; }
    @media (max-width: 860px) {
      .formular__zwei { grid-template-columns: 1fr; gap: var(--raum-4); }
      .formular__linie { display: none; }
      .formular__kompakt { grid-template-columns: 1fr; gap: var(--raum-3); }
    }
    @media (max-width: 520px) { .formular--kompakt { grid-template-columns: 1fr; } }
    .formular__antwort { margin-top: var(--raum-2); font-size: 16px; }
    /* Nach dem Absenden: die Felder verschwinden, die Bestaetigung steht allein da, gross und mit Haken. Vorher stand
       sie klein unter dem Knopf und ging neben den leeren Feldern unter. */
    .formular--fertig .feld, .formular--fertig .formular__fuss, .formular--fertig .formular__topf { display: none; }
    .formular--fertig .formular__antwort { margin: 0; padding: var(--raum-3); font-size: var(--fs-md); font-weight: 600;
      line-height: 1.4; background: var(--signal-leise); border-left: 4px solid var(--bestaetigt); border-radius: var(--radius);
      color: var(--text); }
    .formular--fertig .formular__antwort::before { content: '✓'; display: inline-block; margin-right: 12px;
      color: var(--bestaetigt); font-weight: 800; }
    .formular button.formular__neu { margin-top: var(--raum-2); background: transparent; color: var(--signal);
      border: 1px solid var(--signal); padding: 11px 24px; font-weight: 400; }
    .formular button.formular__neu:hover { background: var(--signal-leise); }
    .formular--kompakt .formular__neu { grid-column: 1 / -1; justify-self: start; }
    .formular__antwort[data-art="ok"] { color: var(--bestaetigt); }
    .formular__antwort[data-art="fehler"] { color: var(--warnung); }
  `,
  render(data) {
    const felder = (data.felder || []).map((f) => {
      const id = `f-${data.name}-${f.name}`;
      const pflicht = f.pflicht ? raw(' required') : '';
      const steuer = f.typ === 'mehrzeilig'
        ? html`<textarea id="${raw(escapeAttr(id))}" name="${raw(escapeAttr(f.name))}"${pflicht}></textarea>`
        : html`<input id="${raw(escapeAttr(id))}" name="${raw(escapeAttr(f.name))}"
                 type="${raw(escapeAttr(['email', 'tel'].includes(f.typ) ? f.typ : 'text'))}"${pflicht}>`;
      return html`<div class="feld${raw(f.typ === 'mehrzeilig' ? ' feld--breit' : '')}">
        <label for="${raw(escapeAttr(id))}">${f.label}${f.pflicht ? ' *' : ''}</label>${steuer}
      </div>`;
    });

    const knopf = html`<button type="submit"${data.knopfStil === 'leise' ? raw(' class="formular__knopf--leise"') : ''}>${data.knopf}</button>`;
    const fuss = html`${felder}
          <div class="formular__topf" aria-hidden="true">
            <label for="website-${raw(escapeAttr(data.name))}">Bitte frei lassen</label>
            <input id="website-${raw(escapeAttr(data.name))}" name="website" tabindex="-1" autocomplete="off">
          </div>
          <div class="formular__fuss">
            ${knopf}
            <p class="formular__hinweis">Wir nutzen deine Angaben nur, um dir zu antworten.
              Mehr dazu im <a href="/datenschutz/">Datenschutz</a>.</p>
          </div>
          <p class="formular__antwort" role="status" data-danke="${raw(escapeAttr(data.danke))}"></p>`;
    const zwei = data.aufbau === 'zweispaltig';
    const kompakt = data.aufbau === 'kompakt';
    const mail = ziel(`mailto:${data.mailAdresse || ''}`);
    const kopf = html`${data.titel ? html`<h2 class="formular__titel">${data.titel}</h2>` : ''}
          ${data.vorspann ? html`<p class="formular__vorspann">${markdownInline(data.vorspann)}</p>` : ''}`;
    return html`
      <section class="section${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}${raw(kompakt ? ' section--kompakt' : '')}"><div class="container">
        ${kompakt
          ? html`<div class="formular__kompakt">
              <div>${kopf}${(data.kontakte || []).length ? html`<ul class="formular__kontakte">${data.kontakte.map((k) => {
                const z = ziel(k.href);
                return html`<li><span class="formular__kontakt-label">${k.label}</span>${
                  z ? html`<a href="${raw(escapeAttr(z))}">${k.text}</a>` : html`<span>${k.text}</span>`}</li>`;
              })}</ul>` : ''}</div>
              <form class="formular formular--offen formular--kompakt" data-formular="${raw(escapeAttr(data.name))}" novalidate>${fuss}</form>
            </div>`
          : zwei
          ? html`<div class="formular__zwei">
              <div>${kopf}
                ${data.mailAdresse ? html`<p class="formular__mail-label">${data.mailLabel}</p>
                <a class="formular__mail" href="${raw(escapeAttr(mail))}">${data.mailAdresse}</a>` : ''}
              </div>
              <div class="formular__linie" aria-hidden="true"></div>
              <form class="formular formular--offen" data-formular="${raw(escapeAttr(data.name))}" novalidate>${fuss}</form>
            </div>`
          : html`<form class="formular" data-formular="${raw(escapeAttr(data.name))}" novalidate>${kopf}${fuss}</form>`}
      </div></section>
      <script>${raw(SKRIPT)}</script>`;
  },
};

// Kein Framework. Zwanzig Zeilen, die das Formular absenden, ohne die Seite zu verlassen.
const SKRIPT = `
document.querySelectorAll('form[data-formular]').forEach(function (f) {
  if (f.dataset.bereit) return; f.dataset.bereit = '1';
  var antwort = f.querySelector('.formular__antwort');
  var knopf = f.querySelector('button[type=submit]');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var fehlend = [].slice.call(f.querySelectorAll('[required]')).filter(function (i) { return !i.value.trim(); });
    if (fehlend.length) {
      antwort.dataset.art = 'fehler';
      antwort.textContent = 'Bitte füll die Pflichtfelder aus.';
      fehlend[0].focus();
      return;
    }
    var daten = {}; new FormData(f).forEach(function (v, k) { daten[k] = v; });
    daten._seite = location.pathname;
    knopf.disabled = true;
    antwort.dataset.art = ''; antwort.textContent = 'Wird gesendet …';
    fetch('/api/form/' + f.dataset.formular, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(daten)
    }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function () {
        antwort.dataset.art = 'ok';
        antwort.textContent = antwort.dataset.danke + (daten.email ? ' Die Antwort geht an ' + daten.email + '.' : '');
        f.querySelectorAll('input, textarea').forEach(function (i) { i.value = ''; });
        f.classList.add('formular--fertig');
        var neu = document.createElement('button');
        neu.type = 'button'; neu.className = 'formular__neu'; neu.textContent = 'Weitere Nachricht schreiben';
        neu.addEventListener('click', function () {
          f.classList.remove('formular--fertig'); neu.remove(); antwort.textContent = ''; antwort.dataset.art = '';
          var erstes = f.querySelector('input, textarea'); if (erstes) erstes.focus();
        });
        antwort.insertAdjacentElement('afterend', neu);
        antwort.setAttribute('tabindex', '-1'); antwort.focus();
        antwort.scrollIntoView({ block: 'center', behavior: 'smooth' });
      })
      .catch(function () {
        antwort.dataset.art = 'fehler';
        antwort.textContent = 'Das hat nicht geklappt. Schreib uns bitte direkt eine E-Mail.';
      })
      .finally(function () { knopf.disabled = false; });
  });
});`;
