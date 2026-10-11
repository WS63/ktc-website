import { html, raw, escapeAttr, ziel, markdownInline } from './_util.js';

export default {
  name: 'richtext',
  label: 'Fließtext',
  schema: {
    titel:    { type: 'text',     default: '', label: 'Überschrift' },
    absaetze: { type: 'liste',    default: [], label: 'Absätze — **fett**, *kursiv*, [Text](/ziel/)' },
    anker:    { type: 'text',     default: '', label: 'Sprungmarke, z. B. jugend' },
    schluss:  { type: 'text',     default: '', label: 'Abschlusszeile, ruhig und grau' },
    bild:     { type: 'image',    default: '', label: 'Bild rechts neben dem Text' },
    bildAlt:  { type: 'text',     default: '', label: 'Alt-Text des Bildes (Pflicht, wenn ein Bild steht)' },
    bildStil: { type: 'auswahl',  default: 'foto', label: 'Art des Bildes', optionen: ['foto', 'logo'] },
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
    /* Text links, Bild rechts. Die Ueberschrift bleibt ueber beiden. Unter 760 px
       steht das Bild unter dem Text: ein schmales Hochformat neben drei Zeilen
       Text waere dort nur ein Streifen. */
    .text--bild .text__innen { display: grid; gap: var(--raum-5); align-items: start;
      grid-template-columns: minmax(0, 1fr) auto; }
    .text__bild { margin: 0; }
    .text__bild img { display: block; max-width: 100%; height: auto; }
    .text__bild--foto img { width: 320px; border-radius: var(--radius); }
    /* Ein Logo mit weissem Grund soll wie aufgedruckt wirken, nicht wie ein
       weisses Kaestchen auf der grauen Flaeche: 'multiply' laesst Weiss
       verschwinden und Farbe stehen. Hat die Datei echte Transparenz, aendert
       sich nichts — multiply auf Durchsichtigem ist durchsichtig. */
    .text__bild--logo img { width: 220px; mix-blend-mode: multiply; }
    @media (max-width: 760px) {
      .text--bild .text__innen { grid-template-columns: 1fr; gap: var(--raum-3); }
      .text__bild--logo img { width: 180px; }
    }
    .text__koerper a { color: var(--signal); text-decoration: none;
      border-bottom: 1px solid var(--signal); }
    .text__koerper a:hover { color: var(--signal-hover); border-color: var(--signal-hover); }
  `,
  render(data) {
    const absaetze = (data.absaetze || []).map((a) => html`<p>${markdownInline(a)}</p>`);
    // Nur Buchstaben, Ziffern und Bindestriche — alles andere waere ein
    // ungueltiger Anker und koennte Markup aufbrechen.
    const anker = String(data.anker || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const b = ziel(data.bild);
    const sektion = (innen) => html`
      <section class="section${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}${raw(b ? ' text--bild' : '')}"${
        anker ? raw(` id="${escapeAttr(anker)}"`) : ''}><div class="container">${innen}</div></section>`;
    const text = html`<div class="text__koerper">${absaetze}</div>
        ${data.schluss ? html`<p class="text__schluss">${data.schluss}</p>` : ''}`;
    return sektion(html`
        ${data.titel ? html`<h2 class="text__titel">${data.titel}</h2>` : ''}
        ${b
          ? html`<div class="text__innen">
              <div>${text}</div>
              <figure class="text__bild text__bild--${data.bildStil === 'logo' ? 'logo' : 'foto'}">
                <img src="${raw(escapeAttr(b))}" alt="${raw(escapeAttr(data.bildAlt || ''))}"
                     loading="lazy" decoding="async">
              </figure>
            </div>`
          : text}`);
  },
};
