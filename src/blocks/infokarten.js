import { html, raw, markdownInline } from './_util.js';

export default {
  name: 'infokarten',
  label: 'Eckdaten',
  schema: {
    titel:  { type: 'text',  default: '', label: 'Überschrift' },
    karten: { type: 'liste', default: [], label: 'Eckdaten: label, wert, zusatz' },
    grund:  { type: 'auswahl', default: 'ruhig', label: 'Hintergrund', optionen: ['ruhig', 'weiss'] },
  },
  css: `
    .info__titel { font-size: clamp(22px, 2.6vw, 28px); margin-bottom: var(--raum-3); }
    .info__gitter { display: grid; gap: var(--raum-2);
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
    /* Eine Kante oben, abwechselnd Signalblau und dunkles Grau. Erst standen
       hier vier Clubfarben — nebeneinander wurden sie unruhig und zogen den
       Blick auf die Kante statt auf die Zahl. Zwei ruhige Toene im Wechsel
       gliedern genauso, ohne zu flackern. */
    .info { background: var(--grund); border: 1px solid var(--linie);
      border-top: 4px solid var(--signal);
      border-radius: 0 0 var(--radius) var(--radius); padding: var(--raum-3); }
    .section--ruhig .info { background: var(--grund); }
    .info:nth-child(2n) { border-top-color: var(--linie-akzent); }
    /* Das Label traegt die Betonung ueber Gewicht, nicht ueber Farbe.
       Farbig waere es ein zweites Signal neben der Kante — und Gelb kann
       auf Weiss ohnehin nie Textfarbe sein (1,66:1). */
    .info__label { font-size: 12px; text-transform: uppercase; letter-spacing: .07em;
      color: var(--text); font-weight: 600; margin-bottom: 8px; }
    .info__wert { font-size: var(--fs-2xl); font-weight: 500; line-height: 1.1;
      letter-spacing: -.02em; }
    .info__zusatz { font-size: 14px; color: var(--text-leise); margin-top: 8px; line-height: 1.5; }
  `,
  render(data) {
    const karten = (data.karten || []).map((k) => html`<div class="info">
      <p class="info__label">${k.label}</p>
      <p class="info__wert">${k.wert}</p>
      ${k.zusatz ? html`<p class="info__zusatz">${markdownInline(k.zusatz)}</p>` : ''}
    </div>`);
    return html`
      <section class="section${raw(data.grund === 'weiss' ? '' : ' section--ruhig')}"><div class="container">
        ${data.titel ? html`<h2 class="info__titel">${data.titel}</h2>` : ''}
        <div class="info__gitter">${karten}</div>
      </div></section>`;
  },
};
