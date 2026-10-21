import { html, raw, escapeAttr, escapeHtml, ziel, istExtern } from './_util.js';

export default {
  name: 'hero',
  // Fuer die Content-Security-Policy (src/sicherheit.js): das Zaehl-Skript des Rundgangs.
  get skripte() { return [SKRIPT]; },
  label: 'Aufmacher',
  schema: {
    pill:      { type: 'text',     default: '', label: 'Kleine Zeile darüber' },
    titel:     { type: 'text',     default: '', label: 'Überschrift' },
    sub:       { type: 'longtext', default: '', label: 'Untertitel' },
    ctaLabel:  { type: 'text',     default: '', label: 'Beschriftung des Knopfs' },
    ctaHref:   { type: 'text',     default: '', label: 'Knopf-Ziel' },
    zweitLabel:{ type: 'text',     default: '', label: 'Zweiter Knopf, leiser' },
    zweitHref: { type: 'text',     default: '', label: 'Ziel des zweiten Knopfs' },
    bild:      { type: 'image',    default: '', label: 'Hintergrundbild' },
    bildAlt:   { type: 'text',     default: '', label: 'Alt-Text des Bildes' },
    bilder:    { type: 'liste',    default: [], label: 'Weitere Bilder — blenden nacheinander durch, im Rundgang ein Thema je Bild: src, reiter, alt, kicker, text, text2, fakten, text3, links, fussnote' },
    marke:     { type: 'auswahl',  default: 'nein', label: 'Logo ins Bild',
                 optionen: ['nein', 'ja'] },
    aufbau:    { type: 'auswahl',  default: 'bild', label: 'Aufbau mit Bild',
                 optionen: ['bild', 'zeile', 'rundgang'] },
    hoehe:     { type: 'auswahl',  default: 'hoch', label: 'Höhe des Bildbereichs',
                 optionen: ['hoch', 'niedrig'] },
    bildFokus: { type: 'text',     default: '', label: 'Bildausschnitt in Prozent: senkrecht (0 = oben, 50 = Mitte, 100 = unten) oder waagerecht und senkrecht, z. B. 70 36. Damit das Wichtige im Bild bleibt, auch wenn das Foto angeschnitten wird' },
    weiterLabel: { type: 'text', default: '', label: 'Rundgang: Hinweis nach unten, Beschriftung' },
    weiterHref:  { type: 'text', default: '', label: 'Rundgang: Hinweis nach unten, Ziel (Sprungmarke)' },
    wortmarke: { type: 'text',     default: '', label: 'Vereinsname neben dem Zeichen' },
  },
  css: `
    .hero { padding: var(--raum-6) 0 var(--raum-5); position: relative; }
    .hero__pill { display: inline-block; font-size: 12px; letter-spacing: .1em;
      text-transform: uppercase; color: var(--signal); border: 1px solid var(--signal);
      border-radius: 3px; padding: 4px 10px; margin-bottom: var(--raum-3); }
    .hero__titel { font-size: clamp(34px, 6vw, 60px); margin: 0 0 var(--raum-2); max-width: 15ch; }
    .hero__sub { font-size: 19px; color: var(--text-leise); max-width: 46ch; }
    .hero__knoepfe { margin-top: var(--raum-4); display: flex; gap: 12px; flex-wrap: wrap; }

    /* Mit Bild: der Text steht auf dem Bild, nicht daneben. Ein Verlauf sorgt
       dafuer, dass er lesbar bleibt, egal wie hell das Foto an der Stelle ist. */
    /* Zwei Klassen statt einer: sonst gewinnt die Regel fuer schmale Schirme
       weiter unten, weil sie spaeter im Stylesheet steht. */
    .hero.hero--bild { padding: 0; }
    /* Niedrig: fuer Seiten, deren Inhalt (Tabellen, Listen) zaehlt. Das Foto bleibt, es zeigt nur weniger. Drei
       Klassen, damit die Regel fuer schmale Schirme (72vh) sie nicht ueberstimmt. */
    .hero.hero--bild.hero--niedrig .hero__rahmen { min-height: min(40vh, 320px); }
    .hero--bild .hero__rahmen { position: relative; min-height: min(72vh, 620px);
      display: flex; align-items: flex-end; overflow: hidden; }
    /* Eine Klasse, kein Elementselektor: '.hero--bild img' ist spezifischer
       als '.hero__marke' und hat das Logo auf volle Bildgroesse aufgeblasen.
       Hier gebaut und im Browser gesehen. */
    .hero__foto { position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: var(--fokus-x, 50%) var(--fokus, 50%); z-index: 0; }

    /* Mehrere Bilder liegen uebereinander und blenden durch. Reines CSS: kein
       Skript, nichts zu laden, und der Render-Cache bleibt wirksam, weil die
       Seite fuer jeden gleich aussieht — nur die Uhr laeuft im Browser.
       Die Keyframes kann der Baustein nicht fest mitbringen: wie lange ein
       Bild steht, haengt an ihrer Anzahl. Sie stehen deshalb im Markup, unter
       einem Namen, der die Anzahl traegt. */
    /* Kein fill-mode: 'backwards' wuerde waehrend der Wartezeit schon den
       0-%-Zustand setzen — und der ist opacity 1. Dann deckt das letzte Bild
       im Stapel alle anderen zu und nichts wechselt. Hier gebaut und gesehen. */
    .hero__foto--wechsel { opacity: 0; animation-duration: calc(var(--n) * var(--slot));
      animation-delay: calc(var(--i) * var(--slot)); animation-iteration-count: infinite;
      animation-timing-function: ease-in-out; }
    /* Wer Bewegung abgestellt hat, bekommt keine: dann steht das erste Bild. */
    @media (prefers-reduced-motion: reduce) {
      .hero__foto--wechsel { animation: none; opacity: 0; }
      .hero__foto--wechsel:first-of-type { opacity: 1; }
    }
    .hero--bild .hero__schleier { position: absolute; inset: 0; z-index: 1;
      /* Der Verlauf hat zwei Aufgaben und nur eine davon ist Lesbarkeit: oben
         darf das Foto hell bleiben, unten muss der Text tragen. Die erste
         Fassung verdunkelte durchgehend und nahm dem Bild das Licht. Jetzt
         bleibt die obere Haelfte fast frei und der Druck sitzt da, wo die
         Schrift steht. */
      background: linear-gradient(180deg, rgba(30,30,24,.06) 0%, rgba(30,30,24,.16) 40%,
        rgba(30,30,24,.46) 72%, rgba(30,30,24,.66) 100%); }
    .hero--bild .container { position: relative; z-index: 2;
      padding-top: var(--raum-5); padding-bottom: var(--raum-5); }
    .hero--bild .hero__titel, .hero--bild .hero__sub { color: #fff;
      text-shadow: 0 1px 12px rgba(30,30,24,.45); }
    .hero--bild .hero__sub { color: rgba(255,255,255,.88); }
    /* Ein Etikett auf dem Foto: dunkle, runde Pille mit weisser Schrift (kein Link, siehe theme.json 'etikett'). */
    .hero--bild .hero__pill { color: #fff; border: 1px solid var(--etikett-rand); border-radius: var(--r-pill);
      background: var(--etikett-grund); padding: 6px 14px; letter-spacing: .14em; }
    /* Der leise Knopf auf dem Foto bekommt eine eigene, abgedunkelte Glasflaeche.
       Nur Kontur und weisse Schrift trugen auf dunklen Fotos, auf hellen (der
       Clubkalender: weisse Papierschnipsel) war er kaum zu finden. Mit 45 %
       Dunkel unter der Schrift liegt Weiss auch auf dem hellsten Foto bei rund
       5,5:1. Weiss gefuellt waere lauter — und stuende auf 'Mitglied werden'
       gleich laut neben dem gelben Knopf. */
    .hero--bild .knopf--leise { color: #fff; border-color: rgba(255,255,255,.9);
      background: rgba(30,30,24,.45); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
    .hero--bild .knopf--leise:hover { background: rgba(30,30,24,.6); color: #fff; }

    /* Das Logo im Bild. Die Fassung mit halbdurchlaessigem Grund ist genau
       dafuer gemacht — sie traegt sich selbst, egal wie unruhig das Foto an
       der Stelle ist. Rechts oben, gegenueber dem Text. */
    .hero__marke { position: absolute; top: var(--raum-4); right: var(--raum-4);
      z-index: 2; width: clamp(96px, 13vw, 190px); height: auto; display: block; }
    @media (max-width: 760px) {
      .hero__marke { width: 92px; top: var(--raum-3); right: var(--raum-3); }
    }

    /* Fassung 'zeile': das Zeichen steht links neben dem Wortblock, die
       Handlungen darunter. Erst standen sie rechts an der Bildkante — mit dem
       breiten Vereinsnamen daneben brachen sie je nach Schirmbreite um und
       sprangen von rechts nach links. Fest darunter ist langweiliger und auf
       jedem Schirm dieselbe Stelle. */
    .hero--zeile .hero__unten { display: block; }
    /* Die zwei Schriftgroessen stehen als Variablen da, weil das Logo seine
       Hoehe daraus rechnet. 'align-self: stretch' waere der naheliegende Weg
       gewesen — ein SVG ohne feste Masse nimmt dabei aber seine max-content-
       Breite und blaeht sich auf den halben Aufmacher auf. Hier gesehen. */
    /* Die Obergrenzen sind an der Vorlage gemessen und an der Containerbreite
       geprueft: Logo plus Wortmarke muessen bei 1120 px nebeneinander passen,
       sonst bricht die Zeile um und der ganze Aufbau faellt auseinander. */
    /* Die Zeile und die Handlungen sitzen etwas hoeher: unten bleibt mehr vom Foto, und der
       Aufmacher wirkt nicht bodenlastig. */
    .hero--bild.hero--zeile .container { padding-bottom: calc(var(--raum-5) + var(--raum-4)); }
    .hero--zeile { --wort-gr: clamp(30px, 5vw, 70px);
                   --titel-gr: clamp(22px, 3.7vw, 52px);
                   /* Der Textblock aus beiden Zeilen — das Mass, an dem das
                      Logo haengt. */
                   --block-h: calc(var(--wort-gr) * 1.05 + var(--titel-gr) * 1.15
                                   + var(--raum-0)); }
    .hero__zeile { display: flex; align-items: center; gap: var(--raum-3); }
    /* Die Logofassung fuer das Bild: teildurchlaessiger weisser Grund, kein
       Rahmen. Sie traegt sich selbst, egal wie unruhig das Foto an der Stelle
       ist — und sie traegt die Wortmarke bereits, deshalb steht daneben nur
       noch die Ueberschrift und nicht ein zweites Mal der Vereinsname. */
    .hero__zeichen { flex: none; display: block; border-radius: var(--r-sm);
      /* Genau die Hoehe des Textblocks: oben und unten schliesst das Logo mit
         den zwei Zeilen ab. Deshalb haengt es an --block-h und nicht an einem
         eigenen Mass — aendert sich eine der Schriftgroessen, zieht es mit. */
      height: var(--block-h); width: auto; }
    /* Zwei Zeilen, umgekehrt gewichtet: der Vereinsname fuehrt, die
       Ueberschrift antwortet leiser. Das ist eine Setzung fuer das Auge, nicht
       fuer das Dokument — semantisch bleibt die Ueberschrift die h1. */
    .hero--bild .hero__wort { color: #fff; font-size: var(--wort-gr);
      font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
      line-height: 1.05; margin: 0 0 var(--raum-0);
      text-shadow: 0 1px 14px rgba(30,30,24,.55); }
    .hero--zeile .hero__titel { font-size: var(--titel-gr);
      font-weight: 300; text-transform: uppercase; letter-spacing: .03em;
      line-height: 1.15; max-width: none; margin: 0;
      /* Von .82 auf .92: mit dem helleren Schleier steht diese Zeile jetzt
         gelegentlich auf blauem Himmel, und dort trug .82 nicht mehr. */
      color: rgba(255,255,255,.92); text-shadow: 0 1px 14px rgba(30,30,24,.5); }
    /* Rechts, aber nicht an der Kante: ein Knopf, der die Bildkante beruehrt,
       sieht aus, als waere er abgeschnitten. Der Abstand ist derselbe Raum wie
       zwischen den Abschnitten. */
    .hero--zeile .hero__knoepfe { margin-top: var(--raum-4);
      justify-content: flex-end; padding-right: var(--raum-5); }
    @media (max-width: 760px) {
      .hero--zeile .hero__knoepfe { justify-content: flex-start; padding-right: 0; }
    }
    /* Zweite Handlung als Link, nicht als Knopf: zwei Knoepfe nebeneinander
       rufen gleich laut, und laut sein darf hier genau einer.
       align-self, weil '.hero__knoepfe' ein Flex-Kasten ist — ohne das wird der
       Link auf Knopfhoehe gestreckt und seine Unterlinie rutscht nach unten weg. */
    .hero--bild .hero__nebenbei { align-self: center; color: #fff;
      text-decoration: none; font-size: 16px; padding-bottom: 2px;
      border-bottom: 1px solid rgba(255,255,255,.5); }
    .hero--bild .hero__nebenbei:hover { border-bottom-color: #fff; }
    @media (max-width: 560px) {
      .hero__zeile { gap: var(--raum-2); }
    }

    /* Rundgang: der Aufmacher ist die Startseite in Themen. Mit jedem Bild wechselt alles, was dazu
       gehoert: Thema, Kernaussage, Zahlen und Link. Name, Claim und der gelbe Knopf bleiben. Unten
       eine Leiste mit den Themen: antippen haelt den Wechsel an und zeigt dieses Thema (reines CSS:
       versteckte Auswahlfelder und :has()). Ein Bild nach dem anderen, ein Takt: nur eine Bewegung
       zur Zeit. Das Foto zoomt dabei sehr langsam heran. */
    .hero--rundgang .hero__rahmen { min-height: min(84vh, 800px); }
    .hero--rundgang .hero__slide { position: absolute; inset: 0; margin: 0; overflow: hidden;
      opacity: 0; animation-duration: calc(var(--n) * var(--slot));
      animation-delay: calc(var(--i) * var(--slot) - var(--blende)); animation-iteration-count: infinite;
      animation-timing-function: ease-in-out; }
    .hero--rundgang .hero__slide .hero__foto { animation-duration: calc(var(--n) * var(--slot));
      animation-delay: calc(var(--i) * var(--slot) - var(--blende)); animation-iteration-count: infinite;
      animation-timing-function: linear; }
    /* Der Themenblock steht auf der Bildmitte, nicht nur unten: der Verlauf setzt frueher und kraeftiger ein. */
    .hero--rundgang .hero__schleier { background: linear-gradient(180deg, rgba(30,30,24,.10) 0%,
      rgba(30,30,24,.30) 30%, rgba(30,30,24,.56) 58%, rgba(30,30,24,.74) 100%); }
    .hero--rundgang .hero__zeile { align-items: flex-start; }
    .hero__themen { display: grid; max-width: 64ch;
      margin: clamp(28px, 5.5vh, 60px) 0; }
    /* Ein einziges Thema (eine Unterseite): es steht da, ohne Wechsel; nur die Zahlen zaehlen beim Laden. */
    .hero--einzeln .hero__thema, .hero--einzeln .hero__slide { opacity: 1; visibility: visible; animation: none; }
    .hero--einzeln .hero__foto { animation: none; }
    .hero__thema { grid-area: 1 / 1; opacity: 0; visibility: hidden; color: var(--text-hell);
      animation-duration: calc(var(--n) * var(--slot));
      animation-delay: calc(var(--i) * var(--slot) - var(--blende)); animation-iteration-count: infinite;
      animation-timing-function: ease-out; }
    /* Das Thema: ein dunkles Etikett mit weisser Schrift. Der eigene Grund traegt auf jedem Foto; Gelb bleibt
       den Zahlen, dem Balken und dem Knopf. Es ist kein Link, darum dunkel und nicht hellblau. */
    .hero__thema-kicker { display: inline-flex; align-items: center; margin: 0 0 14px; padding: 7px 16px;
      border: 1px solid var(--etikett-rand); border-radius: var(--r-pill); background: var(--etikett-grund);
      font-size: clamp(12px, 1.1vw, 14px); font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
      color: #fff; }
    /* Die Aussage: weiss, Schluesselwoerter im Akzent (*Wort* im Text). Der Schatten liegt als Filter auf
       dem Absatz, damit er auch unter den Woertern im Akzent sitzt. */
    .hero__thema-text { font-size: clamp(22px, 2.8vw, 38px); font-weight: 700; line-height: 1.15;
      letter-spacing: -.01em; margin: 0 0 var(--raum-3); filter: drop-shadow(0 1px 12px rgba(30,30,24,.6)); }
    .hero__stich { color: var(--titel-akzent); }
    /* Die zweite Zeile unter der Aussage: leiser und naeher dran, ein Satz, der das Bild erklaert. */
    .hero__thema-text2 { font-size: clamp(17px, 1.7vw, 22px); font-weight: 500; line-height: 1.4; max-width: 46ch;
      margin: calc(-1 * var(--raum-2)) 0 var(--raum-3); filter: drop-shadow(0 1px 12px rgba(30,30,24,.6)); }
    /* Eine Zeile unter den Zahlen in normaler Groesse: das, was Eltern und Neue sofort wissen muessen. */
    .hero__thema-text3 { font-size: clamp(16px, 1.5vw, 19px); font-weight: 500; line-height: 1.4; max-width: 60ch;
      margin: 0 0 var(--raum-3); filter: drop-shadow(0 1px 12px rgba(30,30,24,.6)); }
    .hero__thema-fakten { display: flex; flex-wrap: wrap; gap: 14px 44px; list-style: none; padding: 0;
      margin: 0 0 var(--raum-3); }
    .hero__thema-wert { display: block; font-size: clamp(34px, 4vw, 56px); font-weight: 800; color: var(--titel-akzent);
      line-height: 1; text-shadow: 0 1px 14px rgba(30,30,24,.55); font-variant-numeric: tabular-nums; }
    .hero__plus { transition: opacity .35s ease; }
    .hero__feder { transform-origin: left center; animation: hero-feder .7s cubic-bezier(.3, 1.5, .5, 1) both; }
    @keyframes hero-feder { 0% { transform: scale(1); } 40% { transform: scale(1.14); } 100% { transform: scale(1); } }
    .hero__thema-label { display: block; font-size: clamp(16px, 1.5vw, 19px); font-weight: 600; margin-top: 8px;
      line-height: 1.3; text-shadow: 0 1px 8px rgba(30,30,24,.6); }
    /* Die Zahlen zaehlen mit dem Einblenden hoch (oder herunter): ein kleines Skript am Ende des Aufmachers
       (SKRIPT) setzt sie, sobald ihr Thema beginnt. Im Markup steht der Endwert: ohne Skript oder bei
       'Bewegung reduzieren' bleibt es dabei. */
    /* Die Teile eines Themas blenden nacheinander ein (Kicker, Aussage, Zahlen, Links). */
    .hero__t-teil { animation-duration: calc(var(--n) * var(--slot));
      animation-delay: calc(var(--i) * var(--slot) - var(--blende) + var(--k, 0) * .16s);
      animation-iteration-count: infinite; animation-timing-function: ease-out; }
    /* Das erste Thema steht beim Laden schon da (die Runde beginnt mittendrin). Damit auch seine Teile
       einblenden und seine Zahlen zaehlen, laeuft beim Laden einmal eine zweite, kurze Animation obenauf. */
    .hero__intro { animation-duration: calc(var(--n) * var(--slot)), 1.4s;
      animation-delay: calc(var(--i) * var(--slot) - var(--blende) + var(--k, 0) * .16s), calc(var(--k, 0) * .16s);
      animation-iteration-count: infinite, 1; animation-fill-mode: none, backwards;
      animation-timing-function: ease-out, ease-out; }
    /* Die Bedingung zu einem Preis steht beim Preis, klein, aber im selben Block. */
    .hero__thema-fuss { margin: 14px 0 0; font-size: 13px; line-height: 1.4; text-shadow: 0 1px 8px rgba(30,30,24,.7); }
    .hero__thema-links { display: flex; flex-wrap: wrap; gap: 8px 28px; }
    .hero__thema-link { color: var(--text-hell); text-decoration: none; font-size: 17px; padding-bottom: 2px;
      border-bottom: 1px solid rgba(255,255,255,.55); text-shadow: 0 1px 8px rgba(30,30,24,.6); }
    .hero__thema-link:hover { border-bottom-color: var(--text-hell); color: var(--text-hell); }
    .hero--rundgang .hero__titel { font-weight: 700; text-transform: none; letter-spacing: -.01em; line-height: 1.05; }
    .hero--rundgang .hero__wort { letter-spacing: .08em; font-weight: 500; }
    .hero--rundgang .hero__knoepfe { justify-content: flex-start; padding-right: 0; margin-top: 0; }
    .hero--rundgang.hero--zeile { --wort-gr: clamp(14px, 1.5vw, 20px);
                                  --titel-gr: clamp(38px, 6vw, 84px); }
    .hero--bild.hero--rundgang .container { padding-top: var(--raum-4); padding-bottom: calc(var(--raum-5) + var(--raum-3)); }

    /* Die Leiste: ein Reiter je Thema, der Strich fuellt sich, solange das Thema steht. */
    .hero__leiste { position: absolute; z-index: 3; margin: 0; display: flex; gap: 14px; align-items: flex-end;
      left: max(var(--raum-3), calc((100% - var(--breite)) / 2 + var(--raum-3)));
      right: max(var(--raum-3), calc((100% - var(--breite)) / 2 + var(--raum-3)));
      bottom: var(--raum-3); }
    /* Der Hinweis nach unten: 'Aktuelles' wartet unter dem Aufmacher. Der Pfeil wippt leise (nur ohne
       'Bewegung reduzieren'). Rechts ueber der Leiste, damit er weder Text noch Knoepfe beruehrt. */
    .hero__weiter { position: absolute; z-index: 3; right: max(var(--raum-3), calc((100% - var(--breite)) / 2 + var(--raum-3)));
      bottom: calc(var(--raum-3) + 54px); display: inline-flex; align-items: center; gap: 8px; color: var(--text-hell);
      font-size: 13px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; text-decoration: none;
      text-shadow: 0 1px 10px rgba(30,30,24,.7); }
    .hero__weiter:hover { color: var(--text-hell); }
    .hero__weiter-pfeil { display: inline-block; font-size: 18px; line-height: 1; }
    @media (prefers-reduced-motion: no-preference) {
      .hero__weiter-pfeil { animation: hero-wippen 2.2s ease-in-out infinite; }
    }
    @keyframes hero-wippen { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
    .hero__t { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .hero__reiter { flex: 1; min-width: 0; cursor: pointer; color: var(--text-hell); font-size: 14px;
      text-shadow: 0 1px 8px rgba(30,30,24,.6); }
    .hero__reiter span.hero__reiter-name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      font-size: 13px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
    .hero__strich { display: block; height: 3px; border-radius: 2px; background: rgba(255,255,255,.38);
      overflow: hidden; margin-bottom: 7px; }
    .hero__strich i { display: block; height: 100%; width: 100%; background: var(--titel-akzent);
      transform: scaleX(0); transform-origin: left center; animation-duration: calc(var(--n) * var(--slot));
      animation-delay: calc(var(--blende) * -1); animation-iteration-count: infinite;
      animation-timing-function: linear; }
    .hero__t:focus-visible + .hero__reiter { outline: 2px solid var(--text-hell); outline-offset: 3px; border-radius: 2px; }
    .hero__steuerung { flex: none; display: flex; gap: 6px; align-items: flex-end; }
    .hero__pause { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .hero__pause-knopf, .hero__auto { color: var(--text-hell); font: inherit; font-size: 13px; cursor: pointer;
      background: none; border: 0; padding: 4px 8px; border-radius: var(--r-sm);
      text-shadow: 0 1px 8px rgba(30,30,24,.6); }
    .hero__pause-knopf:hover, .hero__auto:hover { background: rgba(30,30,24,.35); }
    .hero__pause:focus-visible + .hero__pause-knopf, .hero__auto:focus-visible { outline: 2px solid var(--text-hell); outline-offset: 2px; }
    .hero__pause:checked + .hero__pause-knopf .hero__pause-an,
    .hero__pause-knopf .hero__pause-aus { display: none; }
    .hero__pause:checked + .hero__pause-knopf .hero__pause-aus { display: inline; }
    .hero__auto { display: none; }
    .hero--rundgang:has(.hero__t:checked) .hero__auto { display: inline-block; }
    .hero--rundgang:has(.hero__t:checked) .hero__pause-knopf { display: none; }
    /* Anhalten: auf Wunsch, beim Darueberfahren der Leiste mit der Maus und beim Tastaturfokus. Nicht beim
       Text: eine Maus, die ruhig ueber dem Aufmacher liegt, wuerde sonst alles anhalten. */
    .hero--rundgang:has(.hero__pause:checked) *, .hero--rundgang:has(.hero__leiste:hover, :focus-visible) *
      { animation-play-state: paused !important; }
    @media (max-width: 760px) {
      .hero--rundgang .hero__rahmen { min-height: 94svh; }
      .hero__reiter span.hero__reiter-name { font-size: 11px; letter-spacing: .06em; }
      .hero__leiste { gap: 8px; }
      .hero__steuerung { display: none; }
      .hero__weiter { display: none; }
      .hero--bild.hero--rundgang .container { padding-bottom: calc(var(--raum-5) + var(--raum-3)); }
      .hero__themen { margin: var(--raum-3) 0; }
      .hero__thema-text { margin-bottom: var(--raum-2); }
      .hero__thema-fakten { gap: 10px 28px; margin-bottom: var(--raum-2); }
    }
    @media (prefers-reduced-motion: reduce) {
      .hero--rundgang .hero__slide, .hero--rundgang .hero__slide .hero__foto, .hero__thema,
      .hero__strich i, .hero__t-teil, .hero__feder { animation: none !important; }
      .hero__t-teil { opacity: 1; transform: none; }
      .hero--rundgang .hero__slide:first-of-type { opacity: 1; }
      .hero__thema:first-of-type { opacity: 1; visibility: visible; }
      .hero__pause-knopf { display: none; }
    }
    @media (max-width: 640px) {
      .hero { padding: var(--raum-5) 0 var(--raum-4); }
      .hero.hero--bild { padding: 0; }
      .hero--bild .hero__rahmen { min-height: 72vh; }
      .hero--bild .hero__titel { max-width: 100%; }
    }
  `,
  render(data) {
    const z1 = ziel(data.ctaHref), z2 = ziel(data.zweitHref);
    const bild = ziel(data.bild);

    const rundgang = bild && data.aufbau === 'rundgang';
    const zeile = bild && (data.aufbau === 'zeile' || rundgang);

    const knoepfe = (data.ctaLabel && z1) || (data.zweitLabel && z2)
      ? html`<div class="hero__knoepfe">
          ${data.zweitLabel && z2 && zeile
            ? html`<a class="hero__nebenbei" href="${raw(escapeAttr(z2))}">${data.zweitLabel} →</a>`
            : ''}
          ${data.ctaLabel && z1 ? html`<a class="knopf" href="${raw(escapeAttr(z1))}"${neuesFenster(z1)}>${data.ctaLabel}</a>` : ''}
          ${data.zweitLabel && z2 && !zeile
            ? html`<a class="knopf knopf--leise" href="${raw(escapeAttr(z2))}"${neuesFenster(z2)}>${data.zweitLabel}</a>`
            : ''}
        </div>`
      : '';

    const wortblock = html`
        ${data.wortmarke ? html`<p class="hero__wort">${data.wortmarke}</p>` : ''}
        ${data.pill ? html`<p class="hero__pill">${data.pill}</p>` : ''}
        <h1 class="hero__titel">${data.titel}</h1>
        ${rundgang ? rundgangThemen(data, bild) : ''}
        ${data.sub ? html`<p class="hero__sub">${data.sub}</p>` : ''}`;

    const inhalt = zeile
      ? html`<div class="container"><div class="hero__unten">
          <div class="hero__zeile">
            ${data.marke === 'ja'
              ? html`<img class="hero__zeichen" src="/assets/ktc-logo-bild-${raw(rundgang ? 'dunkel' : '2026')}.svg"
                          alt="" aria-hidden="true" decoding="async">`
              : ''}
            <div>${wortblock}</div>
          </div>
          ${knoepfe}
        </div></div>`
      : html`<div class="container">${wortblock}${knoepfe}</div>`;

    // P6: kein Bild haelt nichts auf — dann eben die schlichte Fassung.
    if (!bild) return html`<section class="section hero">${inhalt}</section>`;

    if (rundgang) return rundgangAufmacher(data, bild, inhalt);

    // Das Hauptbild zuerst, dann die weiteren. Doppelte fliegen raus — sonst
    // steht dasselbe Foto zweimal im Lauf und wirkt wie ein Haenger.
    // Der senkrechte Bildausschnitt: nur eine Zahl von 0 bis 100, sonst bleibt es bei der Mitte.
    const teile = String(data.bildFokus ?? '').trim().split(/\s+/);
    const gueltig = (t) => /^\d{1,3}$/.test(t) && Number(t) <= 100;
    const fokus = teile.length === 1 && gueltig(teile[0]) ? `; --fokus: ${Number(teile[0])}%`
      : teile.length === 2 && teile.every(gueltig) ? `; --fokus-x: ${Number(teile[0])}%; --fokus: ${Number(teile[1])}%` : '';
    const alle = [bild];
    for (const b of data.bilder || []) {
      const z = ziel(typeof b === 'string' ? b : b && b.src);
      if (z && !alle.includes(z)) alle.push(z);
    }
    const n = alle.length;

    // Die Groessenreihe kommt beim Ausliefern dazu (src/routes/public.js, 'srcsets').
    // Fehlt sie, bleibt es bei der einen Adresse (P6). Der Aufmacher ist immer
    // schirmbreit, deshalb 100vw.
    const reihe = (src) => {
      const s = data.srcsets?.[src];
      return s ? raw(` srcset="${escapeAttr(s)}" sizes="100vw"`) : '';
    };

    // Das erste Bild ist das, was man sieht: es kommt zuerst. Die weiteren
    // tauchen fruehestens nach einem Platz von SLOT_S Sekunden auf und duerfen
    // warten — 'low' laesst ihnen die Leitung erst, wenn das erste da ist.
    const fotos = n === 1
      ? html`<img class="hero__foto" src="${raw(escapeAttr(bild))}"${reihe(bild)}
                  alt="${raw(escapeAttr(data.bildAlt || ''))}"
                  fetchpriority="high" decoding="async">`
      : alle.map((src, i) => html`<img class="hero__foto hero__foto--wechsel"
             style="--i: ${raw(String(i))}; animation-name: hero-blende-${raw(String(n))}"
             src="${raw(escapeAttr(src))}"${reihe(src)}
             alt="${raw(i === 0 ? escapeAttr(data.bildAlt || '') : '')}"
             ${raw(i === 0 ? 'fetchpriority="high"' : 'aria-hidden="true" fetchpriority="low"')} decoding="async">`);

    return html`
      <section class="section hero hero--bild${raw(zeile ? ' hero--zeile' : '')}${raw(data.hoehe === 'niedrig' ? ' hero--niedrig' : '')}"
               style="--n: ${raw(String(n))}; --slot: ${raw(String(SLOT_S))}s${raw(fokus)}">
        ${n > 1 ? raw(`<style>${keyframes(n)}</style>`) : ''}
        <div class="hero__rahmen">
          ${fotos}
          <div class="hero__schleier"></div>
          ${!zeile && data.marke === 'ja'
            ? html`<img class="hero__marke" src="/assets/ktc-logo-bild-2026.svg"
                        alt="" aria-hidden="true" decoding="async">`
            : ''}
          ${inhalt}
        </div>
      </section>`;
  },
};

