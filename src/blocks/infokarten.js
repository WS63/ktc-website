import { html, raw, markdownInline } from './_util.js';

export default {
  name: 'infokarten',
  label: 'Eckdaten',
  schema: {
    titel:  { type: 'text',  default: '', label: 'Überschrift' },
    karten: { type: 'liste', default: [], label: 'Eckdaten: label, wert, zusatz' },
    grund:  { type: 'auswahl', default: 'ruhig', label: 'Hintergrund',
              optionen: ['ruhig', 'weiss', 'anschluss'] },
    titelGroesse: { type: 'auswahl', default: 'normal', label: 'Größe der Überschrift', optionen: ['normal', 'gross'] },
    zaehlen: { type: 'auswahl', default: 'nein', label: 'Zahlen beim Sichtbarwerden hochzählen', optionen: ['nein', 'ja'] },
    angebotWert: { type: 'text', default: '', label: 'Angebotsband: die große Zahl' },
    angebotText: { type: 'text', default: '', label: 'Angebotsband: der Satz daneben' },
  },
  css: `
    .info__titel { font-size: clamp(22px, 2.6vw, 28px); margin-bottom: var(--raum-3); }
    .info__titel--gross { font-size: clamp(26px, 3.2vw, 36px); }
    /* 240 statt 170: bei 170 passten auf einen 820-Pixel-Schirm noch drei
       Karten nebeneinander, jede davon so schmal, dass die Erlaeuterung drei
       Zeilen brauchte und die dritte abgeschnitten wurde. Lieber frueher
       umbrechen und alles zeigen. Hier gemessen, nicht geschaetzt. */
    .info__gitter { display: grid; gap: var(--raum-2);
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    /* Dieselbe Form wie die Karten im 'cards'-Baustein: rundum ein dezenter
       Rahmen, runde Ecken, weisser Grund. Davor stand oben ein kraeftiger
       Balken — erst in vier Clubfarben, dann einfarbig. Beide Fassungen zogen
       den Blick auf die Kante statt auf die Zahl. Farbe traegt jetzt nur noch
       die Zahl: genau ein farbiges Element je Karte. */
    /* Rechtsbuendig: Label, Zahl und Erlaeuterung enden auf derselben Kante.
       Bei drei Karten nebeneinander gibt das drei saubere Kanten statt drei
       Flatterraender — und die Zahl steht da, wo das Auge sie in einer
       Aufstellung sucht. */
    .info { background: var(--grund); border: 1.5px solid var(--linie-stark);
      border-radius: var(--radius); padding: var(--raum-3); text-align: right; }
    .section--ruhig .info { background: var(--grund); }
    /* Das Label traegt die Betonung ueber Gewicht, nicht ueber Farbe.
       Farbig waere es ein zweites Signal neben der Kante — und Gelb kann
       auf Weiss ohnehin nie Textfarbe sein (1,66:1). */
    .info__label { font-size: 14px; text-transform: uppercase; letter-spacing: .07em;
      color: var(--text); font-weight: 600; margin-bottom: 10px; }
    /* Die Zahl ist die Botschaft der Karte — sie darf lauter sein als alles
       andere darin. Deshalb die groesste Stufe und volles Gewicht. */
    .info__wert { font-size: var(--fs-3xl); font-weight: 800; line-height: 1.05;
      letter-spacing: -.025em; color: var(--signal); }
    /* Die Erlaeuterung traegt zwei Zeilen, nicht mehr. Sie ordnet die Zahl
       ein, sie erzaehlt nichts — was laenger ist, gehoert in den Fliesstext
       darueber.
       ACHTUNG: line-clamp schneidet STUMM ab. Es ist die Notbremse, nicht der
       Entwurf — der Text muss von sich aus in zwei Zeilen passen. Beim Kuerzen
       bei 820 px nachsehen, dort sind die Karten am schmalsten. */
    /* Hochzaehlen (nur mit zaehlen: 'ja'): die Zahl steht in einem Kasten mit der Breite ihrer
       Ziffern, damit der Text daneben beim Zaehlen nicht wandert. Am Ende federt die ganze
       Zahl kurz (vergroessern, zurueckschwingen) — der Wert selbst schiesst nie ueber das Ziel
       hinaus, es stuende sonst kurz eine falsche Zahl da. */
    .info__zahl { display: inline-block; text-align: right; font-variant-numeric: tabular-nums; }
    @keyframes info-feder { 0% { transform: scale(1); } 38% { transform: scale(1.1); }
      68% { transform: scale(.97); } 100% { transform: scale(1); } }
    .info__wert--feder { transform-origin: right center;
      animation: info-feder .65s cubic-bezier(.34, 1.56, .64, 1); }
    @media (prefers-reduced-motion: reduce) { .info__wert--feder { animation: none; } }
    .info__zusatz { font-size: var(--fs-sm); color: var(--text-leise); margin-top: 10px;
      line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden; }
    /* 'anschluss': die Karten gehoeren zum Textabschnitt darueber, nicht zum
       naechsten. Die Trennlinie aus _theme.js zwischen zwei hellen Abschnitten
       waere hier eine Grenze, wo keine ist — und das obere Polster doppelt
       den Abstand, den der Text schon mitbringt. */
    .section--anschluss { border-top: none; padding-top: 0; }

    /* Das Angebot unter den Standardkarten: ein getoentes Band mit Signalkante, wie der
       Hinweis unter einer Tabelle — nur mit der Zahl vorn. Es steht fuer sich, damit
       die Standardkarten ruhig bleiben. */
    .info__angebot { display: flex; align-items: center; gap: var(--raum-3);
      margin-top: var(--raum-2); padding: var(--raum-2) var(--raum-3);
      background: var(--signal-leise); border-left: 4px solid var(--signal); }
    .info__angebot-wert { flex: none; font-size: var(--fs-3xl); font-weight: 800;
      line-height: 1.05; letter-spacing: -.025em; color: var(--signal); }
    .info__angebot-text { margin: 0; font-size: var(--fs-sm); line-height: 1.5; }
    @media (max-width: 560px) { .info__angebot { flex-direction: column; align-items: flex-start;
      gap: var(--raum-1); } }
  `,
  render(data) {
    // Mit 'zaehlen' steht der Wert zweimal da: sichtbar mit der Zahl in einem eigenen Kasten
    // (das Skript zaehlt ihn hoch, aria-hidden) und fertig fuer Vorleser. Ohne Skript oder
    // mit 'Bewegung reduzieren' bleibt es beim fertigen Wert.
    const wert = (w, zaehlt) => {
      const m = zaehlt ? String(w).match(/^(\D*?)(\d+)(\D*)$/) : null;
      if (!m) return html`<p class="info__wert">${w}</p>`;
      return html`<p class="info__wert"><span aria-hidden="true">${m[1]}<span class="info__zahl" data-bis="${m[2]}"
        style="min-width:${m[2].length}ch">${m[2]}</span>${m[3]}</span><span class="nur-vorleser">${w}</span></p>`;
    };
    const karten = (data.karten || []).map((k) => html`<div class="info">
      <p class="info__label">${k.label}</p>
      ${wert(k.wert, data.zaehlen === 'ja')}
      ${k.zusatz ? html`<p class="info__zusatz">${markdownInline(k.zusatz)}</p>` : ''}
    </div>`);
    return html`
      <section class="section${raw(
        data.grund === 'weiss' ? ''
        : data.grund === 'anschluss' ? ' section--anschluss'
        : ' section--ruhig')}"><div class="container">
        ${data.titel ? html`<h2 class="info__titel${raw(data.titelGroesse === 'gross' ? ' info__titel--gross' : '')}">${data.titel}</h2>` : ''}
        <div class="info__gitter">${karten}</div>
        ${data.angebotWert ? html`<div class="info__angebot">
          <span class="info__angebot-wert">${data.angebotWert}</span>
          <p class="info__angebot-text">${markdownInline(data.angebotText || '')}</p>
        </div>` : ''}
        ${data.zaehlen === 'ja' ? html`<script>${raw(SKRIPT)}</script>` : ''}
      </div></section>`;
  },
};

