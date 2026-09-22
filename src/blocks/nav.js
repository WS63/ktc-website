import { html, raw, escapeAttr, ziel, istExtern } from './_util.js';

export default {
  name: 'nav',
  label: 'Kopfzeile mit Menü',
  schema: {
    marke:      { type: 'text', default: '', label: 'Name neben dem Logo' },
    baum:       { type: 'auto', default: [], label: 'Menü — wird unter Navigation gepflegt' },
    aktionLabel:{ type: 'text', default: '', label: 'Rechter Link' },
    aktionHref: { type: 'text', default: '', label: 'Ziel des rechten Links' },
  },
  css: `
    .kopf { border-bottom: 1px solid var(--linie); background: var(--grund);
      position: sticky; top: 0; z-index: 20; }
    .kopf__innen { display: flex; align-items: center; gap: var(--raum-4);
      padding-top: 14px; padding-bottom: 14px; }
    .kopf__marke { display: flex; align-items: center; gap: 10px; margin-right: auto;
      text-decoration: none; color: var(--text); flex: none; }
    .kopf__marke b { font-weight: 500; font-size: 15px; white-space: nowrap; }
    .kopf__zeichen { height: 30px; width: auto; display: block; flex: none; }
    .kopf__menue { display: flex; gap: var(--raum-3); align-items: center;
      font-size: 15px; }
    .kopf__menue a { color: var(--text); text-decoration: none; padding: 6px 0;
      border-bottom: 2px solid transparent; white-space: nowrap; }
    .kopf__menue a:hover { color: var(--signal); border-bottom-color: var(--signal); }
    .kopf__jetzt { color: var(--signal); text-decoration: none; white-space: nowrap;
      font-size: 15px; flex: none; }
    .kopf__jetzt:hover { text-decoration: underline; text-underline-offset: 3px; }

    /* Der Schalter ist nur auf schmalen Schirmen da. Ohne JavaScript bedienbar:
       ein verstecktes Kontrollkaestchen traegt den Zustand. Dadurch funktioniert
       das Menue auch, wenn ein Skript nicht laedt (P6). */
    .kopf__schalter { display: none; }
    .kopf__klappe { display: none; }

    @media (max-width: 800px) {
      .kopf__innen { flex-wrap: wrap; gap: var(--raum-2); }
      .kopf__klappe { display: flex; align-items: center; gap: 7px; cursor: pointer;
        font-size: 15px; color: var(--text); border: 1px solid var(--linie);
        border-radius: var(--radius); padding: 8px 14px; user-select: none; }
      .kopf__klappe:hover { border-color: var(--signal); color: var(--signal); }
      .kopf__balken { display: block; width: 16px; height: 9px; position: relative; }
      .kopf__balken::before, .kopf__balken::after {
        content: ''; position: absolute; left: 0; right: 0; height: 1.5px;
        background: currentColor; transition: transform .16s ease; }
      .kopf__balken::before { top: 0; }
      .kopf__balken::after { bottom: 0; }
      .kopf__schalter:checked ~ .kopf__innen .kopf__balken::before {
        transform: translateY(3.75px) rotate(45deg); }
      .kopf__schalter:checked ~ .kopf__innen .kopf__balken::after {
        transform: translateY(-3.75px) rotate(-45deg); }

      .kopf__menue { display: none; width: 100%; flex-direction: column;
        align-items: stretch; gap: 0; padding-bottom: 8px; }
      .kopf__schalter:checked ~ .kopf__innen .kopf__menue { display: flex; }
      .kopf__menue a { padding: 13px 2px; border-bottom: 1px solid var(--linie); }
      .kopf__menue a:hover { border-bottom-color: var(--signal); }
      .kopf__jetzt { display: none; }
      .kopf__schalter:checked ~ .kopf__innen .kopf__jetzt {
        display: block; width: 100%; padding: 13px 2px; }
    }
  `,
  render(data) {
    const punkte = (data.baum || []).map((p) => {
      const z = ziel(p.href);
      if (!z) return '';
      const extern = istExtern(z) ? raw(' target="_blank" rel="noopener noreferrer"') : '';
      return html`<a href="${raw(escapeAttr(z))}"${extern}>${p.label}</a>`;
    });
    const aktion = ziel(data.aktionHref);
    return html`
      <header class="kopf">
        <input type="checkbox" id="kopf-schalter" class="kopf__schalter nur-vorleser">
        <div class="container kopf__innen">
          <a class="kopf__marke" href="/">${raw(LOGO)}<b>${data.marke}</b></a>
          <label class="kopf__klappe" for="kopf-schalter">
            <span class="kopf__balken" aria-hidden="true"></span>Menü</label>
          <nav class="kopf__menue" aria-label="Hauptmenü">${punkte}</nav>
          ${data.aktionLabel && aktion
            ? html`<a class="kopf__jetzt" href="${raw(escapeAttr(aktion))}"${istExtern(aktion) ? raw(' target="_blank" rel="noopener noreferrer"') : ''}>${data.aktionLabel} ↗</a>`
            : ''}
        </div>
      </header>`;
  },
};