/**
 * Die Keyframes fuer n durchblendende Bilder.
 *
 * Jedes Bild haelt einen Platz von 100/n Prozent der Runde und blendet an
 * dessen Ende weich aus; das naechste kommt mit seinem Versatz darunter hervor.
 * Die Blendzeit ist fest in Sekunden gedacht und hier in Prozent der Runde
 * umgerechnet, damit sie bei zwei wie bei zwanzig Bildern gleich lang dauert.
 *
 * Der Name traegt die Anzahl: zwei Aufmacher mit derselben Anzahl erzeugen
 * dieselbe Regel zweimal, was folgenlos ist — zwei mit verschiedener Anzahl
 * wuerden sich sonst gegenseitig ueberschreiben.
 */
function keyframes(n) {
  const platz = 100 / n;
  const blende = (BLENDE_S / (n * SLOT_S)) * 100;
  const r = (x) => Math.round(x * 100) / 100;
  return `@keyframes hero-blende-${n}{`
    + `0%{opacity:1}`
    + `${r(platz - blende)}%{opacity:1}`
    + `${r(platz)}%{opacity:0}`
    + `${r(100 - blende)}%{opacity:0}`
    + `100%{opacity:1}}`;
}

// Wie lange ein Bild steht und wie lange die Blende dauert. Beide Werte gehen
// als CSS-Variable --slot in das Markup, damit Rechnung und Darstellung nicht
// auseinanderlaufen koennen.
const SLOT_S = 7;
const BLENDE_S = 1.4;

