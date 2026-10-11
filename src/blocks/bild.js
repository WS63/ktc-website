import { html, raw, escapeAttr, ziel } from './_util.js';

export default {
  name: 'bild',
  label: 'Bild',
  schema: {
    pfad:    { type: 'image',    default: '', label: 'Bild' },
    alt:     { type: 'text',     default: '', label: 'Alt-Text (Pflicht)' },
    bildunterschrift: { type: 'text', default: '', label: 'Bildunterschrift' },
    breite:  { type: 'auswahl',  default: 'text', label: 'Breite',
               optionen: ['text', 'voll'] },
  },
  css: `
    .bild { margin: 0; }
    .bild--text { max-width: var(--breite-text); }
    /* Breite so gross wie moeglich, Hoehe hoechstens 72 % des Fensters. Ein
       Hochformat (Gruppenfoto 3:4) fuellte sonst die ganze Spaltenbreite und
       ist dann laenger als der Bildschirm — es wird schmaler, nicht beschnitten:
       bei einem Mannschaftsfoto waeren abgeschnittene Koepfe das schlimmere Uebel. */
    .bild img { border-radius: var(--radius); width: auto; max-width: 100%; max-height: 72vh;
      display: block; }
    .bild figcaption { font-size: 14px; color: var(--text-leise); margin-top: 10px; }
  `,
  render(data) {
    const p = ziel(data.pfad);
    // P6: kein Bild haelt nichts auf — der Abschnitt entfaellt einfach.
    if (!p) return '';
    // Alt-Text ist Pflicht. Fehlt er, ist das Bild fuer einen Vorleser Deko.
    const alt = data.alt || '';
    return html`
      <section class="section"><div class="container">
        <figure class="bild bild--${data.breite === 'voll' ? 'voll' : 'text'}">
          <img src="${raw(escapeAttr(p))}" alt="${raw(escapeAttr(alt))}" loading="lazy" decoding="async">
          ${data.bildunterschrift ? html`<figcaption>${data.bildunterschrift}</figcaption>` : ''}
        </figure>
      </div></section>`;
  },
};
