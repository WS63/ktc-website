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
    bildStil: { type: 'auswahl',  default: 'foto', label: 'Art des Bildes', optionen: ['foto', 'logo', 'logoklein', 'karte'] },
    bildLink: { type: 'text', default: '', label: 'Bild als Link (öffnet in neuem Fenster)' },
    bildUnterschrift: { type: 'text', default: '', label: 'Zeile unter dem Bild, z. B. Quellenangabe' },
    // Mehrere Fotos in einer schmalen Spalte neben dem Text, jedes nur mit einer
    // Unterschrift — keine Zuordnung zu einer Textstelle, keine Position im Text.
    // Das ist einfacher zu pflegen: Foto hinzufuegen, ein paar Worte dazu, fertig.
    bilder:   { type: 'liste',    default: [],
                label: 'Fotos neben dem Text: pfad, gross (zum Vergroessern), alt, unterschrift, format (quer oder hoch)' },
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
    /* Eine Karte ist breiter als ein Foto: sie soll lesbar sein, nicht Beiwerk. */
    .text--bild.text--karte .text__innen { grid-template-columns: minmax(0, 1fr) minmax(0, 540px); }
    .text__bild--karte img { width: 100%; border-radius: var(--radius); border: 1px solid var(--linie); }
    .text__bild figcaption { font-size: 12px; color: var(--text-still); margin-top: 6px; }
    /* Ein Logo mit weissem Grund soll wie aufgedruckt wirken, nicht wie ein
       weisses Kaestchen auf der grauen Flaeche: 'multiply' laesst Weiss
       verschwinden und Farbe stehen. Hat die Datei echte Transparenz, aendert
       sich nichts — multiply auf Durchsichtigem ist durchsichtig. */
    .text__bild--logo img { width: 220px; mix-blend-mode: multiply; }
    /* Hohes Logo mit Anschrift und Siegeln (Tennisschule): halb so breit, sonst aendert sich nichts. */
    .text__bild--logoklein img { width: 120px; mix-blend-mode: multiply; }
    @media (max-width: 760px) {
      .text--bild .text__innen { grid-template-columns: 1fr; gap: var(--raum-3); }
      .text__bild--logo img { width: 180px; }
      .text__bild--logoklein img { width: 110px; }
    }
    /* Fotos neben dem Text: zwei feste Formate, damit eine Spalte aus drei Bildern
       ruhig aussieht, egal was fotografiert wurde.
         quer  4:3   300 x 225 px
         hoch  3:4   240 x 320 px
       Zugeschnitten wird mit Schwerpunkt im oberen Drittel — bei Gruppenfotos
       sind dort die Gesichter. Ein Klick oeffnet das ganze Bild. */
    .text--fotos .text__innen { display: grid; gap: var(--raum-5); align-items: start;
      grid-template-columns: minmax(0, 1fr) 300px; }
    .text__fotos { display: flex; flex-direction: column; gap: var(--raum-3); }
    .text__foto { margin: 0; }
    .text__foto a { display: block; }
    .text__foto img { display: block; width: 100%; object-fit: cover; object-position: 50% 25%;
      border-radius: var(--radius); background: var(--flaeche); }
    .text__foto--quer img { aspect-ratio: 4 / 3; }
    .text__foto--hoch { width: 240px; }
    .text__foto--hoch img { aspect-ratio: 3 / 4; }
    .text__foto figcaption { font-size: 14px; color: var(--text-leise); margin-top: 6px; line-height: 1.4; }
    /* Schmal: die Fotos kommen unter den Text, nebeneinander soweit es passt. */
    @media (max-width: 860px) {
      .text--fotos .text__innen { grid-template-columns: 1fr; gap: var(--raum-4); }
      .text__fotos { flex-direction: row; flex-wrap: wrap; gap: var(--raum-2); }
      .text__foto--quer { width: min(300px, 100%); }
      .text__foto--hoch { width: min(240px, 100%); }
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
    const bildLink = ziel(data.bildLink);
    const fotos = (data.bilder || []).filter((f) => ziel(f.pfad));
    const sektion = (innen) => html`
      <section class="section${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}${raw(b ? ' text--bild' : fotos.length ? ' text--fotos' : '')}${raw(b && data.bildStil === 'karte' ? ' text--karte' : '')}"${
        anker ? raw(` id="${escapeAttr(anker)}"`) : ''}><div class="container">${innen}</div></section>`;
    const text = html`<div class="text__koerper">${absaetze}</div>
        ${data.schluss ? html`<p class="text__schluss">${data.schluss}</p>` : ''}`;
    const titel = data.titel ? html`<h2 class="text__titel">${data.titel}</h2>` : '';
    // Das hohe Logo beginnt auf Hoehe der Ueberschrift: dann steht die Ueberschrift
    // in der Textspalte und nicht ueber beiden. Sonst haengt es unter der Titelzeile
    // und rechts oben bleibt eine Luecke.
    const titelLinks = b && data.bildStil === 'logoklein';
    return sektion(html`
        ${titelLinks ? '' : titel}
        ${fotos.length
          ? html`<div class="text__innen">
              <div>${text}</div>
              <div class="text__fotos">${fotos.map((f) => {
                const gross = ziel(f.gross) || ziel(f.pfad);
                return html`<figure class="text__foto text__foto--${f.format === 'hoch' ? 'hoch' : 'quer'}">
                  <a href="${raw(escapeAttr(gross))}" target="_blank" rel="noopener">
                    <img src="${raw(escapeAttr(ziel(f.pfad)))}" alt="${raw(escapeAttr(f.alt || ''))}"
                         loading="lazy" decoding="async"></a>
                  ${f.unterschrift ? html`<figcaption>${f.unterschrift}</figcaption>` : ''}
                </figure>`;
              })}</div>
            </div>`
          : b
          ? html`<div class="text__innen">
              <div>${titelLinks ? titel : ''}${text}</div>
              <figure class="text__bild text__bild--${['logo', 'logoklein', 'karte'].includes(data.bildStil) ? data.bildStil : 'foto'}">
                ${bildLink
                  ? html`<a href="${raw(escapeAttr(bildLink))}" target="_blank" rel="noopener noreferrer"><img src="${raw(escapeAttr(b))}"
                      alt="${raw(escapeAttr(data.bildAlt || ''))}" loading="lazy" decoding="async"></a>`
                  : html`<img src="${raw(escapeAttr(b))}" alt="${raw(escapeAttr(data.bildAlt || ''))}"
                      loading="lazy" decoding="async">`}
                ${data.bildUnterschrift ? html`<figcaption>${data.bildUnterschrift}</figcaption>` : ''}
              </figure>
            </div>`
          : text}`);
  },
};