/**
 * Ein Ziel ausserhalb der Website oeffnet im neuen Fenster.
 *
 * Die Kopfzeile und der Fliesstext taten das schon; nur die Knoepfe im
 * Aufmacher nicht. 'Jetzt anmelden' fuehrte deshalb aus der Website HINAUS und
 * liess keinen Weg zurueck als die Zurueck-Taste — an der Stelle, an der jemand
 * gerade entschieden hat, Mitglied zu werden.
 */
function neuesFenster(z) {
  return istExtern(z) ? raw(' target="_blank" rel="noopener noreferrer"') : '';
}

// ── Rundgang ───────────────────────────────────────────────────────────────────────────────────

const RUNDGANG_SLOT_S = 9;
const RUNDGANG_BLENDE_S = 1.4;

/**
 * Die Themen des Rundgangs: je Bild ein Eintrag mit Thema (kicker), Kernaussage (text), Zahlen
 * (fakten) und Links. 'bilder' ist die Liste; das Hauptbild kommt nur dazu, wenn es dort fehlt.
 * Eine Zahl mit 'quelle: termin' zeigt den naechsten Vereinstermin (der Server liefert ihn); gibt
 * es keinen, faellt sie weg.
 */
function rundgangFolge(data, bild) {
  const termin = data.naechsterTermin;
  const norm = (b) => {
    const e = typeof b === 'string' ? { src: b } : (b || {});
    const fakten = (e.fakten || []).map((f) => (f && f.quelle === 'termin'
      ? (termin ? { wert: termin.tag, label: termin.titel } : null) : f)).filter((f) => f && f.wert).slice(0, 3);
    const links = (e.links || []).filter((l) => l && l.label && ziel(l.href)).slice(0, 2);
    return { src: ziel(e.src), alt: e.alt || '', kicker: e.kicker || '', reiter: e.reiter || e.kicker || '', text: e.text || '', text2: e.text2 || '', text3: e.text3 || '', fakten, links, fussnote: e.fussnote || '' };
  };
  const liste = (data.bilder || []).map(norm).filter((e) => e.src);
  if (!liste.some((e) => e.src === bild)) liste.unshift({ ...norm({ src: bild, alt: data.bildAlt }) });
  // Doppelte fliegen raus: dasselbe Foto zweimal im Lauf waere ein Haenger.
  const gesehen = new Set();
  return liste.filter((e) => (gesehen.has(e.src) ? false : gesehen.add(e.src)));
}

