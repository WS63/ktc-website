import { html, raw, escapeAttr, ziel, istExtern } from './_util.js';

export default {
  name: 'nav',
  label: 'Kopfzeile mit Menü',
  schema: {
    marke:      { type: 'text', default: '', label: 'Name neben dem Logo' },
    baum:       { type: 'auto', default: [], label: 'Menü — wird unter Navigation gepflegt' },
    aktionLabel:{ type: 'text', default: '', label: 'Rechter Link' },
    aktionHref: { type: 'text', default: '', label: 'Ziel des rechten Links' },
    knopfLabel: { type: 'text', default: '', label: 'Knopf in der Leiste' },
    knopfHref:  { type: 'text', default: '', label: 'Ziel des Knopfs' },
  },
  css: `
    .kopf { border-bottom: 1px solid var(--linie); background: var(--grund);
      position: sticky; top: 0; z-index: 20; }
    .kopf__innen { display: flex; align-items: center; gap: var(--raum-4);
      padding-top: 14px; padding-bottom: 14px; }
    .kopf__marke { display: flex; align-items: center; gap: 10px; margin-right: auto;
      text-decoration: none; color: var(--text); flex: none; }
    .kopf__marke b { font-weight: 500; font-size: 17px; white-space: nowrap; }
        /* Die Vollfassung mit weissem Grund und gruenem Rahmen, quadratisch.
       Als Datei, nicht inline: 15 KB in jeder Seite waeren teurer als die eine
       Anfrage. Faellt sie aus, fehlt das Zeichen und sonst nichts (P6) — der
       Vereinsname steht daneben als Text und traegt die Marke allein. */
    .kopf__zeichen { height: 40px; width: 40px; display: block; flex: none; }
    .kopf__menue { display: flex; gap: var(--raum-3); align-items: center;
      font-size: 17px; }
    .kopf__menue a { color: var(--text); text-decoration: none; padding: 6px 0;
      border-bottom: 2px solid transparent; white-space: nowrap; }
    .kopf__menue a:hover { color: var(--signal); border-bottom-color: var(--signal); }
    .kopf__jetzt { color: var(--signal); text-decoration: none; white-space: nowrap;
      font-size: 17px; flex: none; }
    .kopf__jetzt:hover { text-decoration: underline; text-underline-offset: 3px; }

    /* Der Knopf in der Leiste fuehrt zur einen Handlung — auf JEDER Seite.
       Er ist blau umrandet, nicht gelb: Gelb bleibt dem einen Knopf im
       Aufmacher vorbehalten. Zwei gelbe Knoepfe auf einem Bildschirm, und
       keiner ruft mehr lauter als der andere. */
    .kopf__knopf { flex: none; white-space: nowrap; text-decoration: none;
      font-size: 15px; font-weight: 500; padding: 9px 20px;
      border-radius: var(--radius-knopf); color: var(--signal);
      border: 1.5px solid var(--signal); background: transparent;
      transition: background .12s ease, color .12s ease; }
    .kopf__knopf:hover { background: var(--signal); color: var(--text-hell, #fff); }

    /* Der Schalter ist nur auf schmalen Schirmen da. Ohne JavaScript bedienbar:
       ein verstecktes Kontrollkaestchen traegt den Zustand. Dadurch funktioniert
       das Menue auch, wenn ein Skript nicht laedt (P6). */
    .kopf__schalter { display: none; }
    .kopf__klappe { display: none; }

    @media (max-width: 800px) {
      .kopf__innen { flex-wrap: wrap; gap: var(--raum-2); }
      .kopf__klappe { display: flex; align-items: center; gap: 7px; cursor: pointer;
        font-size: 15px; color: var(--text); border: 1px solid var(--linie);
        border-radius: var(--radius); padding: 8px 14px; user-select: none; }
      .kopf__klappe:hover { border-color: var(--signal); color: var(--signal); }
      .kopf__balken { display: block; width: 16px; height: 9px; position: relative; }
      .kopf__balken::before, .kopf__balken::after {
        content: ''; position: absolute; left: 0; right: 0; height: 1.5px;
        background: currentColor; transition: transform .16s ease; }
      .kopf__balken::before { top: 0; }
      .kopf__balken::after { bottom: 0; }
      .kopf__schalter:checked ~ .kopf__innen .kopf__balken::before {
        transform: translateY(3.75px) rotate(45deg); }
      .kopf__schalter:checked ~ .kopf__innen .kopf__balken::after {
        transform: translateY(-3.75px) rotate(-45deg); }

      .kopf__menue { display: none; width: 100%; flex-direction: column;
        align-items: stretch; gap: 0; padding-bottom: 8px; }
      .kopf__schalter:checked ~ .kopf__innen .kopf__menue { display: flex; }
      .kopf__menue a { padding: 13px 2px; border-bottom: 1px solid var(--linie); }
      .kopf__menue a:hover { border-bottom-color: var(--signal); }
      .kopf__jetzt { display: none; }
      .kopf__schalter:checked ~ .kopf__innen .kopf__jetzt {
        display: block; width: 100%; padding: 13px 2px; }
      /* Der Knopf bleibt sichtbar, auch wenn das Menue zu ist — er ist der
         Grund, warum jemand die Seite besucht. */
      .kopf__knopf { order: 2; padding: 8px 16px; font-size: 14px; }
    }
  `,
  render(data) {
    const punkte = (data.baum || []).map((p) => {
      const z = ziel(p.href);
      if (!z) return '';
      const extern = istExtern(z) ? raw(' target="_blank" rel="noopener noreferrer"') : '';
      return html`<a href="${raw(escapeAttr(z))}"${extern}>${p.label}</a>`;
    });
    const aktion = ziel(data.aktionHref);
    const knopf = ziel(data.knopfHref);
    return html`
      <header class="kopf">
        <input type="checkbox" id="kopf-schalter" class="kopf__schalter nur-vorleser">
        <div class="container kopf__innen">
          <a class="kopf__marke" href="/"><img class="kopf__zeichen"
            src="/assets/ktc-logo-rahmen.svg" alt="" aria-hidden="true"
            width="40" height="40" decoding="async"><b>${data.marke}</b></a>
          <label class="kopf__klappe" for="kopf-schalter">
            <span class="kopf__balken" aria-hidden="true"></span>Menü</label>
          <nav class="kopf__menue" aria-label="Hauptmenü">${punkte}</nav>
          ${data.aktionLabel && aktion
            ? html`<a class="kopf__jetzt" href="${raw(escapeAttr(aktion))}"${istExtern(aktion) ? raw(' target="_blank" rel="noopener noreferrer"') : ''}>${data.aktionLabel} ↗</a>`
            : ''}
          ${data.knopfLabel && knopf
            ? html`<a class="kopf__knopf" href="${raw(escapeAttr(knopf))}">${data.knopfLabel}</a>`
            : ''}
        </div>
      </header>`;
  },
};
