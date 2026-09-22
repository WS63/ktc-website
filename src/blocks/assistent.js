import { html, raw, escapeAttr } from './_util.js';

export default {
  name: 'assistent',
  label: 'Assistent — Chat über die Website',
  schema: {
    name:      { type: 'text',  default: 'Frag den KTC', label: 'Name im Knopf' },
    begruessung: { type: 'longtext', default: '', label: 'Erster Satz im Fenster' },
    vorschlaege: { type: 'liste', default: [], label: 'Vorschläge zum Anklicken' },
  },
  css: `
    .ass { position: fixed; right: 20px; bottom: 20px; z-index: 40;
      font-family: var(--font-sans); }
    .ass__knopf { display: flex; align-items: center; gap: 9px; cursor: pointer;
      background: var(--signal); color: #fff; border: none; font: inherit;
      font-size: 15px; font-weight: 500; padding: 13px 22px; border-radius: 30px;
      box-shadow: 0 3px 14px rgba(30,30,24,.22); }
    .ass__knopf:hover { background: var(--signal-hover); }
    .ass__knopf svg { flex: none; }

    .ass__fenster { display: none; flex-direction: column;
      width: min(380px, calc(100vw - 32px)); height: min(560px, calc(100vh - 110px));
      background: var(--grund); border: 1px solid var(--linie); border-radius: 14px;
      box-shadow: 0 8px 34px rgba(30,30,24,.20); overflow: hidden; }
    .ass[data-auf] .ass__fenster { display: flex; }
    .ass[data-auf] .ass__knopf { display: none; }

    .ass__kopf { display: flex; align-items: center; gap: 10px;
      padding: 14px 16px; border-bottom: 1px solid var(--linie); flex: none; }
    .ass__kopf b { font-weight: 500; font-size: 15px; margin-right: auto; }
    .ass__zu { border: none; background: none; cursor: pointer; font-size: 20px;
      line-height: 1; color: var(--text-leise); padding: 4px 8px; }
    .ass__zu:hover { color: var(--text); }

    .ass__lauf { flex: 1; overflow-y: auto; padding: 16px; }
    .ass__blase { max-width: 88%; padding: 11px 14px; border-radius: 14px;
      font-size: 15px; line-height: 1.55; margin-bottom: 10px; }
    .ass__blase--ich { background: var(--signal); color: #fff; margin-left: auto;
      border-bottom-right-radius: 4px; }
    .ass__blase--bot { background: var(--flaeche); border-bottom-left-radius: 4px; }
    .ass__blase p + p { margin-top: 9px; }
    .ass__blase a { color: var(--signal); }
    .ass__blase--ich a { color: #fff; }
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
      border: none; background: var(--signal); color: #fff; cursor: pointer; font-size: 17px; }
    .ass__eingabe button:hover { background: var(--signal-hover); }
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

    return html`
      <div class="ass" id="ktc-assistent">
        <button class="ass__knopf" type="button" data-auf-knopf>
          ${raw(SPRECHBLASE)}${data.name}
        </button>

        <div class="ass__fenster" role="dialog" aria-label="Assistent">
          <div class="ass__kopf">
            ${raw(ZEICHEN)}
            <b>${data.name}</b>
            <button class="ass__zu" type="button" data-zu aria-label="Schließen">×</button>
          </div>

          <div class="ass__lauf" data-lauf>
            <div class="ass__blase ass__blase--bot">${data.begruessung
              || 'Ich kenne alles, was auf dieser Website steht. Womit kann ich dir helfen?'}</div>
            ${vorschlaege.length ? html`<div class="ass__vorschlaege">
              ${vorschlaege.map((v) => html`<button class="ass__vorschlag" type="button"
                data-vorschlag="${raw(escapeAttr(v))}">${v}</button>`)}
            </div>` : ''}
          </div>

          <div class="ass__fuss">
            <form class="ass__eingabe" data-form>
              <label class="nur-vorleser" for="ass-feld">Deine Frage</label>
              <input id="ass-feld" data-feld autocomplete="off"
                     placeholder="Deine Frage …" maxlength="500">
              <button type="submit" aria-label="Absenden">→</button>
            </form>
            <p class="ass__klein">Antworten kommen aus dieser Website.
              Fehler sind möglich. <a href="/datenschutz/">Datenschutz</a></p>
          </div>
        </div>
      </div>
      <script>${raw(SKRIPT)}</script>`;
  },
};

const SPRECHBLASE = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
  aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/></svg>`;

const ZEICHEN = `<svg width="26" height="26" style="flex:none" xmlns="http://www.w3.org/2000/svg" viewBox="115 116 778 610" role="img" aria-hidden="true" focusable="false">  <defs> <linearGradient> <stop style="stop-color:#bee57c;stop-opacity:1;" offset="0" /> <stop style="stop-color:#a6d904;stop-opacity:1;" offset="1" /> </linearGradient> </defs> <g> <path d="m 793.98394,240.63577 c -141.1682,0 -255.60764,107.87457 -255.60764,240.94459 0,133.07002 114.43944,240.94459 255.60764,240.94459 33.66364,0 65.792,-6.17039 95.2263,-17.31789 V 589.72307 c -25.83,20.23186 -59.01804,32.4083 -95.2263,32.4083 -82.34812,0 -149.10445,-62.92683 -149.10445,-140.55101 0,-77.62418 66.75633,-140.55101 149.10445,-140.55101 36.20826,0 69.3963,12.17644 95.2263,32.4083 V 257.95366 c -29.4343,-11.1475 -61.56266,-17.31789 -95.2263,-17.31789 z" style="display:inline;fill:#ffbe00;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 889.21024,589.72307 c -12.4511,9.75262 -26.6213,17.60584 -42.006,23.15327 -36.13032,28.20409 -63.89131,65.60846 -79.25093,108.39369 8.56264,0.81672 17.2395,1.25492 26.03063,1.25492 33.66364,0 65.792,-6.17039 95.2263,-17.31789 z" style="display:inline;fill:#fa320a;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 785.6791,240.63577 c -54.59873,0 -105.19602,16.1501 -146.72379,43.63983 42.9331,11.25262 89.89026,11.78389 136.60599,-0.75295 28.26473,-7.58524 54.1959,-19.41128 77.2774,-34.44755 -21.39943,-5.49123 -43.91457,-8.43933 -67.1596,-8.43933 z" style="display:inline;fill:#fa320a;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 279.46038,120.179 v 100.375 h 170.40625 v 431.6875 h 100.25 V 220.554 H 720.52288 V 120.179 Z" style="display:inline;fill:#00af00;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 449.88083,524.65548 v 106.57406 c 10.81929,4.9653 20.90997,11.11451 30.07149,18.29046 V 534.03601 c -9.74314,-3.68996 -19.78001,-6.82452 -30.07149,-9.38053 z" style="display:inline;fill:#006e00;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 467.26591,120.16347 c 11.06074,39.13066 31.80991,73.14567 59.20324,100.39358 7.41699,7.37763 15.32033,14.25887 23.64997,20.61206 v -20.61206 h 170.40509 v -29.05139 c -57.74895,4.39948 -112.0794,-23.72745 -138.76738,-71.34219 z" style="display:inline;mix-blend-mode:normal;fill:#006e00;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="M 119.09447,240.63651 V 722.52569 H 219.33276 V 506.71092 L 349.61122,722.52569 H 468.89478 L 323.9878,482.42822 469.92849,240.63651 H 350.64492 L 219.33276,458.14553 V 240.63651 Z" style="display:inline;fill:#0050ff;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 346.32215,519.44756 c -35.7701,5.07983 -69.09176,17.1344 -98.39015,34.66716 l 52.78173,87.43654 c 23.92606,-15.41307 52.84541,-24.43957 84.01221,-24.43957 7.27857,0 14.4267,0.49256 21.42594,1.44316 z m -126.98939,54.52627 c -46.24199,37.03053 -78.30228,89.27779 -87.48923,148.55112 h 87.48923 z" style="display:inline;fill:#0000c8;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 119.09447,240.63577 v 43.45159 c 2.41122,0.0634 4.83982,0.0941 7.26728,0.0941 32.80948,0 64.15098,-5.88446 92.97101,-16.50219 V 240.63575 H 119.09447 Z" style="display:inline;mix-blend-mode:normal;fill:#0000c8;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path style="fill:none;stroke:#008c00;stroke-width:15;stroke-opacity:1;paint-order:stroke markers fill;stroke-dasharray:none" width="900" height="900" x="56" y="50" /> <g transform="matrix(0.32292708,0,0,0.32313634,629.7354,320.03079)" style="fill:#f5c211;stroke:none;stroke-width:56.828"> <path style="fill:#f5c211;stroke:none;stroke-width:40.131;paint-order:stroke markers fill" d="m 499.75304,252.36893 a 248.01563,248.01563 0 0 0 -13.4384,0.36432 248.01563,248.01563 0 0 1 4.4793,-0.12144 248.01563,248.01563 0 0 1 8.9591,-0.24288 z m -13.4384,0.36432 a 248.01563,248.01563 0 0 0 -234.0136,239.50217 248.01563,248.01563 0 0 0 234.0136,-239.50217 z m 261.4543,247.66137 a 248.01563,248.01563 0 0 1 -0.5622,8.13903 248.01563,248.01563 0 0 0 -233.9615,238.98232 248.01563,248.01563 0 0 0 234.5237,-247.12135 z m -464.6306,120.2924 a 248.01563,248.01563 0 0 0 11.9301,18.82469 248.01563,248.01563 0 0 1 -11.9301,-18.82469 z m 14.8653,23.21822 a 248.01563,248.01563 0 0 0 26.3767,31.85232 248.01563,248.01563 0 0 1 -9.9943,-11.39621 248.01563,248.01563 0 0 1 -16.3824,-20.45611 z" /> <path style="fill:#f5c211;stroke:none;stroke-width:40.131;paint-order:stroke markers fill" d="m 517.40414,252.59599 a 248.01563,248.01563 0 0 1 0.61133,17.40411 248.01563,248.01563 0 0 1 -248.01535,248.01535 248.01563,248.01563 0 0 1 -17.40411,-0.61133 248.01563,248.01563 0 0 0 7.83932,46.78681 248.01563,248.01563 0 0 0 0,5.1e-4 248.01563,248.01563 0 0 0 10.4283,30.72009 248.01563,248.01563 0 0 0 43.7689,69.06555 248.01563,248.01563 0 0 0 9.99423,11.39621 248.01563,248.01563 0 0 0 12.99455,11.39672 248.01563,248.01563 0 0 0 11.39621,9.99422 248.01563,248.01563 0 0 0 5.1e-4,0 248.01563,248.01563 0 0 0 26.97407,18.0237 248.01563,248.01563 0 0 0 5.1e-4,0 248.01563,248.01563 0 0 0 29.0959,14.34848 248.01563,248.01563 0 0 0 20.2923,6.88847 248.01563,248.01563 0 0 0 10.42779,3.53984 248.01563,248.01563 0 0 0 5.2e-4,0 248.01563,248.01563 0 0 0 31.81821,6.32933 248.01563,248.01563 0 0 0 14.9686,1.50998 248.01563,248.01563 0 0 1 -0.61134,-17.4041 248.01563,248.01563 0 0 1 248.01536,-248.01536 248.01563,248.01563 0 0 1 17.4041,0.61134 248.01563,248.01563 0 0 0 -1.50998,-14.9686 248.01563,248.01563 0 0 0 -6.32933,-31.81821 248.01563,248.01563 0 0 0 0,-5.2e-4 248.01563,248.01563 0 0 0 -24.77679,-59.8165 248.01563,248.01563 0 0 0 -39.41413,-51.36534 248.01563,248.01563 0 0 0 -5.1e-4,-5.2e-4 248.01563,248.01563 0 0 0 -24.39076,-21.39043 248.01563,248.01563 0 0 0 -5.2e-4,0 248.01563,248.01563 0 0 0 -26.97406,-18.0237 248.01563,248.01563 0 0 0 -5.2e-4,0 248.01563,248.01563 0 0 0 -29.0959,-14.34848 248.01563,248.01563 0 0 0 -5.2e-4,0 248.01563,248.01563 0 0 0 -30.71957,-10.4283 248.01563,248.01563 0 0 0 -5.1e-4,0 248.01563,248.01563 0 0 0 -31.81822,-6.32933 248.01563,248.01563 0 0 0 -5.1e-4,0 248.01563,248.01563 0 0 0 -14.96808,-1.50999 z" /> </g> </g> </svg>`;

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
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && wurzel.hasAttribute('data-auf')) auf(false);
  });

  wurzel.querySelectorAll('[data-vorschlag]').forEach(function (b) {
    b.addEventListener('click', function () { frage(b.dataset.vorschlag); });
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