/** Die Keyframes des Rundgangs fuer n Themen: Blende, Zoom, Thema, Strich je Thema. */
function rundgangRegeln(n) {
  const T = n * RUNDGANG_SLOT_S;
  const pc = (sek) => Math.round((sek / T) * 10000) / 100;
  const b = RUNDGANG_BLENDE_S;
  const [pb, p1, p2] = [pc(b), pc(RUNDGANG_SLOT_S), pc(RUNDGANG_SLOT_S + b)];
  const nach = Math.round((p2 + 0.01) * 100) / 100;
  let css = `@keyframes hero-rg-blende-${n}{0%{opacity:0}${pb}%{opacity:1}${p1}%{opacity:1}${p2}%{opacity:0}100%{opacity:0}}`
    + `@keyframes hero-rg-zoom-${n}{0%{transform:scale(1)}${p2}%{transform:scale(1.07)}100%{transform:scale(1.07)}}`
    + `@keyframes hero-rg-text-${n}{0%{opacity:0;transform:translateY(8px);visibility:visible}${pb}%{opacity:1;transform:none}`
    + `${p1}%{opacity:1;transform:none}${p2}%{opacity:0;visibility:visible}${nach}%{visibility:hidden}100%{opacity:0;visibility:hidden}}`;
  css += `@keyframes hero-rg-teil-${n}{0%{opacity:0;transform:translateY(10px)}${pb}%{opacity:1;transform:none}`
    + `${p1}%{opacity:1;transform:none}${p2}%{opacity:0}100%{opacity:0}}`
    + `@keyframes hero-rg-intro{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`;
  for (let i = 0; i < n; i++) {
    const von = Math.round((i / n) * 10000) / 100;
    const bis = Math.round(((i + 1) / n) * 10000) / 100;
    // Der laufende Strich ist gelb; ist sein Thema durch, wird er hellgrau und bleibt es bis zum Rundenende.
    // Beim LETZTEN Thema gibt es kein Rundenende mehr nach dem Fuellen: dort bleibt er gelb. Ein Schlüsselbild
    // bei 100,01 % waere ungueltig, und das zweite '100%' haette den Strich beim Fuellen nach weiss ueberblendet.
    css += `@keyframes hero-rg-fuell-${n}-${i}{0%{transform:scaleX(0);background:var(--titel-akzent)}${von}%{transform:scaleX(0)}`
      + `${bis}%{transform:scaleX(1);background:var(--titel-akzent)}`;
    if (i < n - 1) {
      const nach = Math.round((bis + 0.01) * 100) / 100;
      css += `${nach}%{background:var(--text-hell-leise)}100%{transform:scaleX(1);background:var(--text-hell-leise)}`;
    }
    css += '}';
  }
  // Ein Thema angetippt: der Wechsel steht, genau dieses Thema ist zu sehen.
  const w = '.hero--rundgang:has(.hero__t:checked)';
  css += `${w} .hero__slide,${w} .hero__thema{animation:none;opacity:0}`
    + `${w} .hero__thema{visibility:hidden}${w} .hero__foto{animation:none}`
    + `${w} .hero__strich i{animation:none;transform:scaleX(0)}`
    + `${w} .hero__t-teil{animation:none;opacity:1;transform:none}`;
  for (let k = 0; k < n; k++) {
    const a = `.hero--rundgang:has(#hero-t${k}:checked)`;
    css += `${a} .hero__slide[data-i="${k}"],${a} .hero__thema[data-i="${k}"]{opacity:1;visibility:visible}`
      + `${a} label[for="hero-t${k}"] .hero__strich i{transform:scaleX(1)}`;
  }
  return css;
}