// Zaehlt jede Zahl EINMAL hoch, sobald sie zu sehen ist. Kein Skript noetig, damit die Seite
// stimmt: der Endwert steht im HTML. Wer 'Bewegung reduzieren' will oder einen Browser ohne
// IntersectionObserver hat, sieht den Endwert sofort.
const SKRIPT = `
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var DAUER = 1400, DAUER_KLEIN = 1680;   // eine einstellige Zahl braucht laenger, sonst ist sie sofort fertig
  var stufe = function (t) { return 1 - Math.pow(1 - t, 3); };
  var zahlen = document.querySelectorAll('.info__zahl[data-bis]:not([data-bereit])');
  var beobachter = new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (e) {
      if (!e.isIntersecting) return;
      beobachter.unobserve(e.target);
      zaehle(e.target);
    });
  }, { threshold: 0.6 });
  function zaehle(el) {
    var bis = parseInt(el.getAttribute('data-bis'), 10), start = null;
    var dauer = bis < 10 ? DAUER_KLEIN : DAUER;
    function schritt(jetzt) {
      if (start === null) start = jetzt;
      var t = Math.min(1, (jetzt - start) / dauer);
      el.textContent = Math.round(bis * stufe(t));
      if (t < 1) { requestAnimationFrame(schritt); return; }
      el.textContent = bis;
      var wert = el.closest('.info__wert');
      if (wert) wert.classList.add('info__wert--feder');
    }
    requestAnimationFrame(schritt);
  }
  zahlen.forEach(function (el) {
    el.setAttribute('data-bereit', '1');
    el.textContent = '0';
    beobachter.observe(el);
  });
})();
`;
