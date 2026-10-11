import { html, raw, escapeAttr, markdownInline } from './_util.js';

export default {
  name: 'richtext',
  label: 'Fließtext',
  schema: {
    titel:    { type: 'text',     default: '', label: 'Überschrift' },
    absaetze: { type: 'liste',    default: [], label: 'Absätze — **fett**, *kursiv*, [Text](/ziel/)' },
    anker:    { type: 'text',     default: '', label: 'Sprungmarke, z. B. jugend' },
    schluss:  { type: 'text',     default: '', label: 'Abschlusszeile, ruhig und grau' },
    grund:    { type: 'auswahl',  default: 'weiss', label: 'Hintergrund',
                optionen: ['weiss', 'ruhig'] },
  },
  css: `
    /* Die Ueberschrift ist ruhig gesetzt: grau statt schwarz, normales
       Gewicht, keine enge Laufweite. Sie kuendigt den Text an, sie ruft nicht.
       Schwarz und halbfett stand sie vorher wie eine zweite Marke neben dem
       Aufmacher. */
    .text__titel { font-size: clamp(26px, 3.2vw, 36px); font-weight: 400;
      letter-spacing: 0; color: var(--text-leise);
      margin-bottom: var(--raum-3); max-width: 28ch; }
    .text__koerper { max-width: var(--breite-text); }
    /* Mehr Luft zwischen den Absaetzen als innerhalb: erst dadurch liest sich
       der Block als mehrere Gedanken und nicht als eine lange Wand. */
    .text__koerper p + p { margin-top: var(--raum-3); }
    /* Die Abschlusszeile — ein Claim, kein Satz. Gross und grau, nicht fett:
       Fettung macht sie zum Befehl, Grau laesst sie ausklingen. */
    .text__schluss { margin-top: var(--raum-4); font-size: clamp(22px, 2.6vw, 28px);
      font-weight: 400; color: var(--text-leise); max-width: var(--breite-text); }
    .text__koerper a { color: var(--signal); text-decoration: none;
      border-bottom: 1px solid var(--signal); }
    .text__koerper a:hover { color: var(--signal-hover); border-color: var(--signal-hover); }
  `,
  render(data) {
    const absaetze = (data.absaetze || []).map((a) => html`<p>${markdownInline(a)}</p>`);
    // Nur Buchstaben, Ziffern und Bindestriche — alles andere waere ein
    // ungueltiger Anker und koennte Markup aufbrechen.
    const anker = String(data.anker || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    return html`
      <section class="section${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}"${
        anker ? raw(` id="${escapeAttr(anker)}"`) : ''}><div class="container">
        ${data.titel ? html`<h2 class="text__titel">${data.titel}</h2>` : ''}
        <div class="text__koerper">${absaetze}</div>
        ${data.schluss ? html`<p class="text__schluss">${data.schluss}</p>` : ''}
      </div></section>`;
  },
};