function rundgangAufmacher(data, bild, inhalt) {
  const folge = rundgangFolge(data, bild);
  const n = folge.length;
  const anim = (name) => raw(n > 1 ? `; animation-name: ${name}` : '');
  const reihe = (src) => {
    const r = data.srcsets?.[src];
    return r ? raw(` srcset="${escapeAttr(r)}" sizes="100vw"`) : '';
  };

  const folien = folge.map((b, i) => html`<figure class="hero__slide" data-i="${raw(String(i))}" style="--i: ${raw(String(i))}${anim(`hero-rg-blende-${n}`)}"${raw(i === 0 ? '' : ' aria-hidden="true"')}>
      <img class="hero__foto" style="--i: ${raw(String(i))}${anim(`hero-rg-zoom-${n}`)}" src="${raw(escapeAttr(b.src))}"${reihe(b.src)}
           alt="${raw(i === 0 ? escapeAttr(b.alt) : '')}"
           ${raw(i === 0 ? 'fetchpriority="high"' : 'fetchpriority="low"')} decoding="async">
    </figure>`);

  const leiste = n > 1 ? html`<form class="hero__leiste" aria-label="Themen">
      ${folge.map((b, i) => html`<input type="radio" name="hero-thema" id="hero-t${raw(String(i))}" class="hero__t" aria-label="${raw(escapeAttr(b.reiter || `Thema ${i + 1}`))}"><label class="hero__reiter" for="hero-t${raw(String(i))}"><span class="hero__strich"><i style="animation-name: hero-rg-fuell-${raw(String(n))}-${raw(String(i))}"></i></span><span class="hero__reiter-name">${b.reiter || ''}</span></label>`)}
      <span class="hero__steuerung">
        <input type="checkbox" id="hero-pause" class="hero__pause" aria-label="Bildwechsel anhalten">
        <label for="hero-pause" class="hero__pause-knopf"><span class="hero__pause-an">Anhalten</span><span class="hero__pause-aus">Weiter</span></label>
        <button type="reset" class="hero__auto">Automatisch</button>
      </span>
    </form>` : '';

  return html`
    <section class="section hero hero--bild hero--zeile hero--rundgang${raw(n === 1 ? ' hero--einzeln' : '')}${raw(data.hoehe === 'niedrig' ? ' hero--niedrig' : '')}"
             style="--n: ${raw(String(n))}; --slot: ${raw(String(RUNDGANG_SLOT_S))}s; --blende: ${raw(String(RUNDGANG_BLENDE_S))}s">
      ${n > 1 ? raw(`<style>${rundgangRegeln(n)}</style>`) : ''}
      <div class="hero__rahmen">
        ${folien}
        <div class="hero__schleier"></div>
        ${inhalt}
        ${leiste}
      </div>
      ${data.weiterHref && ziel(data.weiterHref) ? html`<a class="hero__weiter" href="${raw(escapeAttr(ziel(data.weiterHref)))}">${data.weiterLabel || 'Weiter'} <span class="hero__weiter-pfeil" aria-hidden="true">↓</span></a>` : ''}
      ${folge.some((b) => b.fakten.some((f) => zahlTeile(f))) ? raw(`<script>${SKRIPT}</script>`) : ''}
    </section>`;
}


