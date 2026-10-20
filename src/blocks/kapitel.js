import { html, raw, escapeAttr, ziel, istExtern, markdownInline } from './_util.js';

/**
 * Kapitel — ein Teaser auf der Startseite: warum man kommt, mit Zahlen, Bild im Rahmen und Link.
 *
 * Die Startseite sagt, WARUM man zum KTC kommt (ein Nutzen, bis zu drei Zahlen, ein Satz), die
 * Unterseite sagt, was genau man dort findet. Darum steht hier keine Auskunft (keine Zeiten, keine
 * Telefonnummern), sondern Links zu den Unterseiten: eine Auskunft gehoert an EINEN Ort (P3).
 *
 * Aufbau wie ein Streifen, aber lauter gesetzt: grosse Ueberschrift, grosse Zahlen in Signalblau,
 * das Foto im Rahmen neben dem Text. Kapitel stehen auf weissem oder grauem Grund im Wechsel; nur der
 * Aufmacher darueber ist ein Vollbild. So bleibt die Seite ruhig: ein grosses Bild, dann Klarheit.
 *
 * Effekte sind Zugabe: beim Scrollen blenden Text und Zahlen versetzt ein, das Foto zoomt im
 * Rahmen leicht heraus (CSS-Scroll-Animation, nur wo der Browser sie kann). Ohne sie oder bei
 * 'Bewegung reduzieren' steht alles ruhig da (P6).
 */
