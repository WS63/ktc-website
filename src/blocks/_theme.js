import { loadTheme } from '../config.js';

/**
 * Tokens → CSS-Variablen. Eine Farbe aendern heisst: theme.json aendern.
 *
 * Schluessel mit fuehrendem _ sind Kommentar in der JSON und werden
 * uebersprungen — sonst wuerde aus jedem Hinweis eine CSS-Variable.
 */
const vars = (gruppe, praefix = '') => Object.entries(gruppe || {})
  .filter(([k]) => !k.startsWith('_'))
  .map(([k, v]) => `--${praefix}${k}: ${v};`)
  .join(' ');

export function themeCss() {
  const t = loadTheme();
  const zeilen = [
    vars(t.farben),
    vars(t.schriften, 'font-'),
    vars(t.schriftgroessen),
    vars(t.masse),
    vars(t.schatten),
    vars(t.bewegung),
  ].filter(Boolean);

  return `
:root { ${zeilen.join(' ')} }
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--fs-md);
  line-height: 1.7;
  color: var(--text);
  background: var(--grund);
  -webkit-font-smoothing: antialiased;
  overflow-wrap: break-word;
}
img { max-width: 100%; height: auto; display: block; }
h1, h2, h3 { line-height: 1.2; letter-spacing: -.015em; font-weight: 500; margin: 0; }
p { margin: 0; }
a { color: var(--signal); }
a:hover { color: var(--signal-hover); }
a[href^="mailto:"] { white-space: nowrap; }
.container { width: 100%; max-width: var(--breite); margin: 0 auto; padding: 0 var(--raum-3); }
.section { padding: var(--raum-5) 0; }

/* Rhythmus statt Gleichtakt.
   Trennlinien nur dort, wo zwei gleichartige Abschnitte aufeinanderstossen —
   ein Abschnitt auf ruhiger Flaeche trennt sich schon durch seinen Grund.
   Eine Linie zusaetzlich waere doppelt gemoppelt und macht die Seite unruhig. */
.section + .section:not(.section--ruhig) { border-top: 1px solid var(--linie); }
.section--ruhig { background: var(--flaeche); }
.section--ruhig + .section { border-top: none; }

/* Die Ausnahme: ein Abschnitt auf dunklem Grund.
   Er setzt DIESELBEN Variablennamen neu — kein Baustein weiss davon, kein
   Baustein braucht eine Sonderregel. Wer hier eine zweite Klasse einfuehrt
   (".karte--dunkel"), hat den Mechanismus verfehlt: dann kippt nicht mehr
   das Token, sondern der Baustein, und jeder neue Baustein muss nachziehen. */
.section--dunkel { ${vars(loadTheme()['dunkel-abschnitt'])} }
.section--dunkel { background: var(--grund); color: var(--text); }
/* Ein dunkler Abschnitt trennt sich durch seinen Grund — eine Linie waere
   doppelt gemoppelt, genau wie bei .section--ruhig. */
.section--dunkel, .section--dunkel + .section { border-top: none; }
.section--dunkel + .section--dunkel { border-top: 1px solid var(--linie); }

/* Ein Abschnitt darf enger stehen, wenn er zum vorherigen gehoert —
   etwa ein Nachsatz unter einer Tabelle. */
.section--eng { padding-top: 0; }
.section--eng + .section { border-top: 1px solid var(--linie); }
.nur-vorleser {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap;
}
:focus-visible { outline: 2px solid var(--signal); outline-offset: 3px; border-radius: 2px; }

/* Ein Anker unter der klebenden Kopfzeile darf nicht dahinter verschwinden. */
[id] { scroll-margin-top: var(--kopf-hoehe); }

/* Wer Bewegung nicht mag, bekommt keine. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important;
    transition-duration: .01ms !important; scroll-behavior: auto !important; }
}

/* Auswahlfarbe: das Signal, gedeckt. */
::selection { background: var(--signal-leise); color: var(--signal-hover); }
@media (max-width: 640px) { .section { padding: var(--raum-4) 0; } }
`;
}