// Das Hochzaehlen der Zahlen im Rundgang. Es startet, wenn ein Thema beginnt (die Animation des Themas meldet
// 'animationstart' beim ersten Mal und 'animationiteration' in jeder Runde) und wenn jemand ein Thema antippt.
// Es verzoegert um den Versatz der Zahlenzeile (320 ms), damit man die Zahl beim Einblenden laufen sieht.
const SKRIPT = `
(function () {
  var wurzel = document.querySelector('.hero--rundgang');
  if (!wurzel) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var DAUER = 1800, VERZUG = 320;
  var stufe = function (t) { return 1 - Math.pow(1 - t, 3); };
  function zaehle(el) {
    var von = parseInt(el.getAttribute('data-von'), 10), bis = parseInt(el.getAttribute('data-bis'), 10);
    if (isNaN(von) || isNaN(bis)) return;
    var lauf = (el.__lauf = (el.__lauf || 0) + 1), start = null;
    var plus = el.nextElementSibling && el.nextElementSibling.classList.contains('hero__plus') ? el.nextElementSibling : null;
    if (plus) plus.style.opacity = '0';
    el.textContent = von;
    // Mit Zeitgeber statt requestAnimationFrame: der steht in einem verdeckten Fenster still und die Zahl
    // spraenge ans Ende; die Uhr laeuft immer.
    function schritt() {
      if (el.__lauf !== lauf) return;
      if (start === null) start = Date.now();
      var t = Math.min(1, (Date.now() - start) / DAUER);
      el.textContent = Math.round(von + (bis - von) * stufe(t));
      if (t < 1) { setTimeout(schritt, 30); return; }
      el.textContent = bis;
      if (plus) plus.style.opacity = '1';
      // Der Feder-Effekt am Ende: die Zahl federt einmal kurz nach.
      var wert = el.closest('.hero__thema-wert');
      if (wert) {
        wert.classList.add('hero__feder');
        wert.addEventListener('animationend', function () { wert.classList.remove('hero__feder'); }, { once: true });
      }
    }
    setTimeout(schritt, VERZUG);
  }
  function thema(th) { if (th) th.querySelectorAll('.hero__zahl').forEach(zaehle); }
  wurzel.querySelectorAll('.hero__thema').forEach(function (th) {
    var los = function (e) { if (e.target === th) thema(th); };
    th.addEventListener('animationstart', los);
    th.addEventListener('animationiteration', los);
  });
  var einzige = wurzel.querySelectorAll('.hero__thema');
  if (einzige.length === 1) thema(einzige[0]);   // ein Thema ohne Wechsel: gleich zaehlen
  wurzel.querySelectorAll('.hero__t').forEach(function (r, i) {
    r.addEventListener('change', function () { thema(wurzel.querySelector('.hero__thema[data-i="' + i + '"]')); });
  });
})();
`;