export default {
  name: 'kapitel',
  label: 'Kapitel (Teaser mit Bild, Zahlen, Link)',
  schema: {
    anker:     { type: 'text',  default: '', label: 'Sprungmarke, z. B. ort' },
    kicker:    { type: 'text',  default: '', label: 'Kleine Zeile darüber' },
    titel:     { type: 'text',  default: '', label: 'Überschrift (der Nutzen)' },
    text:      { type: 'longtext', default: '', label: 'Ein Satz bis zwei' },
    bild:      { type: 'image', default: '', label: 'Bild im Rahmen' },
    bildAlt:   { type: 'text',  default: '', label: 'Alt-Text des Bildes' },
    fakten:    { type: 'liste', default: [], label: 'Zahlen (höchstens drei): wert, label' },
    links:     { type: 'liste', default: [], label: 'Links zu den Unterseiten: label, href' },
    haelften:  { type: 'liste', default: [], label: 'Zwei Hälften nebeneinander statt Text und Bild: label, titel, text, bild, bildAlt, fakten, linkLabel, linkHref' },
    seite:     { type: 'auswahl', default: 'rechts', label: 'Bild steht', optionen: ['rechts', 'links'] },
    grund:     { type: 'auswahl', default: 'weiss', label: 'Hintergrund', optionen: ['weiss', 'ruhig'] },
  },
  css: `
    .kapitel__gitter { display: grid; gap: var(--raum-5); align-items: center;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); }
    .kapitel--links .kapitel__gitter { grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); }
    .kapitel--links .kapitel__bild { order: -1; }
    .kapitel__kicker { font-size: 13px; letter-spacing: .12em; text-transform: uppercase;
      color: var(--signal); margin: 0 0 var(--raum-1); }
    .kapitel__titel { font-size: clamp(30px, 4.2vw, 52px); font-weight: 700; line-height: 1.06;
      letter-spacing: -.02em; margin: 0 0 var(--raum-2); max-width: 18ch; }
    .kapitel__text { font-size: var(--fs-md); line-height: 1.6; color: var(--text-leise);
      max-width: 46ch; margin: 0 0 var(--raum-3); }
    .kapitel__fakten { display: flex; flex-wrap: wrap; gap: var(--raum-2) var(--raum-4);
      list-style: none; padding: 0; margin: 0 0 var(--raum-3); }
    .kapitel__wert { display: block; font-size: clamp(38px, 4.6vw, 58px); font-weight: 800;
      line-height: 1; letter-spacing: -.02em; color: var(--signal); }
    .kapitel__label { display: block; font-size: 15px; color: var(--text-leise); margin-top: 6px; }
    .kapitel__links { display: flex; flex-wrap: wrap; gap: var(--raum-2); }
    .kapitel__links--unten { margin-top: var(--raum-4); }

    /* Das Foto im Rahmen: feste Form, damit jedes Kapitel gleich aufgebaut ist, egal wie das
       Original geschnitten ist. */
    .kapitel__bild { position: relative; overflow: hidden; border-radius: var(--r-lg);
      aspect-ratio: 4 / 3; background: var(--erhoben); margin: 0; }
    .kapitel__bild img { position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; display: block; }

    @media (max-width: 860px) {
      .kapitel__gitter, .kapitel--links .kapitel__gitter { grid-template-columns: minmax(0, 1fr); gap: var(--raum-3); }
      .kapitel__bild, .kapitel--links .kapitel__bild { order: -1; aspect-ratio: 16 / 10; }
    }


    /* Zwei Haelften: das Kapitel stellt zwei Seiten einer Sache nebeneinander (Wettkampf und Hobby).
       Kopf oben, darunter zwei gleich gebaute Karten mit Foto, Satz und Link. */
    .kapitel--zwei .kapitel__gitter { display: block; }
    .kapitel--zwei .kapitel__titel { max-width: 22ch; }
    .kapitel--zwei .kapitel__text { max-width: 60ch; }
    .kapitel__haelften { display: grid; gap: var(--raum-4); margin-top: var(--raum-4);
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    .kapitel__haelfte { display: flex; flex-direction: column; gap: var(--raum-2); }
    .kapitel__haelfte .kapitel__bild { aspect-ratio: 16 / 10; }
    .kapitel__haelfte-label { font-size: 13px; letter-spacing: .12em; text-transform: uppercase;
      color: var(--signal); margin: var(--raum-1) 0 0; }
    .kapitel__haelfte-titel { font-size: clamp(24px, 2.8vw, 34px); font-weight: 700; line-height: 1.1;
      letter-spacing: -.015em; margin: 0; }
    .kapitel__haelfte-text { font-size: var(--fs-md); line-height: 1.6; color: var(--text-leise); margin: 0; }
    .kapitel__haelfte .kapitel__fakten { margin: 0; }
    .kapitel__haelfte .kapitel__wert { font-size: clamp(34px, 4vw, 46px); }
    .kapitel__haelfte .kapitel__link { align-self: flex-start; }
    @media (max-width: 640px) {
      .kapitel__haelften { grid-template-columns: minmax(0, 1fr); gap: var(--raum-5); }
    }

    /* Effekte beim Scrollen, nur wo der Browser Scroll-Animationen kann. */
    @supports (animation-timeline: view()) {
      @media (prefers-reduced-motion: no-preference) {
        .kapitel__bild img { animation: kapitel-zoom linear both; animation-timeline: view();
          animation-range: entry 0% exit 100%; }
        .kapitel__ein { animation: kapitel-ein ease-out both; animation-timeline: view();
          animation-range: entry calc(6% + var(--k, 0) * 6%) entry calc(40% + var(--k, 0) * 6%); }
      }
    }
    @keyframes kapitel-zoom { from { transform: scale(1.12); } to { transform: scale(1); } }
    @keyframes kapitel-ein { from { opacity: 0; transform: translateY(22px); }
                             to   { opacity: 1; transform: none; } }
  `,
  render(data) {
    const b = ziel(data.bild);
    const marke = String(data.anker || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    let k = 0;
    // Jedes Teil bekommt seine Stufe: es blendet etwas spaeter ein als das davor.
    const stufe = () => ` kapitel__ein" style="--k: ${k++}`;

    const fakten = (data.fakten || []).filter((f) => f && f.wert).slice(0, 3).map((f) =>
      html`<li><span class="kapitel__wert">${f.wert}</span><span class="kapitel__label">${f.label}</span></li>`);

    const links = (data.links || []).map((l) => {
      const z = ziel(l?.href);
      if (!z || !l.label) return '';
      const extern = istExtern(z) ? raw(' target="_blank" rel="noopener noreferrer"') : '';
      return html`<a class="pille kapitel__link" href="${raw(escapeAttr(z))}"${extern}>${l.label} →</a>`;
    });

    const srcset = b && data.srcsets?.[b]
      ? raw(` srcset="${escapeAttr(data.srcsets[b])}" sizes="(max-width: 860px) 100vw, 45vw"`) : '';

    const leib = html`<div class="kapitel__leib">
        ${data.kicker ? html`<p class="kapitel__kicker${raw(stufe())}">${data.kicker}</p>` : ''}
        ${data.titel ? html`<h2 class="kapitel__titel${raw(stufe())}">${data.titel}</h2>` : ''}
        ${data.text ? html`<p class="kapitel__text${raw(stufe())}">${markdownInline(data.text)}</p>` : ''}
        ${fakten.length ? html`<ul class="kapitel__fakten${raw(stufe())}">${fakten}</ul>` : ''}
        ${links.some(Boolean) ? html`<div class="kapitel__links${raw(stufe())}">${links}</div>` : ''}
      </div>`;

    // P6: fehlt das Bild, steht das Kapitel trotzdem, der Text ruecke auf die volle Breite.
    const bild = b ? html`<figure class="kapitel__bild"><img src="${raw(escapeAttr(b))}"${srcset}
        alt="${raw(escapeAttr(data.bildAlt || ''))}" loading="lazy" decoding="async"></figure>` : '';

    // Zwei Haelften statt Text und Bild nebeneinander.
    const haelften = (data.haelften || []).slice(0, 2).map((h) => {
      const hb = ziel(h?.bild);
      const hz = ziel(h?.linkHref);
      const hf = (h?.fakten || []).filter((f) => f && f.wert).slice(0, 1).map((f) =>
        html`<li><span class="kapitel__wert">${f.wert}</span><span class="kapitel__label">${f.label}</span></li>`);
      const hs = hb && data.srcsets?.[hb]
        ? raw(` srcset="${escapeAttr(data.srcsets[hb])}" sizes="(max-width: 640px) 100vw, 45vw"`) : '';
      return html`<article class="kapitel__haelfte${raw(stufe())}">
          ${hb ? html`<figure class="kapitel__bild"><img src="${raw(escapeAttr(hb))}"${hs}
              alt="${raw(escapeAttr(h.bildAlt || ''))}" loading="lazy" decoding="async"></figure>` : ''}
          ${h.label ? html`<p class="kapitel__haelfte-label">${h.label}</p>` : ''}
          ${h.titel ? html`<h3 class="kapitel__haelfte-titel">${h.titel}</h3>` : ''}
          ${h.text ? html`<p class="kapitel__haelfte-text">${markdownInline(h.text)}</p>` : ''}
          ${hf.length ? html`<ul class="kapitel__fakten">${hf}</ul>` : ''}
          ${h.linkLabel && hz ? html`<a class="pille kapitel__link" href="${raw(escapeAttr(hz))}">${h.linkLabel} →</a>` : ''}
        </article>`;
    });

    if (haelften.length) {
      return html`
        <section class="section kapitel kapitel--zwei${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}"${marke ? raw(` id="${marke}"`) : ''}>
          <div class="container kapitel__gitter">
            ${data.kicker ? html`<p class="kapitel__kicker${raw(stufe())}">${data.kicker}</p>` : ''}
            ${data.titel ? html`<h2 class="kapitel__titel${raw(stufe())}">${data.titel}</h2>` : ''}
            ${data.text ? html`<p class="kapitel__text${raw(stufe())}">${markdownInline(data.text)}</p>` : ''}
            <div class="kapitel__haelften">${haelften}</div>
            ${links.some(Boolean) ? html`<div class="kapitel__links kapitel__links--unten${raw(stufe())}">${links}</div>` : ''}
          </div>
        </section>`;
    }

    return html`
      <section class="section kapitel${raw(data.seite === 'links' ? ' kapitel--links' : '')}${raw(
        data.grund === 'ruhig' ? ' section--ruhig' : '')}"${marke ? raw(` id="${marke}"`) : ''}>
        <div class="container kapitel__gitter">${leib}${bild}</div>
      </section>`;
  },
};
