import { html, raw, escapeAttr, ziel, istExtern } from './_util.js';

export default {
  name: 'footer',
  label: 'Fußzeile',
  schema: {
    zeile: { type: 'text', default: '', label: 'Zeile links' },
    baum:  { type: 'auto', default: [], label: 'Links — werden unter Navigation gepflegt' },
  },
  css: `
    .fuss { border-top: 1px solid var(--linie); background: var(--flaeche); }
    .fuss__innen { display: flex; gap: var(--raum-3); flex-wrap: wrap;
      align-items: center; padding-top: var(--raum-3); padding-bottom: var(--raum-3);
      font-size: 15px; color: var(--text-leise); }
    .fuss__innen span { margin-right: auto; }
    .fuss__innen a { color: var(--signal); text-decoration: none; }
    .fuss__innen a:hover { text-decoration: underline; }
  `,
  render(data) {
    const links = (data.baum || []).map((p) => {
      const z = ziel(p.href);
      if (!z) return '';
      const extern = istExtern(z) ? raw(' target="_blank" rel="noopener noreferrer"') : '';
      return html`<a href="${raw(escapeAttr(z))}"${extern}>${p.label}</a>`;
    });
    return html`
      <footer class="fuss"><div class="container fuss__innen">
        <span>${data.zeile}</span>${links}
      </div></footer>`;
  },
};