const VOR_WORTE = /^(?:über|rund|mehr als|etwa|ca\.)\s+/i;

/**
 * Eine Zahl, die zaehlt. Mit 'ab' zaehlt sie herunter (zum Beispiel von 100 auf 0 Euro bei 'keine').
 * Ohne: hoch bis zum Wert. Ein Vorwort wie 'rund' oder 'ueber' wird zum Plus hinter der Zahl ('rund 120'
 * wird '120+'); das Plus erscheint erst, wenn die Zahl angekommen ist. Mit zwei Zahlen (ein Datum) oder ohne Zahl: kein Zaehler.
 */
function zahlTeile(f) {
  const wert = String(f.wert).trim();
  if (f.ab != null && Number.isFinite(Number(f.ab))) {
    const ziel0 = /^(keine?|kein|null)$/i.test(wert) ? 0 : (/^\d{1,5}$/.test(wert) ? Number(wert) : null);
    if (ziel0 == null) return null;
    return { von: Number(f.ab), zahl: ziel0, plus: false, nach: f.einheit ? ` ${f.einheit}` : '' };
  }
  const plus = VOR_WORTE.test(wert);
  const m = /^(\d{1,4})(\D*)$/.exec(wert.replace(VOR_WORTE, ''));
  return m ? { von: 0, zahl: Number(m[1]), plus, nach: m[2] } : null;
}

