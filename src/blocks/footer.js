import { html, raw, escapeAttr, ziel, istExtern } from './_util.js';

export default {
  name: 'footer',
  label: 'Fußzeile',
  schema: {
    zeile: { type: 'text', default: '', label: 'Zeile links' },
    baum:  { type: 'auto', default: [], label: 'Links — werden unter Navigation gepflegt' },
  },
  css: `
    /* Dunkel, ueber denselben Mechanismus wie .section--dunkel: die Klasse
       setzt dieselben Variablennamen neu, der Baustein kennt keine zweite
       Farbe. Die Zeile schliesst die Seite ab — wie das dunkle Foto im
       Aufmacher sie eroeffnet — und trennt sich ohne Linie von der hellen
       Flaeche darueber. Gemessen gegen #1e1e18: Text 5,2:1 und mehr. */
    .fuss { background: var(--grund); color: var(--text); }
    .fuss__innen { display: flex; gap: var(--raum-3); flex-wrap: wrap;
      align-items: center; padding-top: var(--raum-4); padding-bottom: var(--raum-4);
      font-size: 15px; color: var(--text-leise); }
    .fuss__innen span { margin-right: auto; }
    /* Weiss statt Blau: auf dunklem Grund wirkt das Signalblau wie ein
       Fremdkoerper. Dass es Links sind, zeigt der Strich beim Darueberfahren
       — und die Zeile steht ohnehin nur aus Links. */
    .fuss__innen a { color: var(--text); text-decoration: none;
      border-bottom: 1px solid transparent; }
    .fuss__innen a:hover { border-bottom-color: var(--text); }
  `,
  render(data) {
    const links = (data.baum || []).map((p) => {
      const z = ziel(p.href);
      if (!z) return '';
      const extern = istExtern(z) ? raw(' target="_blank" rel="noopener noreferrer"') : '';
      return html`<a href="${raw(escapeAttr(z))}"${extern}>${p.label}</a>`;
    });
    return html`
      <footer class="fuss section--dunkel"><div class="container fuss__innen">
        <span>${data.zeile}</span>${links}
      </div></footer>`;
  },
};
