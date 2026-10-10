import { html, raw, markdownInline } from './_util.js';

export default {
  name: 'infokarten',
  label: 'Eckdaten',
  schema: {
    titel:  { type: 'text',  default: '', label: 'Überschrift' },
    karten: { type: 'liste', default: [], label: 'Eckdaten: label, wert, zusatz' },
    grund:  { type: 'auswahl', default: 'ruhig', label: 'Hintergrund',
              optionen: ['ruhig', 'weiss', 'anschluss'] },
  },
  css: `
    .info__titel { font-size: clamp(22px, 2.6vw, 28px); margin-bottom: var(--raum-3); }
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
    .info__zusatz { font-size: var(--fs-sm); color: var(--text-leise); margin-top: 10px;
      line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden; }
    /* 'anschluss': die Karten gehoeren zum Textabschnitt darueber, nicht zum
       naechsten. Die Trennlinie aus _theme.js zwischen zwei hellen Abschnitten
       waere hier eine Grenze, wo keine ist — und das obere Polster doppelt
       den Abstand, den der Text schon mitbringt. */
    .section--anschluss { border-top: none; padding-top: 0; }
  `,
  render(data) {
    const karten = (data.karten || []).map((k) => html`<div class="info">
      <p class="info__label">${k.label}</p>
      <p class="info__wert">${k.wert}</p>
      ${k.zusatz ? html`<p class="info__zusatz">${markdownInline(k.zusatz)}</p>` : ''}
    </div>`);
    return html`
      <section class="section${raw(
        data.grund === 'weiss' ? ''
        : data.grund === 'anschluss' ? ' section--anschluss'
        : ' section--ruhig')}"><div class="container">
        ${data.titel ? html`<h2 class="info__titel">${data.titel}</h2>` : ''}
        <div class="info__gitter">${karten}</div>
      </div></section>`;
  },
};