/** Die Aussage: *Schluesselwoerter* stehen im Akzent. Erst maskieren, dann markieren. */
function aussage(text) {
  return raw(escapeHtml(String(text)).replace(/\*([^*]+)\*/g, '<span class="hero__stich">$1</span>'));
}

/** Die Themen als ruhiger Text fuer Vorleser: je Thema eine Ueberschrift, die Aussage ohne Hervorhebung, die Zahlen als Liste. */
function vorleserUeberblick(folge) {
  return html`<section class="nur-vorleser" aria-label="Das Wichtigste im Überblick">${folge.map((b) => html`
    ${b.kicker || b.reiter ? html`<h2>${b.kicker || b.reiter}</h2>` : ''}
    ${b.text ? html`<p>${String(b.text).replace(/\*([^*]+)\*/g, '$1')}</p>` : ''}
    ${b.text2 ? html`<p>${String(b.text2).replace(/\*([^*]+)\*/g, '$1')}</p>` : ''}
    ${b.fakten.length ? html`<ul>${b.fakten.map((f) => html`<li>${f.wert} ${f.label}</li>`)}</ul>` : ''}
    ${b.text3 ? html`<p>${String(b.text3).replace(/\*([^*]+)\*/g, '$1')}</p>` : ''}
    ${b.fussnote ? html`<p>${b.fussnote}</p>` : ''}`)}</section>`;
}

/** Der Themenblock unter der Ueberschrift: je Bild einer, alle im selben Feld, einer nach dem anderen sichtbar. */
function rundgangThemen(data, bild) {
  const folge = rundgangFolge(data, bild);
  const n = folge.length;
  if (!folge.some((b) => b.text || b.text2 || b.kicker || b.fakten.length)) return '';
  const mehr = n > 1;
  const teil = (i, k) => raw(mehr
    ? `style="--k: ${k}; animation-name: hero-rg-teil-${n}${i === 0 ? ', hero-rg-intro' : ''}"` : '');
  const klasse = (i) => (mehr && i === 0 ? ' hero__intro' : '');
  const wert = (f) => {
    const z = zahlTeile(f);   // auch bei einem einzigen Thema: die Zahlen zaehlen beim Laden der Seite
    if (!z) return html`<span class="hero__thema-wert">${f.wert}</span>`;
    // Im Markup steht der Endwert; das Skript zaehlt von 'von' dorthin. Vorleser lesen den ganzen Wert.
    const anzeige = `<span class="hero__zahl" data-von="${z.von}" data-bis="${z.zahl}">${z.zahl}</span>${z.plus ? '<span class="hero__plus">+</span>' : ''}${escapeHtml(z.nach)}`;
    return html`<span class="hero__thema-wert"><span class="nur-vorleser">${f.wert}</span><span aria-hidden="true">${raw(anzeige)}</span></span>`;
  };
  // Das sehende Auge bekommt den Rundgang, der Vorleser eine ruhige Zusammenfassung: die Themen wechseln von
  // selbst, und ein Vorleser liest den Aufbau, nicht das, was gerade eingeblendet ist. Darum sind die Textteile
  // der Themen fuer ihn stumm; die Links bleiben erreichbar (sie sind auch per Tastatur erreichbar).
  const stumm = raw(mehr ? ' aria-hidden="true"' : '');
  const themen = html`<div class="hero__themen">${folge.map((b, i) => html`<div class="hero__thema" data-i="${raw(String(i))}" style="--i: ${raw(String(i))}${raw(mehr ? `; animation-name: hero-rg-text-${n}` : '')}"${raw(!mehr || i === 0 ? '' : ' aria-hidden="true"')}>
      ${b.kicker ? html`<p class="hero__thema-kicker hero__t-teil${raw(klasse(i))}" ${teil(i, 0)}${stumm}>${b.kicker}</p>` : ''}
      ${b.text ? html`<p class="hero__thema-text hero__t-teil${raw(klasse(i))}" ${teil(i, 1)}${stumm}>${aussage(b.text)}</p>` : ''}
      ${b.text2 ? html`<p class="hero__thema-text2 hero__t-teil${raw(klasse(i))}" ${teil(i, 1.5)}${stumm}>${aussage(b.text2)}</p>` : ''}
      ${b.fakten.length ? html`<ul class="hero__thema-fakten hero__t-teil${raw(klasse(i))}" ${teil(i, 2)}${stumm}>${b.fakten.map((f) => html`<li>${wert(f)}<span class="hero__thema-label">${f.label}</span></li>`)}</ul>` : ''}
      ${b.text3 ? html`<p class="hero__thema-text3 hero__t-teil${raw(klasse(i))}" ${teil(i, 2.5)}${stumm}>${aussage(b.text3)}</p>` : ''}
      ${b.links.length ? html`<div class="hero__thema-links hero__t-teil${raw(klasse(i))}" ${teil(i, 3)}>${b.links.map((l) => html`<a class="hero__thema-link" href="${raw(escapeAttr(ziel(l.href)))}">${l.label} →</a>`)}</div>` : ''}
      ${b.fussnote ? html`<p class="hero__thema-fuss hero__t-teil${raw(klasse(i))}" ${teil(i, 4)}${stumm}>${b.fussnote}</p>` : ''}
    </div>`)}</div>`;
  return mehr ? html`${themen}${vorleserUeberblick(folge)}` : themen;
}
