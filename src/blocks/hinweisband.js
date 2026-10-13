import { html, raw, markdownInline } from './_util.js';

/**
 * Hinweisband — ein leises Band mit einer Marke und einem Satz.
 *
 * Fuer das, was jemand wissen sollte, BEVOR er etwas tut: zum Beispiel der Weg ueber die FAQ
 * und den Assistenten, bevor man schreibt. Getoent wie das Angebotsband der Eckdaten, aber
 * ohne Zahl und ohne Knopf. Die Links stehen im Text, der Baustein entscheidet nichts.
 */
export default {
  name: 'hinweisband',
  label: 'Hinweisband',
  schema: {
    titel: { type: 'text',     default: '', label: 'Marke, kurz und fett' },
    text:  { type: 'longtext', default: '', label: 'Text — **fett**, [Link](/ziel/)' },
  },
  css: `
    .hinweisband { background: var(--signal-leise); padding: var(--raum-3) var(--raum-4);
      border-radius: var(--r-lg); }
    .hinweisband__titel { font-size: var(--fs-md); font-weight: 700; line-height: 1.25;
      color: var(--signal); margin: 0 0 6px; }
    .hinweisband__text { margin: 0; font-size: var(--fs-md); line-height: 1.5; max-width: 82ch; }
    .hinweisband__text a { color: var(--signal); font-weight: 600; }
    .section--band { padding: var(--raum-4) 0 0; }
    .section--band + .section { border-top: none; }
  `,
  render(data) {
    return html`
      <section class="section section--band"><div class="container">
        <div class="hinweisband">
          ${data.titel ? html`<p class="hinweisband__titel">${data.titel}</p>` : ''}
          <p class="hinweisband__text">${markdownInline(data.text || '')}</p>
        </div>
      </div></section>`;
  },
};
