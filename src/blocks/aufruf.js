import { html, raw, escapeAttr, ziel, markdownInline } from './_util.js';

/**
 * Aufruf — der Schluss einer Seite: eine Zeile, ein Satz, die eine Handlung.
 *
 * Der gelbe Knopf 'Mitglied werden' gehoert dorthin, wo jemand das Angebot gelesen hat, nicht vor
 * das erste Wort. Der Baustein steht am Ende einer Seite, vor dem Assistenten und der Fusszeile.
 * Er entscheidet nichts: Text, Ziel und Beschriftung kommen aus den Daten (der Preis aus den Fakten).
 * Es bleibt bei EINEM gelben Knopf je Seite; wer den Aufruf nutzt, laesst ihn im Aufmacher weg.
 */
export default {
  name: 'aufruf',
  label: 'Aufruf — Schlusszeile mit Knopf',
  schema: {
    titel:      { type: 'text',     default: '', label: 'Überschrift' },
    text:       { type: 'longtext', default: '', label: 'Satz darunter — **fett**, [Link](/ziel/)' },
    knopfLabel: { type: 'text',     default: 'Mitglied werden', label: 'Beschriftung des Knopfs' },
    knopfHref:  { type: 'text',     default: '/mitglied-werden/', label: 'Ziel des Knopfs' },
    grund:      { type: 'auswahl',  default: 'ruhig', label: 'Hintergrund', optionen: ['weiss', 'ruhig'] },
  },
  css: `
    .aufruf__zeile { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
      gap: var(--raum-3) var(--raum-5); }
    .aufruf__text { flex: 1 1 380px; max-width: 62ch; }
    .aufruf h2 { font-size: clamp(22px, 2.6vw, 30px); margin: 0 0 var(--raum-1); }
    .aufruf p { margin: 0; color: var(--text-leise); }
  `,
  render(data) {
    const z = ziel(data.knopfHref);
    return html`
      <section class="section aufruf${raw(data.grund === 'weiss' ? '' : ' section--ruhig')}"><div class="container">
        <div class="aufruf__zeile">
          <div class="aufruf__text">
            ${data.titel ? html`<h2>${data.titel}</h2>` : ''}
            ${data.text ? html`<p>${markdownInline(data.text)}</p>` : ''}
          </div>
          ${data.knopfLabel && z ? html`<a class="knopf" href="${raw(escapeAttr(z))}">${data.knopfLabel}</a>` : ''}
        </div>
      </div></section>`;
  },
};
