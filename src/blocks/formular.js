import { html, raw, escapeAttr, markdownInline } from './_util.js';

export default {
  name: 'formular',
  label: 'Formular',
  schema: {
    name:     { type: 'text',  default: 'anfrage', label: 'Name des Formulars' },
    titel:    { type: 'text',  default: '', label: 'Überschrift' },
    vorspann: { type: 'longtext', default: '', label: 'Text darueber' },
    felder:   { type: 'liste', default: [], label: 'Felder: name, label, typ, pflicht' },
    knopf:    { type: 'text',  default: 'Absenden', label: 'Beschriftung des Knopfs' },
    danke:    { type: 'text',  default: 'Danke, wir melden uns.', label: 'Text nach dem Absenden' },
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
    .formular button[disabled] { opacity: .5; cursor: default; }
    .formular__hinweis { font-size: 14px; color: var(--text-leise); }
    .formular__hinweis a { color: var(--signal); }
    .formular__antwort { margin-top: var(--raum-2); font-size: 16px; }
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
      return html`<div class="feld">
        <label for="${raw(escapeAttr(id))}">${f.label}${f.pflicht ? ' *' : ''}</label>${steuer}
      </div>`;
    });

    return html`
      <section class="section"><div class="container">
        <form class="formular" data-formular="${raw(escapeAttr(data.name))}" novalidate>
          ${data.titel ? html`<h2 class="formular__titel">${data.titel}</h2>` : ''}
          ${data.vorspann ? html`<p class="formular__vorspann">${markdownInline(data.vorspann)}</p>` : ''}
          ${felder}
          <div class="formular__topf" aria-hidden="true">
            <label for="website-${raw(escapeAttr(data.name))}">Bitte frei lassen</label>
            <input id="website-${raw(escapeAttr(data.name))}" name="website" tabindex="-1" autocomplete="off">
          </div>
          <div class="formular__fuss">
            <button type="submit">${data.knopf}</button>
            <p class="formular__hinweis">Wir nutzen deine Angaben nur, um dir zu antworten.
              Mehr dazu im <a href="/datenschutz/">Datenschutz</a>.</p>
          </div>
          <p class="formular__antwort" role="status" data-danke="${raw(escapeAttr(data.danke))}"></p>
        </form>
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
        antwort.textContent = antwort.dataset.danke;
        f.querySelectorAll('input, textarea').forEach(function (i) { i.value = ''; });
      })
      .catch(function () {
        antwort.dataset.art = 'fehler';
        antwort.textContent = 'Das hat nicht geklappt. Schreib uns bitte direkt eine E-Mail.';
      })
      .finally(function () { knopf.disabled = false; });
  });
});`;