const LOGO = `<svg class="kopf__zeichen" xmlns="http://www.w3.org/2000/svg" viewBox="115 116 778 610" role="img" aria-hidden="true" focusable="false">  <defs> <linearGradient> <stop style="stop-color:#bee57c;stop-opacity:1;" offset="0" /> <stop style="stop-color:#a6d904;stop-opacity:1;" offset="1" /> </linearGradient> </defs> <g> <path d="m 793.98394,240.63577 c -141.1682,0 -255.60764,107.87457 -255.60764,240.94459 0,133.07002 114.43944,240.94459 255.60764,240.94459 33.66364,0 65.792,-6.17039 95.2263,-17.31789 V 589.72307 c -25.83,20.23186 -59.01804,32.4083 -95.2263,32.4083 -82.34812,0 -149.10445,-62.92683 -149.10445,-140.55101 0,-77.62418 66.75633,-140.55101 149.10445,-140.55101 36.20826,0 69.3963,12.17644 95.2263,32.4083 V 257.95366 c -29.4343,-11.1475 -61.56266,-17.31789 -95.2263,-17.31789 z" style="display:inline;fill:#ffbe00;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 889.21024,589.72307 c -12.4511,9.75262 -26.6213,17.60584 -42.006,23.15327 -36.13032,28.20409 -63.89131,65.60846 -79.25093,108.39369 8.56264,0.81672 17.2395,1.25492 26.03063,1.25492 33.66364,0 65.792,-6.17039 95.2263,-17.31789 z" style="display:inline;fill:#fa320a;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 785.6791,240.63577 c -54.59873,0 -105.19602,16.1501 -146.72379,43.63983 42.9331,11.25262 89.89026,11.78389 136.60599,-0.75295 28.26473,-7.58524 54.1959,-19.41128 77.2774,-34.44755 -21.39943,-5.49123 -43.91457,-8.43933 -67.1596,-8.43933 z" style="display:inline;fill:#fa320a;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 279.46038,120.179 v 100.375 h 170.40625 v 431.6875 h 100.25 V 220.554 H 720.52288 V 120.179 Z" style="display:inline;fill:#00af00;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 449.88083,524.65548 v 106.57406 c 10.81929,4.9653 20.90997,11.11451 30.07149,18.29046 V 534.03601 c -9.74314,-3.68996 -19.78001,-6.82452 -30.07149,-9.38053 z" style="display:inline;fill:#006e00;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 467.26591,120.16347 c 11.06074,39.13066 31.80991,73.14567 59.20324,100.39358 7.41699,7.37763 15.32033,14.25887 23.64997,20.61206 v -20.61206 h 170.40509 v -29.05139 c -57.74895,4.39948 -112.0794,-23.72745 -138.76738,-71.34219 z" style="display:inline;mix-blend-mode:normal;fill:#006e00;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="M 119.09447,240.63651 V 722.52569 H 219.33276 V 506.71092 L 349.61122,722.52569 H 468.89478 L 323.9878,482.42822 469.92849,240.63651 H 350.64492 L 219.33276,458.14553 V 240.63651 Z" style="display:inline;fill:#0050ff;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 346.32215,519.44756 c -35.7701,5.07983 -69.09176,17.1344 -98.39015,34.66716 l 52.78173,87.43654 c 23.92606,-15.41307 52.84541,-24.43957 84.01221,-24.43957 7.27857,0 14.4267,0.49256 21.42594,1.44316 z m -126.98939,54.52627 c -46.24199,37.03053 -78.30228,89.27779 -87.48923,148.55112 h 87.48923 z" style="display:inline;fill:#0000c8;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 119.09447,240.63577 v 43.45159 c 2.41122,0.0634 4.83982,0.0941 7.26728,0.0941 32.80948,0 64.15098,-5.88446 92.97101,-16.50219 V 240.63575 H 119.09447 Z" style="display:inline;mix-blend-mode:normal;fill:#0000c8;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path style="fill:none;stroke:#008c00;stroke-width:15;stroke-opacity:1;paint-order:stroke markers fill;stroke-dasharray:none" width="900" height="900" x="56" y="50" /> <g transform="matrix(0.32292708,0,0,0.32313634,629.7354,320.03079)" style="fill:#f5c211;stroke:none;stroke-width:56.828"> <path style="fill:#f5c211;stroke:none;stroke-width:40.131;paint-order:stroke markers fill" d="m 499.75304,252.36893 a 248.01563,248.01563 0 0 0 -13.4384,0.36432 248.01563,248.01563 0 0 1 4.4793,-0.12144 248.01563,248.01563 0 0 1 8.9591,-0.24288 z m -13.4384,0.36432 a 248.01563,248.01563 0 0 0 -234.0136,239.50217 248.01563,248.01563 0 0 0 234.0136,-239.50217 z m 261.4543,247.66137 a 248.01563,248.01563 0 0 1 -0.5622,8.13903 248.01563,248.01563 0 0 0 -233.9615,238.98232 248.01563,248.01563 0 0 0 234.5237,-247.12135 z m -464.6306,120.2924 a 248.01563,248.01563 0 0 0 11.9301,18.82469 248.01563,248.01563 0 0 1 -11.9301,-18.82469 z m 14.8653,23.21822 a 248.01563,248.01563 0 0 0 26.3767,31.85232 248.01563,248.01563 0 0 1 -9.9943,-11.39621 248.01563,248.01563 0 0 1 -16.3824,-20.45611 z" /> <path style="fill:#f5c211;stroke:none;stroke-width:40.131;paint-order:stroke markers fill" d="m 517.40414,252.59599 a 248.01563,248.01563 0 0 1 0.61133,17.40411 248.01563,248.01563 0 0 1 -248.01535,248.01535 248.01563,248.01563 0 0 1 -17.40411,-0.61133 248.01563,248.01563 0 0 0 7.83932,46.78681 248.01563,248.01563 0 0 0 0,5.1e-4 248.01563,248.01563 0 0 0 10.4283,30.72009 248.01563,248.01563 0 0 0 43.7689,69.06555 248.01563,248.01563 0 0 0 9.99423,11.39621 248.01563,248.01563 0 0 0 12.99455,11.39672 248.01563,248.01563 0 0 0 11.39621,9.99422 248.01563,248.01563 0 0 0 5.1e-4,0 248.01563,248.01563 0 0 0 26.97407,18.0237 248.01563,248.01563 0 0 0 5.1e-4,0 248.01563,248.01563 0 0 0 29.0959,14.34848 248.01563,248.01563 0 0 0 20.2923,6.88847 248.01563,248.01563 0 0 0 10.42779,3.53984 248.01563,248.01563 0 0 0 5.2e-4,0 248.01563,248.01563 0 0 0 31.81821,6.32933 248.01563,248.01563 0 0 0 14.9686,1.50998 248.01563,248.01563 0 0 1 -0.61134,-17.4041 248.01563,248.01563 0 0 1 248.01536,-248.01536 248.01563,248.01563 0 0 1 17.4041,0.61134 248.01563,248.01563 0 0 0 -1.50998,-14.9686 248.01563,248.01563 0 0 0 -6.32933,-31.81821 248.01563,248.01563 0 0 0 0,-5.2e-4 248.01563,248.01563 0 0 0 -24.77679,-59.8165 248.01563,248.01563 0 0 0 -39.41413,-51.36534 248.01563,248.01563 0 0 0 -5.1e-4,-5.2e-4 248.01563,248.01563 0 0 0 -24.39076,-21.39043 248.01563,248.01563 0 0 0 -5.2e-4,0 248.01563,248.01563 0 0 0 -26.97406,-18.0237 248.01563,248.01563 0 0 0 -5.2e-4,0 248.01563,248.01563 0 0 0 -29.0959,-14.34848 248.01563,248.01563 0 0 0 -5.2e-4,0 248.01563,248.01563 0 0 0 -30.71957,-10.4283 248.01563,248.01563 0 0 0 -5.1e-4,0 248.01563,248.01563 0 0 0 -31.81822,-6.32933 248.01563,248.01563 0 0 0 -5.1e-4,0 248.01563,248.01563 0 0 0 -14.96808,-1.50999 z" /> </g> </g> </svg>`;
