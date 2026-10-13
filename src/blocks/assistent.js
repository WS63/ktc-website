import { html, raw, escapeAttr, ziel } from './_util.js';

export default {
  name: 'assistent',
  label: 'Assistent — Chat über die Website',
  schema: {
    name:      { type: 'text',  default: 'Lisa', label: 'Name der Assistentin' },
    rolle:     { type: 'text',  default: 'KI-Assistentin des KTC', label: 'Zeile unter dem Namen — sagt, dass es eine KI ist' },
    begruessung: { type: 'longtext', default: '', label: 'Erster Satz im Fenster (leer = der Standardtext mit dem Namen)' },
    avatar:    { type: 'image', default: '', label: 'Bild der Assistentin (leer = Anfangsbuchstabe)' },
    foto:      { type: 'image', default: '', label: 'Foto unter der Begrüßung' },
    fotoAlt:   { type: 'text',  default: '', label: 'Alt-Text des Fotos' },
    vorschlaege: { type: 'liste', default: [], label: 'Vorschläge zum Anklicken' },
  },
  css: `
    .ass { position: fixed; right: 20px; bottom: 20px; z-index: 40;
      font-family: var(--font-sans); }
    /* Der Knopf: das Bild der Assistentin und ihr Name — ein Gegenueber, kein Werkzeug. */
    .ass__knopf { display: flex; align-items: center; gap: 10px; cursor: pointer;
      background: var(--grund); color: var(--text); border: none; font: inherit;
      font-size: 16px; font-weight: 600; padding: 7px 22px 7px 8px; border-radius: 40px;
      box-shadow: 0 3px 14px rgba(30,30,24,.22); }
    .ass__knopf:hover { background: var(--ueberfahren); }
    .ass__avatar { flex: none; width: 36px; height: 36px; border-radius: 50%; overflow: hidden;
      display: grid; place-items: center; background: var(--text); color: var(--grund);
      font-size: 18px; font-weight: 700; line-height: 1; }
    .ass__avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }

    .ass__fenster { display: none; flex-direction: column;
      width: min(380px, calc(100vw - 32px)); height: min(560px, calc(100vh - 110px));
      background: var(--grund); border: 1px solid var(--linie); border-radius: 14px;
      box-shadow: 0 8px 34px rgba(30,30,24,.20); overflow: hidden; }
    .ass[data-auf] .ass__fenster { display: flex; }
    .ass[data-auf] .ass__knopf { display: none; }

    .ass__kopf { display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; border-bottom: 1px solid var(--linie); flex: none; }
    .ass__kopf .ass__avatar { width: 42px; height: 42px; background: var(--grund); color: var(--text);
      font-size: 21px; }
    .ass__wer { margin-right: auto; line-height: 1.25; }
    .ass__wer b { display: block; font-weight: 600; font-size: 16px; }
    .ass__wer span { font-size: 13px; color: var(--text-leise); }
    .ass__zu, .ass__neu { border: none; background: none; cursor: pointer; line-height: 1;
      color: var(--text-leise); padding: 6px 8px; border-radius: 8px; }
    .ass__zu { font-size: 22px; }
    .ass__zu:hover, .ass__neu:hover { color: var(--text); background: var(--flaeche); }
    .ass__neu svg { display: block; }

    .ass__lauf { flex: 1; overflow-y: auto; padding: 16px; }
    .ass__blase { max-width: 88%; padding: 11px 14px; border-radius: 14px;
      font-size: 15px; line-height: 1.55; margin-bottom: 10px; }
    /* Die Fragen des Besuchers hell mit blauem Anstrich, Lisas Antworten grau: das Blau bleibt
       dem, was sich anklicken laesst. Der dunkle Ton gehoert Lisa selbst (Knopf, Kopf, Senden). */
    .ass__blase--ich { background: var(--signal-leise); color: var(--text); margin-left: auto;
      border-bottom-right-radius: 4px; }
    .ass__blase--bot { background: var(--flaeche); border-bottom-left-radius: 4px; }
    .ass__blase p + p { margin-top: 9px; }
    .ass__blase a { color: var(--signal); }
    .ass__quellen { font-size: 13px; color: var(--text-leise); margin: -4px 0 12px 2px; }
    .ass__quellen a { color: var(--signal); text-decoration: none; }
    .ass__quellen a:hover { text-decoration: underline; }
    .ass__fehler { color: var(--warnung); }

    .ass__punkte { display: inline-flex; gap: 4px; }
    .ass__punkte i { width: 6px; height: 6px; border-radius: 50%;
      background: var(--text-leise); animation: assPunkt 1.1s infinite; }
    .ass__punkte i:nth-child(2) { animation-delay: .18s; }
    .ass__punkte i:nth-child(3) { animation-delay: .36s; }
    @keyframes assPunkt { 0%,60%,100% { opacity: .25 } 30% { opacity: 1 } }

    .ass__foto { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover;
      border-radius: 12px; margin: 0 0 12px; border: 1px solid var(--linie); }
    .ass__vorschlaege { display: flex; flex-direction: column; gap: 7px;
      align-items: flex-start; margin-bottom: 12px; }
    .ass__vorschlag { font: inherit; font-size: 14px; cursor: pointer; text-align: left;
      background: none; border: 1px solid var(--linie); border-radius: 16px;
      padding: 8px 14px; color: var(--text); }
    .ass__vorschlag:hover { border-color: var(--signal); color: var(--signal); }

    .ass__fuss { flex: none; border-top: 1px solid var(--linie); padding: 12px; }
    .ass__eingabe { display: flex; gap: 8px; }
    .ass__eingabe input { flex: 1; font: inherit; font-size: 15px; padding: 11px 14px;
      border: 1px solid var(--linie); border-radius: 22px; background: var(--grund);
      color: var(--text); min-width: 0; }
    .ass__eingabe input:focus { outline: none; border-color: var(--signal); }
    .ass__eingabe button { flex: none; width: 42px; height: 42px; border-radius: 50%;
      border: none; background: var(--grund); color: var(--text); cursor: pointer; font-size: 17px; }
    .ass__eingabe button:hover { background: var(--ueberfahren); }
    .ass__eingabe button[disabled] { opacity: .45; cursor: default; }
    .ass__klein { font-size: 12px; color: var(--text-leise); margin-top: 9px;
      text-align: center; }
    .ass__klein a { color: var(--text-leise); }

    @media (max-width: 520px) {
      .ass { right: 12px; bottom: 12px; left: 12px; }
      .ass__knopf { margin-left: auto; }
      .ass__fenster { width: 100%; height: min(72vh, calc(100vh - 90px)); }
    }
    @media print { .ass { display: none; } }
  `,
  render(data) {
    // P6: ohne Schluessel erscheint kein Knopf, der ins Leere fuehrt.
    // Die Website bleibt vollstaendig bedienbar — sie hat eben keinen Chat.
    if (!process.env.ANTHROPIC_API_KEY) return '';

    const vorschlaege = (data.vorschlaege || [])
      .map((v) => (typeof v === 'string' ? v : v?.frage))
      .filter(Boolean).slice(0, 4);
    const name = data.name || 'Lisa';
    const avatarSrc = ziel(data.avatar);
    const fotoSrc = ziel(data.foto);
    // Das Bild der Assistentin, oder — solange es keines gibt — ihr Anfangsbuchstabe.
    const avatarBau = (klasse) => html`<span class="ass__avatar${klasse}" aria-hidden="true">${avatarSrc
      ? html`<img src="${raw(escapeAttr(avatarSrc))}" alt="" width="42" height="42" loading="lazy">`
      : name.trim().charAt(0).toUpperCase()}</span>`;
    const avatar = avatarBau('');
    const avatarKopf = avatarBau(' section--dunkel');
    const begruessung = data.begruessung
      || `Hallo, ich bin ${name} 👋 Ich bin die KI-Assistentin des KTC und kenne alles auf dieser Website: `
       + 'Mitgliedschaft und Beiträge, Mannschaften und Termine, Tennisschule, Clubrestaurant und Anfahrt. '
       + 'Womit kann ich dir helfen?';

    return html`
      <div class="ass" id="ktc-assistent">
        <button class="ass__knopf section--dunkel" type="button" data-auf-knopf>
          ${avatar}Frag ${name}
        </button>

        <div class="ass__fenster" role="dialog" aria-label="Chat mit ${name}, der KI-Assistentin">
          <div class="ass__kopf">
            ${avatarKopf}
            <div class="ass__wer"><b>${name}</b><span>${data.rolle || 'KI-Assistentin des KTC'}</span></div>
            <button class="ass__neu" type="button" data-neu aria-label="Neues Gespräch beginnen" title="Neues Gespräch">${raw(NEU)}</button>
            <button class="ass__zu" type="button" data-zu aria-label="Schließen">×</button>
          </div>

          <div class="ass__lauf" data-lauf>
            <div class="ass__blase ass__blase--bot">${begruessung}</div>
            ${fotoSrc ? html`<img class="ass__foto" src="${raw(escapeAttr(fotoSrc))}"
              alt="${raw(escapeAttr(data.fotoAlt || ''))}" loading="lazy" decoding="async">` : ''}
            ${vorschlaege.length ? html`<div class="ass__vorschlaege">
              ${vorschlaege.map((v) => html`<button class="ass__vorschlag" type="button"
                data-vorschlag="${raw(escapeAttr(v))}">${v}</button>`)}
            </div>` : ''}
          </div>

          <div class="ass__fuss">
            <form class="ass__eingabe" data-form>
              <label class="nur-vorleser" for="ass-feld">Deine Frage an ${name}</label>
              <input id="ass-feld" data-feld autocomplete="off"
                     placeholder="Deine Frage an ${name} …" maxlength="500">
              <button class="section--dunkel" type="submit" aria-label="Absenden">→</button>
            </form>
            <p class="ass__klein">${name} ist eine KI und antwortet nur aus den Seiten des Clubs.
              Fehler sind möglich 🙂${avatarSrc ? ' Auch ihr Bild ist von einer KI erzeugt.' : ''} · <a href="/datenschutz/">Datenschutz</a></p>
          </div>
        </div>
      </div>
      <script>${raw(SKRIPT)}</script>`;
  },
};

