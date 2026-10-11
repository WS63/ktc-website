import { html, raw, escapeAttr, ziel, istExtern } from './_util.js';

export default {
  name: 'nav',
  label: 'Kopfzeile mit Menü',
  schema: {
    marke:      { type: 'text', default: '', label: 'Name neben dem Logo' },
    baum:       { type: 'auto', default: [], label: 'Menü — wird unter Navigation gepflegt' },
    aktionLabel:{ type: 'text', default: '', label: 'Rechter Link' },
    aktionHref: { type: 'text', default: '', label: 'Ziel des rechten Links' },
    aktionArt:  { type: 'auswahl', default: 'text', label: 'Darstellung des rechten Links',
                  optionen: ['text', 'ebusy'] },
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
    .kopf__marke b { font-weight: 500; font-size: 19px; white-space: nowrap; }
        /* Die Vollfassung mit weissem Grund und gruenem Rahmen, quadratisch.
       Als Datei, nicht inline: 15 KB in jeder Seite waeren teurer als die eine
       Anfrage. Faellt sie aus, fehlt das Zeichen und sonst nichts (P6) — der
       Vereinsname steht daneben als Text und traegt die Marke allein. */
    .kopf__zeichen { height: 40px; width: 40px; display: block; flex: none; }
    .kopf__menue { display: flex; gap: var(--raum-3); align-items: center;
      font-size: 19px; }
    .kopf__menue a { color: var(--text); text-decoration: none; padding: 6px 0;
      border-bottom: 2px solid transparent; white-space: nowrap; }
    .kopf__menue a:hover { color: var(--signal); border-bottom-color: var(--signal); }
    .kopf__jetzt { color: var(--signal); text-decoration: none; white-space: nowrap;
      font-size: 19px; flex: none; }
    .kopf__jetzt:hover { text-decoration: underline; text-underline-offset: 3px; }

    /* Abgesetzt vom Menue: der Platz buchen fuehrt aus der Website hinaus in
       ein anderes System, das ist keine weitere Seite des Clubs. Ein duenner
       Strich und mehr Luft sagen das, ohne dass ein Wort dafuer noetig ist. */
    .kopf__jetzt--ebusy { margin-left: var(--raum-3); padding-left: var(--raum-4);
      border-left: 1px solid var(--linie); display: flex; align-items: center; }
    .kopf__jetzt--ebusy:hover { text-decoration: none; }
    /* Die Wortmarke des Buchungssystems, nachgebaut als Text: 'e' kursiv in
       Gruen, ein feiner Strich, 'BuSy' fett in einem Grauverlauf. Als Text
       und nicht als Bild bleibt sie auf jedem Schirm scharf und braucht keine
       Anfrage. Das Grau ist gegenueber dem Vorbild etwas dunkler gehalten —
       das Original steht auf einem dunklen Foto, hier steht sie auf Weiss. */
    .ebusy { display: inline-flex; align-items: center; gap: 5px; line-height: 1;
      font-weight: 700; font-size: 19px; letter-spacing: -.01em; }
    .ebusy__e { font-style: italic; font-weight: 600; color: #8fbf3c; font-size: 1.1em; }
    .ebusy__strich { width: 1.5px; height: 1.3em; background: #b4b4b4; margin: 0 1px; }
    /* 'Bu' dunkler als 'Sy', wie im Original. Zwei Spannen statt eines
       Verlaufs: ein Verlauf ueber vier Buchstaben wird auf 19 px zu einem
       Grauschleier, zwei klare Toene bleiben lesbar. */
    /* 'BuSy' ist EIN Flex-Eintrag. Als zwei Eintraege (Bu, Sy) setzte der
       gap des Containers auch zwischen die beiden Haelften — das Wort stand
       mit Luecke da. */
    .ebusy__bu { color: #6b6b6b; }
    .ebusy__sy { color: #a3a3a3; }
    .kopf__jetzt--ebusy:hover .ebusy__bu { color: #4a4a4a; }
    .kopf__jetzt--ebusy:hover .ebusy__sy { color: #858585; }

    /* Der Schalter ist nur auf schmalen Schirmen da. Ohne JavaScript bedienbar:
       ein verstecktes Kontrollkaestchen traegt den Zustand. Dadurch funktioniert
       das Menue auch, wenn ein Skript nicht laedt (P6). */
    .kopf__schalter { display: none; }
    .kopf__klappe { display: none; }

    /* 1080 statt 800 — gemessen. Marke 212 + Menue 550 + eBuSy 133 + zwei
       Luecken von je 40 + Abstand 24 + Polster 48 = 1047 px. Darunter laeuft
       die Leiste ueber: 'Kontakt' wird abgeschnitten, die Wortmarke rutscht
       aus dem Bild. Das trifft das iPad hochkant (820 und 834) und jedes
       halbe Notebook-Fenster. Bei 800 sprang das Menue erst viel zu spaet
       auf den Burger. */
    @media (max-width: 1080px) {
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
      .kopf__jetzt--ebusy { margin-left: 0; padding-left: 2px; border-left: none; }
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
            ? (data.aktionArt === 'ebusy'
              // Die Wortmarke traegt keinen Text, den ein Vorleser lesen
              // koennte — deshalb aria-label mit dem, was der Link TUT.
              ? html`<a class="kopf__jetzt kopf__jetzt--ebusy" href="${raw(escapeAttr(aktion))}"
                    ${istExtern(aktion) ? raw('target="_blank" rel="noopener noreferrer"') : ''}
                    aria-label="${data.aktionLabel} mit eBuSy (öffnet in neuem Fenster)"
                    title="${data.aktionLabel}"><span class="ebusy" aria-hidden="true"><span
                    class="ebusy__e">e</span><span class="ebusy__strich"></span><span
                    class="ebusy__name"><span class="ebusy__bu">Bu</span><span class="ebusy__sy">Sy</span></span></span></a>`
              : html`<a class="kopf__jetzt" href="${raw(escapeAttr(aktion))}"${istExtern(aktion) ? raw(' target="_blank" rel="noopener noreferrer"') : ''}>${data.aktionLabel} ↗</a>`)
            : ''}
          ${data.knopfLabel && knopf
            ? html`<a class="kopf__knopf" href="${raw(escapeAttr(knopf))}">${data.knopfLabel}</a>`
            : ''}
        </div>
      </header>`;
  },
};