const NEU = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>`;

// Kein Framework. Der Chat ist eine Nebensache — er darf die Seite nicht
// beschweren und muss ausfallen koennen, ohne etwas mitzureissen (P6).
const SKRIPT = `
(function () {
  var wurzel = document.getElementById('ktc-assistent');
  if (!wurzel || wurzel.dataset.bereit) return;
  wurzel.dataset.bereit = '1';

  var lauf = wurzel.querySelector('[data-lauf]');
  var form = wurzel.querySelector('[data-form]');
  var feld = wurzel.querySelector('[data-feld]');
  var knopf = form.querySelector('button');
  var verlauf = [];
  var laeuft = false;

  function auf(offen) {
    if (offen) { wurzel.setAttribute('data-auf', '1'); setTimeout(function(){ feld.focus(); }, 60); }
    else wurzel.removeAttribute('data-auf');
  }
  wurzel.querySelector('[data-auf-knopf]').addEventListener('click', function () { auf(true); });
  wurzel.querySelector('[data-zu]').addEventListener('click', function () { auf(false); });
  // Ein Link '#frag-lisa' irgendwo auf der Seite oeffnet den Assistenten ('#frag-den-ktc' ebenso).
  document.querySelectorAll('a[href="#frag-lisa"], a[href="#frag-den-ktc"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); auf(true); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && wurzel.hasAttribute('data-auf')) auf(false);
  });

  var anfang = lauf.innerHTML;   // Begruessung, Foto und Vorschlaege, wie sie beim Laden da waren
  function bindeVorschlaege() {
    wurzel.querySelectorAll('[data-vorschlag]').forEach(function (b) {
      b.addEventListener('click', function () { frage(b.dataset.vorschlag); });
    });
  }
  bindeVorschlaege();
  // Neues Gespraech: alles zurueck auf Anfang, auch der Verlauf, den die Assistentin mitbekommt.
  wurzel.querySelector('[data-neu]').addEventListener('click', function () {
    if (laeuft) return;
    verlauf = []; lauf.innerHTML = anfang; bindeVorschlaege(); feld.value = ''; feld.focus();
  });

  function blase(klasse, text) {
    var d = document.createElement('div');
    d.className = 'ass__blase ass__blase--' + klasse;
    d.textContent = text || '';
    lauf.appendChild(d);
    lauf.scrollTop = lauf.scrollHeight;
    return d;
  }

  // Sparsames Markdown, und alles andere wird als Text gesetzt — ein
  // Modell-Text darf niemals als HTML in die Seite.
  function setze(el, text) {
    var sicher = text.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
    sicher = sicher.replace(/\\[([^\\]]+)\\]\\((\\/[^)\\s]*)\\)/g, '<a href="$2">$1</a>');
    sicher = sicher.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
    sicher = sicher.split(/\\n{2,}/).map(function (a) {
      return '<p>' + a.replace(/\\n/g, '<br>') + '</p>';
    }).join('');
    el.innerHTML = sicher;
    lauf.scrollTop = lauf.scrollHeight;
  }

  function quellen(liste) {
    if (!liste || !liste.length) return;
    var d = document.createElement('p');
    d.className = 'ass__quellen';
    d.appendChild(document.createTextNode('Steht auf: '));
    liste.forEach(function (q, i) {
      if (i) d.appendChild(document.createTextNode(' · '));
      var a = document.createElement('a');
      a.href = q.pfad; a.textContent = q.titel || q.pfad;
      d.appendChild(a);
    });
    lauf.appendChild(d);
    lauf.scrollTop = lauf.scrollHeight;
  }

  function frage(text) {
    if (laeuft || !text || text.trim().length < 3) return;
    laeuft = true; knopf.disabled = true; feld.value = '';
    var vorschlaege = wurzel.querySelector('.ass__vorschlaege');
    if (vorschlaege) vorschlaege.remove();

    blase('ich', text);
    var ziel = blase('bot');
    ziel.innerHTML = '<span class="ass__punkte"><i></i><i></i><i></i></span>';

    var gesammelt = '';
    fetch('/api/chat', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ frage: text, verlauf: verlauf.slice(-6) })
    }).then(function (r) {
      if (!r.ok) {
        return r.json().catch(function(){ return {}; }).then(function (d) {
          throw new Error(d.fehler || 'Der Assistent antwortet gerade nicht.');
        });
      }
      var leser = r.body.getReader(), dec = new TextDecoder(), puffer = '';
      function weiter() {
        return leser.read().then(function (st) {
          if (st.done) return;
          puffer += dec.decode(st.value, { stream: true });
          var zeilen = puffer.split('\\n\\n');
          puffer = zeilen.pop();
          zeilen.forEach(function (z) {
            if (z.indexOf('data: ') !== 0) return;
            var d;
            try { d = JSON.parse(z.slice(6)); } catch (e) { return; }
            if (d.art === 'text') { gesammelt += d.text; setze(ziel, gesammelt); }
            else if (d.art === 'fertig') { quellen(d.quellen); }
            else if (d.art === 'fehler') {
              ziel.className += ' ass__fehler'; setze(ziel, d.text);
            }
          });
          return weiter();
        });
      }
      return weiter();
    }).then(function () {
      if (gesammelt) {
        verlauf.push({ rolle: 'ich', text: text });
        verlauf.push({ rolle: 'bot', text: gesammelt });
      }
    }).catch(function (e) {
      ziel.className += ' ass__fehler';
      setze(ziel, e.message || 'Da ist etwas schiefgegangen. Versuch es noch einmal.');
    }).finally(function () {
      laeuft = false; knopf.disabled = false; feld.focus();
    });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); frage(feld.value); });
})();`;
