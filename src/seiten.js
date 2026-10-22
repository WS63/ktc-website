/**
 * Der Inhalt aller Startseiten, als Daten gegen den Vertrag (P1).
 *
 * Das hier ist KEIN Generator-Ergebnis — es ist die Handarbeit aus Stufe 2.
 * Zahlen, Preise und Adressen stehen NICHT hier drin, sondern als
 * {{facts.pfad}} und kommen aus config/facts.json (P2).
 */

/**
 * Die Bilder kommen aus dem Verzeichnis, nicht aus fest eingetragenen Namen.
 *
 * Grund: der Dateiname traegt eine Pruefsumme des Inhalts. Wer ein Bild
 * austauscht, bekommt einen neuen Namen — und haette sonst hier im Quelltext
 * suchen muessen. So ist ein Bildwechsel: Datei ersetzen, npm run bilder,
 * npm run seed. Nichts davon fasst diese Datei an.
 *
 * Fehlt ein Bild, bleibt das Feld leer. Die Seite erscheint trotzdem (P6).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const verzeichnis = existsSync('inhalte/bilder.json')
  ? JSON.parse(readFileSync('inhalte/bilder.json', 'utf8')) : {};

const bild = (name, groesse = 'gross') => verzeichnis[name]?.[groesse] || '';
const bildAlt = (name) => verzeichnis[name]?.alt || '';

const menue = [
  { label: 'Club',           href: '/' },
  { label: 'Sport',          href: '/sport/' },
  { label: 'Mitglied werden',href: '/mitglied-werden/' },
  { label: 'Aktuelles',      href: '/aktuelles/' },
  { label: 'Termine',        href: '/kalender/' },
  { label: 'Kontakt',        href: '/kontakt/' },
];

/**
 * Die Bilder, die im Aufmacher der Startseite durchblenden.
 *
 * Nur Namen, keine Dateinamen: die Pruefsumme im Dateinamen aendert sich bei
 * jedem Bildwechsel, der Name bleibt. Fehlt eines, faellt es stumm aus der
 * Liste — die uebrigen blenden weiter (P6).
 */
// Der Rundgang des Aufmachers: die Startseite in Themen. Je Bild ein Thema mit Kernaussage, Zahlen und
// Links zu den Unterseiten. Zahlen und Namen aus den Fakten (P2), nie getippt; die Auskuenfte selbst
// (Zeiten, Preislisten, Tabellen) stehen auf den Unterseiten.
const thema = (name, kicker, text, fakten, links, fussnote = '', text2 = '', text3 = '') =>
  ({ src: bild(name), alt: bildAlt(name), kicker, reiter: kicker, text, text2, text3, fakten, links, fussnote });
// Die Aussage steht weiss, die Zahlen darunter im Akzent (Schluesselwoerter zwischen Sternen, *Wort*, waeren
// moeglich, sind hier nicht gesetzt: weiss und eine farbige Zahlenzeile wirken ruhiger).
// Das Thema 'Dabei sein': EINE Quelle fuer den Aufmacher der Startseite und den der Seite 'Mitglied werden' (P3).
const THEMA_DABEI_SEIN =
thema('anlage-wiese', 'Dabei sein',
    'Als Neumitglied im ersten Jahr nur *{{facts.beitraege.neumitglied_erstes_jahr}} €*',
    [{ wert: '{{facts.beitraege.aufnahmegebuehr}}', ab: 100, einheit: '€', label: 'Aufnahmegebühr' },
     { wert: '{{facts.beitraege.arbeitsstunden}}', ab: 20, label: 'Arbeitsstunden' },
     { wert: '{{facts.beitraege.verzehrgutscheine}}', ab: 100, einheit: '€', label: 'Verzehrgutscheine' }],
    [{ label: 'Beiträge und Anmeldung', href: '/mitglied-werden/' }, { label: 'Aktuelles und Termine', href: '/aktuelles/' }],
    'Voraussetzung für den Neumitglieder-Preis: {{facts.beitraege.neumitglied_voraussetzung}}.',
    'Nur das Training kommt dazu.',
    'Kinder und Jugendliche zahlen {{facts.beitraege.jugend}} €, mit einem aktiven Elternteil {{facts.beitraege.jugend_familie}} €.');

// Zahlen zaehlen mit dem Einblenden: 'rund 120' erscheint als '120+', 'keine' mit 'ab' zaehlt herunter
// (von 100 auf 0 Euro; die 100 ist nur die Startmarke der Animation, kein Beitrag).
const AUFMACHER_RUNDGANG = [
  thema('anlage-zentrum-unten', 'Der Club',
    'Zum Spielen und zum *Bleiben*',
    [{ wert: '{{facts.anlage.plaetze}}', label: '{{facts.anlage.belag}}plätze' },
     { wert: '{{facts.anlage.plaetze_led}}', label: 'mit LED-Flutlicht' },
     { wert: '{{facts.anlage.saison_tage}}', label: 'Tage Freiluft-Tennis, {{facts.anlage.saison}}' }],
    [{ label: 'Clubhaus und Terrasse', href: '/clubhaus/' }, { label: 'So findest du uns', href: '/kontakt/' }],
    '', 'Gemütliches Clubhaus und sonnige Terrasse mit Gastronomie.'),
  thema('sport-wettkampf4', 'Sport',
    'Du entscheidest, wie ernst es wird',
    [{ wert: '{{facts.anlage.mannschaften}}', label: 'eigene Mannschaften' },
     { wert: '{{facts.anlage.mannschaftsspieler}}', label: 'Aktive in Mannschaften' },
     { wert: '{{facts.anlage.hobbyrunde}}', label: 'Aktive in der Hobbyrunde' }],
    [{ label: 'Zu den Mannschaften', href: '/mannschaften/' }, { label: 'Zur Hobbyrunde', href: '/sport/#hobby' }],
    '', 'Vom Schnupperkurs über die Hobbyrunde bis zu den Medenspielen, in deinem Tempo.'),
  thema('sport-jugend', 'Jugend & Training',
    'Erst die Kinder, dann die Eltern',
    [{ wert: '{{facts.anlage.jugendliche}}', label: 'Kinder und Jugendliche' },
     { wert: '{{facts.anlage.jugendmannschaften}}', label: 'Jugendmannschaften' },
     { wert: '{{facts.anlage.tennisschule_jahre}}', label: 'Jahre Tennisschule Kaus' }],
    [{ label: 'Zur Jugend', href: '/sport/#jugend' }, { label: 'Zur Tennisschule', href: '/sport/#tennisschule' }],
    '', 'Von den Minis bis zu den Jugendmannschaften. Die Tennisschule Kaus trainiert und betreut Kinder wie Erwachsene.'),
  // Dreimal null: was beim Einstieg wegfaellt. Die Zahlen zaehlen von einer Startmarke auf 0 herunter (die Marke
  // ist Animation, kein Beitrag). Der Beitrag fuer Neue steht als Schluesselwort in der Aussage.
  THEMA_DABEI_SEIN,
].filter((b) => b.src);

/**
 * Die Mannschaften der laufenden Saison.
 *
 * Eine Datei je Jahr unter inhalte/mannschaften/. Die juengste gilt; die
 * aelteren bleiben liegen und sind das Archiv — wer wissen will, wer 2026
 * in welcher Liga spielte, findet es dort. Angelegt wird sie im April,
 * sobald der HTV die Gruppeneinteilung veroeffentlicht hat.
 *
 * Fehlt das Verzeichnis, bleiben die Tabellen leer und die Seite steht
 * trotzdem (P6).
 */
import { saison } from './mannschaften.js';
import { slugVon } from './kalender-abo.js';
export { saison };

/**
 * Eine Mannschaft als Tabellenzeile: der Name, bei einer Spielgemeinschaft mit dem Partner klein darunter (statt
 * einer fast leeren Spalte), die Staerke, und die Spielklasse als Link auf ihre HTV-Gruppe. Alle Zeilen sind gleich
 * hoch; wer keine Spielgemeinschaft ist, hat unter dem Namen einfach Luft.
 */
const mannschaftsZeile = (m) => [
  m.sg && m.sg !== '—' ? { text: m.name, zusatz: `SG ${m.sg}` } : m.name,
  m.staerke,
  { text: m.klasse, href: htv(m.gruppe, saison.wettbewerbe[m.wettbewerb || 'standard']) },
];

/**
 * Mannschaften in zwei Spalten gruppieren: 'links' und 'rechts' sind je ein Namensanfang (Damen / Herren,
 * Juniorinnen / Junioren). Was zu keinem passt (Mixed, Gemischt), steht in der linken Spalte, mit
 * 'zwischenzeile' unter einer eigenen Ueberschrift (sie zaehlt als eine Zeile), sonst ohne und die linke
 * Ueberschrift nennt es mit ('Juniorinnen und gemischt'). Ziel: beide Spalten haben gleich viele Zeilen und
 * enden unten buendig. Alles kommt aus der Jahresdatei, nichts davon ist getippt.
 */
function inZweiSpalten(liste, links, rechts, rest, { zwischenzeile = true } = {}) {
  const nach = (re) => liste.filter((m) => re.test(m.name));
  const uebrig = liste.filter((m) => !links.re.test(m.name) && !rechts.re.test(m.name));
  const alleRest = uebrig.length && uebrig.every((m) => rest.re.test(m.name));
  return [
    [{ titel: links.titel, zeilen: [
      ...nach(links.re).map(mannschaftsZeile),
      ...(uebrig.length && zwischenzeile ? [{ zwischen: alleRest ? rest.titel : 'Weitere' }] : []),
      ...uebrig.map(mannschaftsZeile),
    ] }],
    [{ titel: rechts.titel, zeilen: nach(rechts.re).map(mannschaftsZeile) }],
  ];
}

/**
 * Die Mannschaften fuer die Auswahl im Kalender-Abo — aus derselben Jahresdatei
 * wie die Tabellen. Neue Saison: neue Datei, npm run seed, die Liste stimmt.
 * Das Abo selbst stand erst als eigene Spalte in der Tabelle: 29 Zeilen mal zwei
 * blaue Links drueckten die Spielklasse an den Rand. Jetzt eine Auswahl an einem Ort.
 */
const ABO_MANNSCHAFTEN = [
  ...saison.erwachsene.map((m) => ({ name: m.name, slug: slugVon(m.name), gruppe: 'Erwachsene' })),
  ...saison.jugend.map((m) => ({ name: m.name, slug: slugVon(m.name), gruppe: 'Jugend' })),
];

/**
 * Die Adresse einer Spielgruppe beim Hessischen Tennisverband.
 *
 * Dort stehen Spielplan, Tabelle und Ergebnisse — immer aktuell, auch wenn
 * ein Spiel verlegt wird. Deshalb VERLINKEN statt abschreiben: eine Kopie der
 * Termine auf dieser Website waere ab der ersten Verlegung falsch, und jemand
 * faehrt umsonst zur Anlage.
 *
 * Die Gruppennummern gelten je Saison. Beim Saisonwechsel aendern sich BEIDE
 * — WETTBEWERB und jede Nummer in der Tabelle unten. Das ist Handarbeit
 * einmal im Jahr, und sie faellt auf, weil die Links sonst ins Leere gehen.
 */
const htv = (gruppe, wettbewerb) =>
  'https://htv.liga.nu/cgi-bin/WebObjects/nuLigaTENDE.woa/wa/groupPage'
  + `?championship=${wettbewerb}&group=${gruppe}`;

const NAV = { type: 'nav', data: {
  marke: 'Krifteler Tennis-Club e.V.',
  baum: menue,
  aktionLabel: 'Platz buchen',
  aktionHref: '{{facts.links.buchung}}',
  // Die Wortmarke des Buchungssystems statt des Wortes: Mitglieder kennen
  // eBuSy, und das Zeichen sagt 'hier geht es in ein anderes System'.
  aktionArt: 'ebusy',
  // Kein Knopf in der Leiste: 'Mitglied werden' steht als Menuepunkt da und
  // im Aufmacher als der eine gelbe Knopf. Ein dritter Auftritt derselben
  // Handlung in derselben Bildschirmhoehe macht sie nicht dringlicher.
}};

/**
 * Der Assistent steht auf jeder Seite. Er ist eine Nebensache im Sinne von P6:
 * faellt er aus, bleibt die Website vollstaendig bedienbar.
 */
// Lisa: Name und Rolle stehen in den Fakten (facts.assistent), Bild und Vorschlaege in config/assistent.json.
// Der Server setzt sie beim Ausliefern ein (src/routes/public.js) — hier steht nur, DASS sie da ist.
const ASSISTENT = { type: 'assistent', data: {} };

const FOOTER = { type: 'footer', data: {
  zeile: '{{facts.verein.name}} · {{facts.verein.strasse}}, {{facts.verein.plz}} {{facts.verein.ort}}',
  // 'Clubhaus' steht hier und nicht in der Kopfzeile: das Restaurant ist
  // kein Vereinsthema und soll die sechs Menuepunkte nicht auf sieben
  // bringen. Aber es ist die Seite mit den Oeffnungszeiten — wer sie auf
  // dem Telefon einmal verlassen hat, findet sie sonst nicht wieder.
  baum: [
    { label: 'Restaurant',  href: '/clubhaus/' },
    { label: 'Häufige Fragen', href: '/faq/' },
    { label: 'Impressum',   href: '/impressum/' },
    { label: 'Datenschutz', href: '/datenschutz/' },
  ],
}};

/**
 * Die EINE Handlung aus Stufe 0 braucht einen Ort, an dem sie landet.
 * Nicht mehr Felder als noetig — jedes Feld, das du nicht erhebst,
 * musst du nicht schuetzen.
 */
const FORMULAR = { type: 'formular', data: {
  name: 'mitgliedschaft',
  titel: 'Schreib uns',
  vorspann: 'Frage zur Mitgliedschaft, Schnuppertraining oder etwas anderes. Wir melden uns.',
  felder: [
    { name: 'name',     label: 'Dein Name',  typ: 'text',       pflicht: true },
    { name: 'email',    label: 'E-Mail',     typ: 'email',      pflicht: true },
    { name: 'nachricht',label: 'Worum geht es?', typ: 'mehrzeilig', pflicht: true },
  ],
  knopf: 'Absenden',
  danke: 'Danke. Wir melden uns bei dir.',
}};

const vorstand = ['erster', 'zweite', 'sport', 'jugend', 'kasse', 'technik', 'presse'].map((k) => ({
  rolle:   `{{facts.vorstand.${k}.rolle}}`,
  name:    `{{facts.vorstand.${k}.name}}`,
  telefon: `{{facts.vorstand.${k}.telefon}}`,
  email:   `{{facts.vorstand.${k}.email}}`,
}));

// Lisa als achte Karte: kein Vorstandsmitglied, aber der schnellste Weg zu einer Antwort.
// Ohne Assistent (kein Schluessel) fehlt die Karte, sonst fuehrte ihr Link ins Leere.
const lisaKarte = {
  rolle: 'KI-Assistentin', name: '{{facts.assistent.name}}',
  bild: bild('lisa', 'klein'),
  text: 'Nicht im Vorstand, aber immer da.',
  linkLabel: 'Frag {{facts.assistent.name}}', linkHref: '#frag-lisa', nurMitAssistent: true,
};

export const seiten = [

// ══════════════════════════════════════════════════════════ STARTSEITE
{
  slug: 'start', page_type: 'home',
  title: 'Lust auf Tennis?',
  description: 'Krifteler Tennis-Club: sieben Sandplätze, über 500 Mitglieder, Tennis in familiärer Atmosphäre im Main-Taunus-Kreis.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      // Keine Pille, kein Untertitel. Zwei Zeilen neben dem Logo: der
      // Vereinsname fuehrt, die Frage antwortet leiser darunter.
      wortmarke: 'Krifteler Tennis-Club',
      titel: 'Lust auf Tennis',
      ctaLabel: 'Mitglied werden', ctaHref: '/mitglied-werden/',
      zweitLabel: 'Erst mal vorbeikommen', zweitHref: '/kontakt/',
      // Rundgang: die Startseite in Themen. Mit jedem Bild wechseln Thema, Kernaussage, Zahlen und Link
      // (AUFMACHER_RUNDGANG oben); Name, Claim und die Knoepfe bleiben. Das erste Bild: blauer Himmel,
      // roter Sand, die Flutlichtmasten.
      bild: bild('anlage-zentrum-unten'), bildAlt: bildAlt('anlage-zentrum-unten'),
      bilder: AUFMACHER_RUNDGANG,
      marke: 'ja', aufbau: 'rundgang',
      weiterLabel: 'Aktuelles', weiterHref: '#aktuell',
    }},
    // Direkt unter dem Aufmacher, der den Club in Themen vorstellt: der Verein, der LEBT. Fuer das
    // Mitglied, das jede Woche kommt, ist das der Grund der Seite. Fuer den Interessenten ist ein
    // voller Kalender ein Argument. Bewusst ohne Knopf: der eine gelbe gehoert 'Mitglied werden'.
    { type: 'aktuell', data: {
      // Grau: der lebendige Teil der Seite (Neuigkeiten, Termine), danach die dunkle Fusszeile.
      // Die Seite endet hier: den Einstieg (Beitrag, Anmeldung) sagt der Aufmacher, der Knopf und das Menue.
      grund: 'ruhig',
      beitraegeHref: '/aktuelles/',
      termineHref: '/kalender/',
      ergebnisseHref: '/ergebnisse/',
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ SPORT
{
  slug: 'sport', page_type: 'sport',
  title: 'Sport',
  description: 'Wettkampf, Hobbyrunde, Jugend und Tennisschule beim Krifteler Tennis-Club. Alles auf einer Seite.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Spielen beim KTC',
      titel: 'Tennis in jedem Alter und auf jedem Niveau',
      hoehe: 'niedrig',
      sub: 'Vom ersten Schläger bis zum Punktspiel. Such dir aus, was zu dir passt. Wechseln kannst du jederzeit.',
      // Der gelbe Knopf steht am Ende der Seite (Aufruf), wenn man das Angebot kennt. Oben ein leiser Einstieg.
      zweitLabel: 'Einsteigertraining', zweitHref: '#einsteiger',
      bild: bild('anlage-tennisplatz'), bildAlt: bildAlt('anlage-tennisplatz'),
    }},
    // Die vier Wege ins Spielen, gleich oben. Wer die Jugendarbeit sucht,
    // soll nicht erst an der Medenrunde vorbeiscrollen.
    { type: 'cards', data: {
      karten: [
        // Diese eine Karte fuehrt NICHT zu einem Abschnitt weiter unten,
        // sondern direkt auf die Mannschaftsseite. Grund: bei den drei
        // anderen steht die Antwort auf dieser Seite, hier liegt sie auf
        // einer eigenen. Ein 'Weiterlesen', das nur scrollt und dann einen
        // zweiten Klick verlangt, ist ein Umweg mit Zwischenhalt.
        { titel: 'Team und Wettkampf', text: 'Alle Mannschaften von der Kreis- bis zur Landesebene, mit Spielklasse und Link zum Spielplan.',
          linkLabel: 'Zu den Mannschaften', linkHref: '/mannschaften/',
          bild: bild('club-tennisnetz', 'mittel'), bildAlt: bildAlt('club-tennisnetz') },
        { titel: 'Hobby und Freizeit', text: 'Die Hobbyrunde: locker spielen, Leute kennenlernen, Anschluss finden.',
          linkLabel: 'Weiterlesen', linkHref: '/sport/#hobby',
          bild: bild('anlage-wiese', 'mittel'), bildAlt: bildAlt('anlage-wiese') },
        { titel: 'Jugend', text: 'Fördern und fordern, von den Minis ab fünf bis zur U18.',
          linkLabel: 'Weiterlesen', linkHref: '/sport/#jugend',
          bild: bild('sport-jugend', 'mittel'), bildAlt: bildAlt('sport-jugend') },
        { titel: 'Tennisschule', text: 'Die Tennisschule Kaus, seit über 35 Jahren beim KTC.',
          linkLabel: 'Weiterlesen', linkHref: '/sport/#tennisschule',
          bild: bild('anlage-platz2', 'mittel'), bildAlt: bildAlt('anlage-platz2') },
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Team und Wettkampf',
      anker: 'wettkampf',
      absaetze: [
        'Der KTC stellt {{facts.anlage.mannschaften}} Wettspiel-Mannschaften in unterschiedlichen Alters- und Leistungsklassen. Das Spektrum reicht von den Kindern der U12 bis zu den Senioren 60. Unsere Mannschaften spielen um jeden Punkt, aber auch für die Geselligkeit.',
        'Welche Teams antreten, in welcher Spielklasse und wo der Spielplan steht: [alle Mannschaften im Überblick](/mannschaften/). Wie sie am Wochenende gespielt haben, steht unter [Ergebnisse](/ergebnisse/).',
        '**Du möchtest in einer Mannschaft spielen?** Dein Ansprechpartner ist {{facts.vorstand.sport.name}}, {{facts.vorstand.sport.rolle}}: {{facts.vorstand.sport.telefon}} oder [{{facts.vorstand.sport.email}}](mailto:{{facts.vorstand.sport.email}}).',
      ],
    }},
    // Der Einstieg: so faengt man an, bevor man sich festlegt. Rhythmus und Ende sind Erfahrungswerte
    // (Fakten, nicht getippt); der Bedarf entscheidet.
    { type: 'richtext', data: {
      titel: 'Einsteigertraining',
      anker: 'einsteiger',
      absaetze: [
        'Zu Beginn der Saison startet das Einsteigertraining, {{facts.einsteiger.rhythmus}}. Du machst ein- oder zweimal mit und entscheidest dann in Ruhe, ob du weitermachst und ob du Mitglied werden möchtest.',
        '**Melde dich vorher kurz an**, dann sagen wir dir, wann es losgeht: über die [Kontaktseite](/kontakt/). Die Termine richten sich nach dem Bedarf und laufen üblicherweise bis {{facts.einsteiger.ende}}.',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Hobby und Freizeit',
      anker: 'hobby',
      absaetze: [
        'Die Hobbyrunde ist die einfachste Art, beim KTC anzukommen. Du findest spielerisch Anschluss und lernst Leute kennen, die zu deinem Niveau passen. Geselligkeit, Spielpraxis und Spaß stehen im Mittelpunkt, eine professionelle Anleitung ist dabei.',
        '**Für die Hobbyrunde meldest du dich vorher an.** Ansprechpartner ist {{facts.vorstand.sport.name}}.',
        'Die Hobbyrunde organisiert außerdem Freundschaftsspiele gegen Teams anderer Vereine, unter turnierähnlichen Bedingungen und auf wechselnden Anlagen. Das richtet sich an alle, die erste Wettspiel-Erfahrung sammeln wollen, an Mitglieder ohne festen Mannschaftsplatz und an Mannschaftsspieler mit Leistungsklasse 22 bis 25.',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Jugend',
      anker: 'jugend',
      absaetze: [
        'Im KTC hat die Förderung von Kindern und Jugendlichen einen besonderen Stellenwert. Die Nachwuchsarbeit ist das Herz des Vereins. Sie sorgt für frischen Wind und Gemeinschaft auf und neben dem Platz.',
        'Unser Ziel: Kindern und Jugendlichen die besten Bedingungen bieten, um Tennis mit Spaß zu lernen, sich sportlich weiterzuentwickeln und über sich hinauszuwachsen. Dabei zählt nicht nur das Training, sondern auch Teamgeist, Fairness und das gemeinsame Erlebnis im Club.',
        'Wir führen unsere jungen Talente Schritt für Schritt an das Turniertennis heran und ebnen ihnen den Weg in die Erwachsenenmannschaften.',
        '**Dein Ansprechpartner für die Jugend:** {{facts.vorstand.jugend.name}}, {{facts.vorstand.jugend.rolle}}: {{facts.vorstand.jugend.telefon}} oder [{{facts.vorstand.jugend.email}}](mailto:{{facts.vorstand.jugend.email}}).',
      ],
    }},
    // Die Tennisschule steht DIREKT unter der Jugend, nicht hinter den
    // Minis: 'Tennis fuer Minis' ist eines ihrer Angebote, nicht ihr
    // Vorspann. Vorher las sich die Reihenfolge so, als sei die Schule ein
    // Nachtrag zum Minikurs. Der graue Grund fasst sie als eigenen Bereich.
    { type: 'richtext', data: {
      titel: 'Tennisschule Kaus',
      anker: 'tennisschule',
      grund: 'ruhig',
      // Das Logo der Tennisschule rechts neben dem Text. Fuer den Test mit
      // weissem Grund geliefert; 'logo' laesst das Weiss verschwinden. Kommt eine
      // Fassung mit echter Transparenz, wird nur die Datei in bilder/logos/
      // ausgetauscht (siehe bilder/LIESMICH.md) — hier aendert sich nichts.
      bild: bild('tennisschule-kaus', 'gross'), bildAlt: bildAlt('tennisschule-kaus'), bildStil: 'logoklein',
      absaetze: [
        'Seit {{facts.anlage.tennisschule_seit}} vertraut der KTC auf die Kompetenz der {{facts.anlage.tennisschule}}. Geleitet von den staatlich geprüften Tennislehrern Bertrand und Oliver Kaus, steht sie für Qualität, Engagement und messbaren Trainingserfolg.',
        'Mit einem motivierten Trainerteam und modernen Lehrmethoden begleitet sie Kinder, Jugendliche und Erwachsene, vom Einsteiger bis zum Turnierspieler. Sie gehört zu den vom Deutschen Tennis Bund und vom Verband Deutscher Tennislehrer anerkannten Top-50-Tennisschulen.',
        'Kosten für individuelles Training, Tennis-Camps und Kurse sind nicht im Clubbeitrag enthalten. Eines ihrer Angebote ist der Kurs **Tennis für Minis** für die Jüngsten. Kinder können in der ersten Saison ohne Mitgliedschaft mittrainieren, [so geht’s](/mitglied-werden/#kinder-training).',
      ],
    }},
    { type: 'infokarten', data: {
      titel: 'Tennis für Minis',
      karten: [
        { label: 'Wann',    wert: '{{facts.minis.tag}}', zusatz: '{{facts.minis.zeit}}, außer in den Schulferien' },
        { label: 'Wer',     wert: '{{facts.minis.alter}}', zusatz: 'Kinder und Eltern gemeinsam auf dem Platz' },
        { label: 'Umfang',  wert: '{{facts.minis.einheiten}} Einheiten', zusatz: 'Schläger werden gestellt, Sportschuhe mitbringen' },
        { label: 'Kosten',  wert: '{{facts.minis.kursgebuehr_kind}} €', zusatz: 'Kind · Erwachsene parallel {{facts.minis.kursgebuehr_erwachsen}} €' },
      ],
    }},
    // Grauer Grund wie Tennisschule und Minikarten darueber: die drei
    // Abschnitte sind EIN Bereich. Weiss an dieser Stelle riss den Kurs
    // von seinen eigenen Eckdaten ab.
    { type: 'richtext', data: {
      grund: 'ruhig',
      absaetze: [
        'Die Gruppen sind klein: bis zu {{facts.minis.gruppengroesse_kinder}} Kinder, parallel {{facts.minis.gruppengroesse_erwachsene}} Erwachsene. **Bitte ruf vor der Anmeldung kurz an**, damit wir die passende Altersgruppe finden. Ansprechpartner: {{facts.minis.kontakt_name}}, {{facts.minis.kontakt_telefon}}.',
      ],
    }},
    // Der eine gelbe Knopf der Seite: hier, wo das Angebot gelesen ist, nicht schon im Aufmacher.
    { type: 'aufruf', data: {
      titel: 'Dabei sein?',
      text: 'Als Neumitglied zahlen Erwachsene im ersten Jahr nur {{facts.beitraege.neumitglied_erstes_jahr}} €. Keine Aufnahmegebühr, keine Arbeitsstunden.',
      knopfLabel: 'Mitglied werden', knopfHref: '/mitglied-werden/',
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ MANNSCHAFTEN
//
// Eigene Seite, weil die Tabelle mit siebzehn Teams die Sportseite erschlug.
// Wer die Spielklasse der Herren 50 sucht, will nicht erst an Hobbyrunde,
// Jugend und Tennisschule vorbeiscrollen.
{
  slug: 'mannschaften', page_type: 'standard',
  title: 'Mannschaften',
  description: 'Alle Wettspiel-Mannschaften des Krifteler Tennis-Clubs mit Spielgemeinschaft, Teamstärke und Spielklasse.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Medenrunde',
      titel: 'Unsere Mannschaften',
      hoehe: 'niedrig',
      sub: 'Alle Wettspiel-Teams der Erwachsenen und der Jugend, von der Kreis- bis zur Landesebene.',
      // Wer die Teams ansieht, will meist wissen, wie sie gespielt haben.
      zweitLabel: 'Ergebnisse vom Wochenende', zweitHref: '/ergebnisse/',
      bild: bild('anlage-tennisplatz'), bildAlt: bildAlt('anlage-tennisplatz'),
    }},
    { type: 'tabelle', data: {
      titel: 'Mannschaften der Erwachsenen',
      kopf: ['Mannschaft', 'Teamstärke', 'Spielklasse'],
      spalten: inZweiSpalten(saison.erwachsene, { titel: 'Damen', re: /^Damen/ }, { titel: 'Herren', re: /^Herren/ },
        { titel: 'Mixed', re: /^Summer Mixed/ }),
      hinweis: 'SG steht für Spielgemeinschaft: ein Team zusammen mit einem Partnerverein. Ein Klick auf die Spielklasse führt zur Gruppe beim Hessischen Tennisverband. Dort stehen Spielplan, Tabelle und Ergebnisse. Alle Spiele deiner Mannschaft direkt in deinem Kalender: [Kalender abonnieren](/kalender/#abo)',
    }},
    { type: 'tabelle', data: {
      titel: 'Mannschaften der Jugend',
      kopf: ['Mannschaft', 'Teamstärke', 'Spielklasse'],
      spalten: inZweiSpalten(saison.jugend, { titel: 'Juniorinnen und gemischt', re: /^Juniorinnen/ }, { titel: 'Junioren', re: /^Junioren/ },
        { titel: 'Gemischt', re: /^Gemischt/ }, { zwischenzeile: false }),
      hinweis: 'Mehrere Jugendteams treten als Spielgemeinschaft (SG) mit Diedenbergen und Kelkheim an. So bekommt jede Altersklasse genug Spielerinnen und Spieler zusammen.',
    }},
    { type: 'richtext', data: {
      absaetze: [
        'Du willst mitspielen? Schreib an {{facts.vorstand.sport.name}} oder schau dir an, [wie eine Mitgliedschaft aussieht](/mitglied-werden/).',
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ MITGLIED WERDEN
{
  slug: 'mitglied-werden', page_type: 'standard',
  title: 'Mitglied werden',
  description: 'Beiträge, Bedingungen und Anmeldung beim Krifteler Tennis-Club. Keine Aufnahmegebühr, keine Arbeitsstunden.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      titel: 'Mitglied werden',
      // Derselbe Aufmacher wie das Thema 'Dabei sein' der Startseite: ein Thema, die drei Nullen zaehlen herunter.
      aufbau: 'rundgang', hoehe: 'niedrig',
      bild: bild('anlage-wiese'), bildAlt: bildAlt('anlage-wiese'),
      bilder: [THEMA_DABEI_SEIN],
      ctaLabel: 'Jetzt anmelden', ctaHref: '{{facts.links.buchung}}',
      zweitLabel: 'Erst mal fragen', zweitHref: '/kontakt/',
    }},
    // Die Antwort auf die haeufigste Frage zuerst, gross: drei Betraege, darunter das
    // Angebot fuer Neue, dann die ganze Liste.
    { type: 'infokarten', data: {
      titel: 'Unsere Mitgliedsbeiträge',
      titelGroesse: 'gross',
      grund: 'weiss',
      stil: 'kraeftig',
      karten: [
        { label: 'Erwachsene',   wert: '{{facts.beitraege.aktiv}} €',           zusatz: 'pro Jahr, aktives Mitglied' },
        { label: 'In Ausbildung', wert: '{{facts.beitraege.aktiv_ausbildung}} €', zusatz: 'pro Jahr, bis 27 mit Nachweis' },
        { label: 'Jugend',       wert: '{{facts.beitraege.jugend}} €',          zusatz: 'pro Jahr, bis 18 Jahre' },
      ],
    }},
    { type: 'preise', data: {
      titel: 'Alle Beiträge im Detail',
      titelGroesse: 'klein',
      // Kein Spaltenkopf: 'Mitgliedschaft' und 'pro Jahr' stehen ueber einer
      // Liste, die sich selbst erklaert. Der Zeitraum steht im Hinweis.
      zeilen: [
        { label: 'Neumitglied Erwachsene, erstes Jahr', fussnote: 1, wert: '{{facts.beitraege.neumitglied_erstes_jahr}} EUR', hervor: true },
        { label: 'Aktives Mitglied (1. Mitglied)', wert: '{{facts.beitraege.aktiv}} EUR' },
        { label: 'Aktives Mitglied (2. Mitglied als Ehe- oder Lebenspartner)', wert: '{{facts.beitraege.aktiv_partner}} EUR' },
        { label: 'Aktives Mitglied in Ausbildung', fussnote: 2, wert: '{{facts.beitraege.aktiv_ausbildung}} EUR' },
        { label: 'Jugendmitglied (bis vollendetem 18. Lebensjahr)', wert: '{{facts.beitraege.jugend}} EUR' },
        { label: 'Jugendmitglied als Familienmitglied', fussnote: 3, wert: '{{facts.beitraege.jugend_familie}} EUR' },
        { label: 'Passives Mitglied', wert: '{{facts.beitraege.passiv}} EUR' },
      ],
      // Die beiden Erlaeuterungen standen vorher als Absaetze unter der
      // Tabelle. Als Fussnote sitzen sie an der Zeile, zu der sie gehoeren.
      fussnoten: [
        'Voraussetzung: {{facts.beitraege.neumitglied_voraussetzung}}.',
        'Gegen Nachweis eines Schüler-, Studenten- oder Ausbildungsausweises, bis zum vollendeten 27. Lebensjahr. Stichtag für alle Altersgrenzen ist der 31. Dezember des jeweiligen Jahres.',
        'Setzt voraus, dass mindestens ein Elternteil aktives Mitglied ist.',
      ],
      // Drei Auskuenfte nebeneinander in einem Band statt eines Absatzes: so steht jede
      // fuer sich da und das Ganze reicht ueber die volle Breite.
      infos: [
        { label: 'Abrechnung', text: 'Alle Beiträge gelten für das Kalenderjahr.' },
        { label: 'Einstieg ab {{facts.beitraege.halber_beitrag_ab}}', text: 'Wer später einsteigt, zahlt für das laufende Jahr die Hälfte.' },
        { label: 'Kündigung zum Jahresende', text: 'Spätester Termin ist der {{facts.beitraege.kuendigungsfrist}}.' },
      ],
      // Kein zweiter Knopf: der gelbe steht im Aufmacher. Hier nur der Hinweis, wohin die Anmeldung fuehrt.
      knopfHinweis: 'Die Anmeldung läuft über unsere Mitgliedsverwaltung [eBuSy]({{facts.links.buchung}}).',
    }},
    // Kinder im laengeren Schnupperkurs brauchen keine Mitgliedschaft, aber die Anmeldung ueber eBuSy:
    // einmaliger Gastspielbeitrag fuer EINE Saison, dort der Haken statt des Mitgliedsantrags.
    { type: 'richtext', data: {
      titel: 'Kindertraining ohne Mitgliedschaft',
      anker: 'kinder-training',
      grund: 'ruhig',
      bild: bild('sport-jugend', 'mittel'), bildAlt: bildAlt('sport-jugend'),
      absaetze: [
        'Nimmt dein Kind an einem längeren Schnupperkurs bei der {{facts.anlage.tennisschule}} teil, muss es nicht gleich Mitglied werden. Für die Sommersaison zahlt es einmalig **{{facts.kindertraining.beitrag}} €** Gastspielbeitrag. Das gilt für **eine Saison**: Im Folgejahr ist für das Training eine Mitgliedschaft nötig.',
        'Der Beitrag gilt für die Plätze **während des Trainings**. Zum freien Spielen außerhalb des Trainings braucht dein Kind eine Mitgliedschaft. Den Unterricht selbst stellt die Tennisschule gesondert in Rechnung.',
        '**So meldest du dein Kind an:** Die Anmeldung läuft über [eBuSy]({{facts.links.buchung}}). Setze dort statt eines Mitgliedschaftsantrags den Haken bei „{{facts.kindertraining.ebusy_haken}}“.',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Gastspieler und Spinde',
      bild: bild('anlage-platz2', 'mittel'), bildAlt: bildAlt('anlage-platz2'),
      absaetze: [
        'Gäste sind willkommen, egal ob jung oder alt. Ein Gastspiel kostet {{facts.gast.gebuehr}} € pro Gast, höchstens {{facts.gast.max_doppel}} Gäste im Doppel, und dauert {{facts.gast.dauer_einzel}} im Einzel oder {{facts.gast.dauer_doppel}} im Doppel. Es ist nur zusammen mit einem Vereinsmitglied möglich, nicht aber zeitgleich zu Turnieren oder Punktspielen. Buchung und Abrechnung laufen über das Vereinsmitglied. Die Regeln dazu stehen in der [Platzordnung in eBuSy]({{facts.links.buchung}}).',
        'Einen Spind gibt es für {{facts.spind.gebuehr}} € im Jahr. Schreib dazu an [{{facts.verein.email}}](mailto:{{facts.verein.email}}).',
      ],
    }},
    { ...FORMULAR, data: { ...FORMULAR.data,
      aufbau: 'kompakt',
      titel: 'Noch eine Frage offen?',
      vorspann: 'Schreib uns, bevor du dich anmeldest. Wir antworten meist am selben Tag.',
      // Der gelbe Knopf dieser Seite steht schon im Aufmacher.
      knopfStil: 'leise' } },
    // Ganz hinten, leise: die Satzung liest, wer ohnehin Mitglied wird. Aus der Fusszeile genommen (Migration 015).
    { type: 'richtext', data: {
      titel: 'Zum Nachlesen',
      absaetze: ['Die Regeln des Vereins: [Satzung und Platzordnung](/satzung-und-ordnungen/).'],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ CLUBHAUS
//
// Nicht in der Navigation — so gewollt. Erreichbar aus dem Fliesstext der
// Startseite, aus dem Streifen darunter, aus der FAQ und aus der Fusszeile.
//
// Warum es die Seite ueberhaupt gibt, obwohl der Streifen schon die Zeiten
// zeigt: der Clubwirt hat keine eigene Website. Was hier nicht steht, steht
// nirgends — ausser in Branchenverzeichnissen, die den Ruhetag nicht kennen.
{
  slug: 'clubhaus', page_type: 'standard',
  title: 'Restaurant und Terrasse',
  description: 'Das Clubrestaurant des Krifteler Tennis-Clubs mit Sonnenterrasse: Küche, Öffnungszeiten und Tischreservierung.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      titel: 'Restaurant und Terrasse',
      sub: 'Essen, trinken und sitzen bleiben, auf der wohl schönsten Sonnenterrasse Kriftels. Auch ohne Schläger.',
      bild: bild('anlage-wiese'), bildAlt: bildAlt('anlage-wiese'),
      // Kein Knopf. Die Handlung hier ist ein Anruf, und der steht als
      // Zeile im Streifen. Der eine gelbe Knopf gehoert 'Mitglied werden'.
    }},
    { type: 'streifen', data: {
      seite: 'rechts',
      // Das Logo des Paechters, nicht unseres — deshalb klein ueber der
      // Ueberschrift und nicht in der Kopfzeile.
      logo: bild('logo-restaurant', 'mittel'), logoAlt: bildAlt('logo-restaurant'),
      titel: 'Das Clubrestaurant',
      text: '**{{facts.gastronomie.name}}** bringt {{facts.anlage.belag}}platz und Currygeruch zusammen: Clubwirt {{facts.gastronomie.wirt}} kocht {{facts.gastronomie.kueche}} nach Originalrezepten, mit frischen Zutaten, hausgemachten Soßen und einer großen Auswahl an vegetarischen und veganen Gerichten. Beliebt sind die fettarmen Tandoori-Gerichte aus dem traditionellen Ofen, aber auch Bodenständiges für unsere Sportler und Jugendlichen.',
      bild: bild('club-restaurant', 'mittel'), bildAlt: bildAlt('club-restaurant'),
      zeilen: [
        // Zwei Werte, zwei Zeilen. Als ein Text mit Mitteltrenner brach der
        // Umbruch dort, wo er gerade passte — 'Uhr' stand allein unten.
        { label: '{{facts.gastronomie.zeiten_werktage}}',
          wert: ['{{facts.gastronomie.zeiten_mittag}}', '{{facts.gastronomie.zeiten_abend}}'] },
        { label: 'Samstag und Sonntag', wert: '{{facts.gastronomie.zeiten_wochenende}}' },
        { label: 'Ruhetag', wert: '{{facts.gastronomie.ruhetag}}' },
      ],
      fussnote: 'Öffnungszeiten {{facts.gastronomie.zeiten_stand}}. **Außerhalb der Freiluftsaison gelten andere Zeiten.** Wenn kein Tennisbetrieb mehr auf der Anlage ist, ändern sich Ruhetage und Zeiten. Dann vorher kurz anrufen.',
      linkLabel: 'Tisch reservieren: {{facts.gastronomie.telefon}}',
      linkHref: 'tel:{{facts.gastronomie.telefon_waehlen}}',
    }},
    { type: 'richtext', data: {
      absaetze: [
        'Eine Tischreservierung nimmt der Clubwirt jederzeit telefonisch an, unter {{facts.gastronomie.telefon}} oder mobil unter {{facts.gastronomie.telefon_mobil}}. Für eine größere Runde nach dem Punktspiel lohnt sich ein kurzer Anruf vorab.',
        'Du findest uns am {{facts.verein.strasse}} in {{facts.verein.plz}} {{facts.verein.ort}}. [So kommst du her](/kontakt/).',
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ AKTUELLES
{
  slug: 'aktuelles', page_type: 'aktuelles',
  title: 'Aktuelles',
  description: 'Neuigkeiten, Ergebnisse und Termine aus dem Krifteler Tennis-Club.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Aus dem Verein',
      titel: 'Aktuelles',
      // Der Schriftzug 'KTC DROP SHOT' im Foto muss lesbar bleiben: er liegt bei 28 bis 53 % der Bildhoehe und
      // 52 bis 82 % der Breite. Hoher Aufmacher, Ausschnitt auf den Schriftzug (waagerecht 70, senkrecht 36).
      bildFokus: '70 36',
      sub: 'Berichte, Ergebnisse und was sonst auf der Anlage passiert.',
      zweitLabel: 'Zum Clubkalender', zweitHref: '/kalender/',
      bild: bild('club-newspaper'), bildAlt: bildAlt('club-newspaper'),
    }},
    { type: 'beitragsliste', data: {
      suche: 'an',
      leerText: 'Noch keine Beiträge. Sobald etwas passiert, steht es hier.',
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ CLUBKALENDER
{
  slug: 'kalender', page_type: 'standard',
  title: 'Clubkalender',
  description: 'Termine des Krifteler Tennis-Clubs: Spieltage der Medenrunde, Clubveranstaltungen und was sonst ansteht.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Was ansteht',
      titel: 'Clubkalender',
      sub: 'Spieltage, Veranstaltungen und Termine rund um die Anlage.',
      // Leise, kein Gelb: der Weg zum Abo, das sonst unter der ganzen Liste uebersehen wird.
      zweitLabel: 'Kalender abonnieren', zweitHref: '#abo',
      hoehe: 'niedrig', bild: bild('club-kalender'), bildAlt: bildAlt('club-kalender'),
    }},
    { type: 'termine', data: {
      // Keine Suche: eine Handvoll Termine, und die Auswahl darueber filtert schon.
      // Wer etwas Bestimmtes sucht, fragt Lisa.
      // Zugeklappt: kommend die naechsten zwei Monate offen, vergangen nur die letzten
      // zwei Wochen. Wichtig ist, was als Naechstes kommt.
      zuklappen: 'an',
      vorspann: 'Was ansteht. Über „Vergangen“ siehst du auch, was schon war.',
      leerText: 'Zurzeit steht nichts an. Sobald die Termine der neuen Saison feststehen, erscheinen sie hier.',
      // Die Termine stehen NICHT hier, sondern in inhalte/termine.json —
      // dieselbe Quelle speist die Startseite (P3).
    }},
    // Das Abo: drei Zuschnitte statt einem fuer alles (src/kalender-abo.js), die
    // Mannschaft vorn. Der Aufmacher springt mit 'Kalender abonnieren' hierher (#abo).
    { type: 'abo', data: {
      titel: 'Der Spielplan kommt zu dir',
      vorspann: 'Einmal abonnieren, und Termine, Verlegungen und Ergebnisse landen von selbst in deinem Kalender, auf dem Handy wie am Computer.',
      mannschaften: ABO_MANNSCHAFTEN,
      hinweis: 'Auf einem Android-Handy nimm „Google Kalender“. Kalender-Apps holen Änderungen in Abständen ab, Google oft nur einmal am Tag. Ein Jugend-Abo gilt für eine Saison, weil sich die Teams jedes Jahr neu zusammensetzen. Maßgeblich bleibt der Spielplan beim Verband.',
    }},
    { type: 'richtext', data: {
      titel: 'Spieltermine der Mannschaften',
      absaetze: [
        'Die vollständigen Spielpläne aller Mannschaften stehen beim Hessischen Tennisverband. Dort sind sie immer aktuell, auch wenn ein Spiel kurzfristig verlegt wird.',
        'Eine Übersicht unserer Mannschaften findest du auf der Seite [Mannschaften](/mannschaften/), die Ergebnisse des Wochenendes unter [Ergebnisse](/ergebnisse/).',
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ ERGEBNISSE
//
// Der Infodienst fuer Spieltage: alle Mannschaften, ein Wochenende, die
// Ergebnisse, sobald sie beim Verband stehen. Bewusst OEFFENTLICH und ohne
// Namen — dieselben Zahlen stehen beim HTV offen, hier nur gebuendelt. Ein
// Passwort davor haette nur Mitglieder ausgesperrt, die kein Konto auf dieser
// Seite haben.
{
  slug: 'ergebnisse', page_type: 'standard',
  title: 'Ergebnisse',
  description: 'Die Ergebnisse aller Mannschaften des Krifteler Tennis-Clubs am Spielwochenende, sobald sie beim Hessischen Tennisverband gemeldet sind.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Spieltage',
      titel: 'Ergebnisse',
      sub: 'Alle Mannschaften, ein Wochenende. Aktuell vom Hessischen Tennisverband.',
      hoehe: 'niedrig', bild: bild('sport-ergebnisse'), bildAlt: bildAlt('sport-ergebnisse'),
    }},
    { type: 'ergebnisse', data: {} },
    { type: 'richtext', data: {
      absaetze: [
        'Die Ergebnisse erscheinen hier, sobald sie beim Verband gemeldet sind. Das passiert meist vier bis sechs Stunden nach Spielbeginn und spätestens bis 13 Uhr des Folgetags. Ältere Wochenenden findest du über die Pfeile oben. Alle Spieltermine stehen im [Clubkalender](/kalender/). Die Ergebnisse auch direkt aufs Handy: der [WhatsApp-Infodienst](/whatsapp/).',
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ WHATSAPP
//
// Der WhatsApp-Infodienst: Anmeldung und Einwilligung. Nach dem Entwurf des
// Vereins, ins Du gesetzt. Zwei Angaben fehlen noch und erscheinen als […], bis sie
// in config/facts.json stehen: der Anmeldelink (links.whatsapp, ein wa.me-Link mit
// vorbereiteter Nachricht) und die Clubnummer (kanal.nummer) fuer das STOP.
//
// Der QR-Code ist eine DATEI (bilder/logos/whatsapp-qr.png). Fehlt sie, steht der
// Abschnitt ohne Bild da, und der Link funktioniert trotzdem — auf dem Handy,
// auf dem man die Seite ohnehin liest, braucht niemand einen QR-Code.
{
  slug: 'whatsapp', page_type: 'standard',
  title: 'WhatsApp-Infodienst',
  description: 'Neuigkeiten, Ergebnisse und Platzinfos des Krifteler Tennis-Clubs direkt aufs Handy: einmal anmelden, jederzeit abmelden.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Neu',
      titel: 'Nie wieder wichtige Infos verpassen.',
      sub: 'Neuigkeiten, Ergebnisse, Platzinfos und Ankündigungen. Schnell, direkt, auf dein Handy.',
      hoehe: 'niedrig', bild: bild('club-whatsapp'), bildAlt: bildAlt('club-whatsapp'),
    }},
    { type: 'richtext', data: {
      absaetze: [
        'Ab sofort schicken wir Neuigkeiten, Turnierergebnisse, Platzinfos und Vereinsankündigungen auch direkt per WhatsApp. Einmal anmelden, und du bekommst alle wichtigen Infos aufs Handy. Versprochen: kein Spam, nur das Wesentliche. Die Infos auf der Website und der E-Mail-Newsletter bleiben daneben bestehen.',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'So einfach geht’s',
      grund: 'ruhig',
      absaetze: [
        '**1.** Tippe auf den Link oder scanne den QR-Code mit dem Handy.',
        '**2.** WhatsApp öffnet sich mit einer fertigen Nachricht.',
        '**3.** Einmal auf „Senden“ tippen. Fertig.',
        '[In WhatsApp anmelden]({{facts.links.whatsapp}})',
      ],
      bild: bild('whatsapp-qr', 'mittel'), bildAlt: bildAlt('whatsapp-qr'), bildStil: 'logo',
    }},
    { type: 'richtext', data: {
      titel: 'Datenschutz und Einwilligung',
      absaetze: [
        'Mit dem Absenden der Nachricht willigst du ein (Art. 6 Abs. 1 lit. a DSGVO), dass der {{facts.verein.name}} dich über WhatsApp mit Vereinsinformationen kontaktiert. Deine Mobilnummer nutzen wir ausschließlich dafür und geben sie nicht an Dritte weiter. WhatsApp selbst verarbeitet technisch bedingt Daten, mehr dazu in der [Datenschutzerklärung](/datenschutz/).',
        '**Abmeldung jederzeit:** Schreib einfach STOP an die Clubnummer {{facts.kanal.nummer}}. Danach schicken wir dir nichts mehr.',
        'Verantwortlich: {{facts.verein.name}}, {{facts.verein.strasse}}, {{facts.verein.plz}} {{facts.verein.ort}}.',
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ KONTAKT
{
  slug: 'kontakt', page_type: 'standard',
  title: 'Kontakt und Anfahrt',
  description: 'Ansprechpartner im Vorstand des Krifteler Tennis-Clubs und wie du zur Anlage am Schmelzweg kommst.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Kontakt',
      titel: 'Kontakt und Anfahrt',
      hoehe: 'niedrig',
      sub: 'Ruf an, schreib uns oder komm einfach vorbei.',
      zweitLabel: 'Direkt anrufen', zweitHref: '#vorstand',
      bild: bild('anlage-zentrum-oben'), bildAlt: bildAlt('anlage-zentrum-oben'),
    }},
    // Alles zum Schreiben an einem Ort: links der Weg ueber FAQ und Assistent (vorher ein eigenes Band), die
    // Anschrift, das Telefon und die Adresse; rechts das Formular. Die Doppelungen (E-Mail im Aufmacher und gross neben
    // dem Formular) entfallen. Die Vorstandskarten sind das Verzeichnis fuer alle, die jemanden direkt anrufen wollen.
    { ...FORMULAR, data: { ...FORMULAR.data, aufbau: 'kompakt',
      titel: 'Schreib uns',
      vorspann: 'Vieles klärst du schneller über die [häufigen Fragen](/faq/) oder [Lisa](#frag-lisa), unsere KI-Assistentin. Bleibt etwas offen, melde dich hier, per Mail oder am Telefon.',
      kontakte: [
        { label: 'Anschrift', text: '{{facts.verein.strasse}}, {{facts.verein.plz}} {{facts.verein.ort}}', href: '{{facts.links.karte}}' },
        { label: 'Telefon', text: '{{facts.vorstand.erster.telefon}}', href: 'tel:{{facts.vorstand.erster.telefon_waehlen}}' },
        { label: 'E-Mail', text: '{{facts.verein.email}}', href: 'mailto:{{facts.verein.email}}' },
      ] } },
    { type: 'personen', data: {
      titel: 'Der Vorstand',
      anker: 'vorstand',
      grund: 'ruhig',
      vorspann: 'Jederzeit ein offenes Ohr für dich!',
      leute: [...vorstand, lisaKarte],
    }},
    // Eine Einladung statt zwei Verkehrsangaben: der Aufmacher sagt 'komm einfach vorbei',
    // die Ueberschrift nimmt es auf, die zwei Wege stehen als Anfangsworte im Text.
    { type: 'richtext', data: {
      titel: 'Komm einfach vorbei',
      // Die Karte ist ein eigenes Bild (bilder/themen/kontakt-karte.jpg, OpenStreetMap) mit Link
      // zu Google Maps im neuen Fenster: so wird beim Aufruf der Seite nichts von Google geladen.
      // Fehlt das Bild, steht der Text mit dem Link allein da.
      bild: bild('kontakt-karte', 'mittel'), bildAlt: bildAlt('kontakt-karte'), bildStil: 'karte',
      bildLink: '{{facts.links.karte}}',
      bildUnterschrift: 'Kartendaten © OpenStreetMap-Mitwirkende',
      absaetze: [
        '**Mit dem Auto:** A66, Abfahrt Frankfurt-Zeilsheim / Hofheim-Nord, Richtung Hofheim folgen. Am Ortseingang Hofheim an der zweiten Ampel, vor der Aral-Tankstelle, links in den Schmelzweg abbiegen. Die Anlage liegt unmittelbar links. Parkplätze sind am unteren Ende der Anlage, auf dem Parkplatz der Kreissporthalle.',
        '**Mit Bus und Bahn:** Mit der S-Bahn S1 bis Hofheim. Von dort weiter mit Bus 263, Bus 401 oder Bus 812 bis zur Haltestelle Kriftel Kreissporthalle. Von dort sind es rund 100 Meter den Schmelzweg aufwärts bis zum Eingang.',
        '[Route in Google Maps planen ↗]({{facts.links.karte}})',
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ FAQ
{
  slug: 'faq', page_type: 'standard',
  title: 'Häufige Fragen',
  description: 'Antworten auf die Fragen, die uns am häufigsten erreichen.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Kurz beantwortet',
      titel: 'Häufige Fragen',
      hoehe: 'niedrig', aufhellen: 'ja', bildFokus: '50', bild: bild('recht-faq'), bildAlt: bildAlt('recht-faq'),
    }},
    { type: 'faq', data: {
      fragen: [
        { frage: 'Wie werde ich Mitglied?',
          antwort: 'Schreib uns an [{{facts.verein.email}}](mailto:{{facts.verein.email}}) oder sprich uns auf der Anlage an. Zum Saisonstart im April bieten wir Schnupperkurse an. Ideal, um den Club kennenzulernen. Alle Beiträge stehen auf der Seite [Mitglied werden](/mitglied-werden/).' },
        { frage: 'Was kosten die Mitgliedsbeiträge?',
          antwort: 'Zwischen {{facts.beitraege.passiv}} € für eine passive und {{facts.beitraege.aktiv}} € für eine aktive Mitgliedschaft im Jahr, mit eigenen Beiträgen für Jugendliche und Familien. Im ersten Jahr zahlen Erwachsene nur {{facts.beitraege.neumitglied_erstes_jahr}} € (Voraussetzung: {{facts.beitraege.neumitglied_voraussetzung}}). Die vollständige Liste steht auf der Seite [Mitglied werden](/mitglied-werden/). Bei Fragen helfen wir dir gern persönlich weiter.' },
        { frage: 'Wann ist Saison und wann haben die Außenplätze geöffnet?',
          antwort: 'Die Freiluftsaison startet {{facts.anlage.saison_start}} und endet im {{facts.anlage.saison_ende}}. In den Sommermonaten stehen {{facts.anlage.plaetze}} gepflegte Sandplätze zur Verfügung. Der Trainingsbetrieb beginnt ebenfalls im April mit Tenniscamps und Schnupperkursen. Die beste Zeit zum Einsteigen. Auch im Winter gibt es Alternativen, etwa unsere beliebte Winterrunde.' },
        { frage: 'Kann ich als Nichtmitglied einen Platz buchen?',
          antwort: 'Die Plätze sind für Vereinsmitglieder reserviert. Als Gast eines Mitglieds kannst du aber mitspielen. Sprich einfach ein Mitglied an oder schnupper bei uns rein. Die Gastspielgebühr beträgt {{facts.gast.gebuehr}} € pro Gast. Mitglieder buchen ihre Plätze bequem über [eBuSy]({{facts.links.buchung}}).' },
        { frage: 'Gibt es eine Flutlichtanlage für das Abendspiel?',
          antwort: 'Ja. Die Flutlichtanlage springt bei Dämmerung automatisch an und ermöglicht Spiel bis {{facts.anlage.flutlicht_bis}}. Ohne Aufpreis; die Nutzung ist im Beitrag enthalten. Perfekt für alle, die nach Feierabend noch Tennis spielen möchten.' },
        { frage: 'Gibt es Tennistraining für Kinder und Jugendliche?',
          antwort: 'Ja. Vom Kindertennis für die Kleinsten bis zum Angebot „Tennis für Minis“, bei dem Kinder und Eltern gemeinsam auf den Platz gehen, ist für jede Altersgruppe etwas dabei. Die {{facts.anlage.tennisschule}} unter Leitung von Oliver Kaus kümmert sich mit einem erfahrenen Trainerteam um den Nachwuchs. Die Jugendmannschaften nehmen an den Punktspielen teil, und in den Ferien finden regelmäßig Tenniscamps statt. Mehr dazu unter [Sport](/sport/#jugend).' },
        { frage: 'Bietet der KTC Tenniskurse für Anfänger und Erwachsene an?',
          antwort: 'Selbstverständlich. Die {{facts.anlage.tennisschule}} bietet Kurse für alle Levels, vom Anfänger bis zum Turnierspieler. Oliver Kaus und sein Team sorgen für individuelle Betreuung. Ob Einzeltraining, Gruppenkurs oder Wiedereinsteiger-Angebot: Wir finden das Passende für dich. Beliebt ist auch das gesellige „T-Time“-Format an Sonntagen während der Sommerferien. Mehr zur Schule unter [Sport](/sport/#tennisschule).' },
        { frage: 'Ab welchem Alter können Kinder mit Tennis beginnen?',
          antwort: 'Bereits im Vorschulalter. Das Kindertennis-Programm vermittelt spielerisch die Grundlagen. Besonders beliebt ist „Tennis für Minis“, wo Eltern mit ihren Kleinsten erste Schritte auf dem Platz machen. Die {{facts.anlage.tennisschule}} passt das Training altersgerecht an. Ohne Druck, mit viel Freude.' },
        { frage: 'Kann mein Kind erst einmal ohne Mitgliedschaft trainieren?',
          antwort: 'Ja, für eine Saison. Nimmt dein Kind an einem längeren Schnupperkurs der {{facts.anlage.tennisschule}} teil, zahlt es einmalig {{facts.kindertraining.beitrag}} € Gastspielbeitrag statt eines Mitgliedsbeitrags. Die Anmeldung läuft über [eBuSy]({{facts.links.buchung}}), dort wird der Haken „{{facts.kindertraining.ebusy_haken}}“ gesetzt. Im Folgejahr ist eine Mitgliedschaft nötig. Alle Einzelheiten stehen auf [Mitglied werden](/mitglied-werden/#kinder-training).' },
        { frage: 'Welche Mannschaften spielen beim KTC in der Medenrunde?',
          antwort: 'Der KTC ist breit aufgestellt: Wir haben Jugend-, Damen- und Herrenmannschaften in verschiedenen Altersklassen und Spielklassen. Alle Teams stehen auf der Seite [Mannschaften](/mannschaften/), die Ergebnisse unter [Ergebnisse](/ergebnisse/). Die Punktspiele laufen während der Sommersaison. Du möchtest mitspielen? Sprich uns an. Wir freuen uns über Verstärkung.' },
        { frage: 'Brauche ich eigene Ausrüstung?',
          antwort: 'Für die Minis-Kurse werden Schläger gestellt, du brauchst nur Sportschuhe. Ansonsten hilft dir die {{facts.anlage.tennisschule}} gern bei der Auswahl.' },
        { frage: 'Gibt es Gastronomie?',
          antwort: 'Ja. Das Clubrestaurant {{facts.gastronomie.name}} mit sonniger Terrasse gehört zur Anlage und ist auch für Gäste ohne Schläger offen. Öffnungszeiten, Ruhetag und die Nummer für eine Tischreservierung stehen auf [Restaurant und Terrasse](/clubhaus/).' },
        { frage: 'Wie erreiche ich den Tennisclub und wo kann ich parken?',
          antwort: 'Du findest uns im {{facts.verein.strasse}}, {{facts.verein.plz}} {{facts.verein.ort}}. Kostenlose Parkplätze gibt es ausreichend auf dem angrenzenden Parkplatz der Kreissporthalle. Die Anfahrt mit Auto, Bus und Bahn steht unter [Kontakt und Anfahrt](/kontakt/).' },
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ SATZUNG UND ORDNUNGEN
//
// Die Satzung bleibt ein PDF (die beschlossene Fassung, mit Stand). Die Platzordnung steht in eBuSy und
// wird dort gepflegt; diese Seite verweist nur darauf (Migration 016: die alte Seite /platzordnung/ ist
// archiviert und leitet hierher um). Eine zweite Fassung im Netz liefe bei jeder Aenderung auseinander.
// Die Ordnung des Hessischen Tennisverbands steht NICHT hier — sie gilt dort in ihrer
// aktuellen Fassung, wie die Spielplaene.
{
  slug: 'satzung-und-ordnungen', page_type: 'standard',
  title: 'Satzung und Platzordnung',
  description: 'Satzung und Platzordnung des Krifteler Tennis-Clubs: die Regeln des Vereins zum Nachlesen.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Zum Nachlesen',
      titel: 'Satzung und Platzordnung',
      sub: 'Die Regeln des Vereins, wie der Vorstand und die Mitgliederversammlung sie beschlossen haben.',
      bild: bild('anlage-platz2'), bildAlt: bildAlt('anlage-platz2'),
    }},
    { type: 'richtext', data: {
      titel: 'Satzung',
      absaetze: [
        'Die Satzung regelt Name und Zweck des Vereins, die Mitgliedschaft, die Rechte und Pflichten der Mitglieder und die Organe des Vereins. Sie gilt in der Fassung von {{facts.dokumente.satzung_stand}}.',
        '[Satzung als PDF ansehen]({{facts.links.satzung}}) · {{facts.dokumente.satzung_seiten}} Seiten',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Platzordnung',
      grund: 'ruhig',
      absaetze: [
        'Die Platzordnung sagt, wer wann spielen darf, wie Plätze gebucht und gepflegt werden und was für Gäste und das Training gilt.',
        'Sie steht in eBuSy, dem System, über das du auch deinen Platz buchst: [Platzordnung in eBuSy]({{facts.links.buchung}}).',
      ],
    }},
    { type: 'richtext', data: {
      absaetze: [
        'Maßgeblich ist immer die vom Verein beschlossene Fassung. Fragen dazu beantwortet der [Vorstand](/kontakt/#vorstand).',
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ IMPRESSUM
//
// Angaben nach § 5 DDG (frueher TMG). Registergericht und Registernummer
// stehen in facts.json und sind dort noch LEER — die Seite zeigt sie als […],
// bis jemand sie einsetzt. Bei einem eingetragenen Verein ist das eine
// Pflichtangabe; eine sichtbare Luecke ist besser als eine geratene Nummer.
//
// Bewusst NICHT mehr drin gegenueber der alten Seite:
//  - die Privatnummer und E-Mail der 'technischen Umsetzung' (nicht
//    vorgeschrieben, und jede private Angabe ist eine zu viel)
//  - die Hamburger Link-Erklaerung von 1998 (gilt als wirkungslos; ersetzt
//    durch die uebliche Kurzfassung)
//  - der Hinweis auf die EU-Streitschlichtungsplattform (seit Juli 2025
//    abgeschaltet; fuer einen Verein ohne Verbrauchervertraege ohnehin
//    nicht noetig)
{
  slug: 'impressum', page_type: 'rechtstext',
  title: 'Impressum',
  description: 'Anbieterkennzeichnung des Krifteler Tennis-Clubs e.V.: Anschrift, Vertretung, Kontakt und Vereinsregister.',
  blocks: [
    NAV,
    { type: 'hero', data: { titel: 'Impressum',
      hoehe: 'niedrig', bild: bild('recht-impressum'), bildAlt: bildAlt('recht-impressum') } },
    { type: 'richtext', data: {
      titel: 'Angaben nach § 5 DDG',
      absaetze: [
        '**{{facts.verein.name}}**',
        '{{facts.verein.strasse}}, {{facts.verein.plz}} {{facts.verein.ort}}',
        '**Vertreten durch den Vorstand:** {{facts.vorstand.erster.name}} ({{facts.vorstand.erster.rolle}}) und {{facts.vorstand.zweite.name}} ({{facts.vorstand.zweite.rolle}})',
        '**Telefon:** {{facts.vorstand.erster.telefon}} · **E-Mail:** [{{facts.verein.email}}](mailto:{{facts.verein.email}})',
        '**Vereinsregister:** {{facts.verein.registergericht}} · **Registernummer:** {{facts.verein.registernummer}}',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Verantwortlich für den Inhalt',
      absaetze: [
        'Verantwortlich für die Inhalte dieser Website im Sinne von § 18 Abs. 2 MStV ist {{facts.vorstand.erster.name}}, {{facts.vorstand.erster.rolle}}, Anschrift wie oben.',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Haftung für Inhalte und Links',
      absaetze: [
        'Wir erstellen die Inhalte dieser Website mit Sorgfalt und halten sie aktuell. Für Vollständigkeit und Richtigkeit zu jedem Zeitpunkt können wir keine Gewähr übernehmen. Das gilt besonders für Spieltermine und Ergebnisse: maßgeblich ist immer der Spielplan des Hessischen Tennisverbands.',
        'Diese Website verweist auf Seiten anderer Anbieter. Für deren Inhalte sind ausschließlich die jeweiligen Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar. Werden uns solche bekannt, entfernen wir den Link umgehend.',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Urheberrecht',
      absaetze: [
        'Texte, Fotos und Grafiken dieser Website unterliegen dem Urheberrecht. Wer sie über die private Nutzung hinaus verwenden will, fragt bitte vorher unter [{{facts.verein.email}}](mailto:{{facts.verein.email}}) an.',
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ DATENSCHUTZ
//
// Geschrieben nach dem, was die Website TATSAECHLICH tut — geprueft im Code,
// nicht uebernommen. Der alte Text stammt aus einem WordPress-Baukasten und
// beschrieb Dinge, die es hier nicht gibt: Google Fonts, Google Maps,
// Registrierfunktion, Kommentare, Cookies fuer Besucher. Dafuer fehlte, was
// es hier GIBT: den Assistenten, der Fragen an einen KI-Dienst in den USA
// schickt, und die Speicherung von Anfragen.
//
// Die Fristen stehen in facts.json (datenschutz.*), weil der Vorstand sie
// entscheidet und der Text sie verspricht.
{
  slug: 'datenschutz', page_type: 'rechtstext',
  title: 'Datenschutz',
  description: 'Welche Daten bei der Nutzung dieser Website anfallen, wofür wir sie brauchen und welche Rechte du hast.',
  blocks: [
    NAV,
    { type: 'hero', data: { titel: 'Datenschutz',
      hoehe: 'niedrig', bild: bild('recht-datenschutz'), bildAlt: bildAlt('recht-datenschutz') } },
    { type: 'richtext', data: {
      absaetze: [
        'Der {{facts.verein.name}} nimmt den Schutz deiner Daten ernst. Diese Seite sagt dir, welche Daten bei der Nutzung dieser Website anfallen, wofür wir sie brauchen und was du tun kannst. Sie gilt für diese Website. Für Angebote anderer Anbieter, auf die wir verlinken, gelten deren eigene Erklärungen.',
        '**Die Kurzfassung:** Diese Website setzt für Besucher keine Cookies, bindet keine Werbe- oder Analysedienste ein und lädt weder Schriften noch Karten von fremden Servern. Personenbezogene Daten fallen nur an, wenn du uns schreibst oder den Assistenten benutzt. Beides ist freiwillig.',
      ],
    }},
    { type: 'richtext', data: {
      titel: '1. Wer verantwortlich ist',
      absaetze: [
        '{{facts.verein.name}}, {{facts.verein.strasse}}, {{facts.verein.plz}} {{facts.verein.ort}}. Vertreten durch den Vorstand: {{facts.vorstand.erster.name}} ({{facts.vorstand.erster.rolle}}) und {{facts.vorstand.zweite.name}} ({{facts.vorstand.zweite.rolle}}).',
        'Fragen zum Datenschutz richtest du an [{{facts.verein.email}}](mailto:{{facts.verein.email}}).',
      ],
    }},
    { type: 'richtext', data: {
      titel: '2. Was beim bloßen Besuch passiert',
      absaetze: [
        'Wenn du eine Seite aufrufst, überträgt dein Browser technisch bedingt Daten an unseren Server, darunter deine IP-Adresse, Datum und Uhrzeit und die angeforderte Seite. Das ist nötig, damit die Seite bei dir ankommt und der Server sicher läuft (Art. 6 Abs. 1 lit. f DSGVO). Die Anwendung selbst schreibt deine IP-Adresse nicht in ihre Datenbank. Technische Protokolle des Hosting-Anbieters sind unter 3. beschrieben.',
        'Wir zählen Seitenaufrufe, ohne Personen zu zählen: gespeichert werden nur der Pfad der Seite, der Tag und die Anzahl. Keine IP-Adresse, keine Kennung, kein Cookie. Daraus lässt sich niemand wiedererkennen.',
        'Für Besucher gibt es keine Cookies. Ein technisch notwendiges Cookie setzt allein die Anmeldung im Redaktionsbereich, den nur Vereinsmitglieder mit Zugang nutzen.',
        'Schriften, Bilder und Skripte kommen von unserem eigenen Server. Wir binden keine Karten, Videos, Schriften oder Dienste fremder Anbieter ein.',
      ],
    }},
    { type: 'richtext', data: {
      titel: '3. Hosting',
      absaetze: [
        'Die Website läuft auf einem Server von {{facts.hosting.anbieter}}, {{facts.hosting.sitz}}. Der Anbieter verarbeitet in unserem Auftrag technische Daten wie die IP-Adresse der Besucher. Mit ihm besteht ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO. Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und zuverlässigen Betrieb (Art. 6 Abs. 1 lit. f DSGVO).',
      ],
    }},
    { type: 'richtext', data: {
      titel: '4. Wenn du uns schreibst',
      absaetze: [
        'Über das Formular auf den Seiten „Kontakt“ und „Mitglied werden“ kannst du uns Fragen stellen, ebenso per E-Mail oder Telefon. Wir speichern deinen Namen, deine E-Mail-Adresse und deine Nachricht, um sie zu beantworten (Art. 6 Abs. 1 lit. b und f DSGVO). Alle Angaben sind freiwillig.',
        'Die Anfragen liegen in der Datenbank des Servers und sind nur für Personen mit Zugang zum Redaktionsbereich sichtbar. Wir geben sie nicht weiter. Wir löschen sie {{facts.datenschutz.frist_anfragen}} nach Eingang, auf Wunsch früher.',
      ],
    }},
    { type: 'richtext', data: {
      titel: '5. Lisa, die KI-Assistentin',
      absaetze: [
        'Auf jeder Seite kannst du Lisa, unserer KI-Assistentin, Fragen zum Verein stellen. Lisa ist keine Person, sondern ein Computerprogramm. Sie antwortet ausschließlich aus den Inhalten dieser Website. Wenn du eine Frage abschickst, geht sie zusammen mit den letzten Nachrichten des Gesprächs und den passenden Textstellen dieser Website an einen KI-Dienst des Anbieters Anthropic, der die Antwort erzeugt. Anthropic sitzt in den USA. Die Übermittlung stützt sich auf Standardvertragsklauseln (Art. 46 DSGVO). Mehr dazu in den [Datenschutzhinweisen von Anthropic](https://www.anthropic.com/legal/privacy).',
        'Lisa und ihr Bild sind mit künstlicher Intelligenz erzeugt. Das Bild zeigt keine reale Person.',
        '**Bitte gib im Chat keine persönlichen Daten ein**, weder deine eigenen noch die anderer. Lisa braucht sie nicht.',
        'Wir speichern die Frage, die Antwort und die Seiten, aus denen geantwortet wurde, mit dem Zeitpunkt, ohne IP-Adresse und ohne Kennung. So sehen wir, was Besucher wissen wollen und auf der Website nicht finden. Die Einträge werden nach {{facts.datenschutz.frist_chat}} gelöscht. Damit niemand den Dienst überlastet, merkt sich der Server deine IP-Adresse für wenige Minuten im Arbeitsspeicher. Sie wird nicht in der Datenbank gespeichert und ist spätestens beim nächsten Neustart des Servers weg.',
        'Rechtsgrundlage ist unser berechtigtes Interesse an einer einfachen Auskunft für Besucher (Art. 6 Abs. 1 lit. f DSGVO). Die Nutzung ist freiwillig. Die Website funktioniert ohne Lisa vollständig.',
      ],
    }},
    { type: 'richtext', data: {
      titel: '6. Mitgliedschaft und Platzbuchung',
      absaetze: [
        'Anmeldung, Mitgliederverwaltung und Platzbuchung laufen nicht über diese Website, sondern über das Buchungs- und Verwaltungssystem eBuSy. Wenn du den Link anklickst, verlässt du unsere Seite, er öffnet in einem neuen Fenster. Dort gelten die Datenschutzhinweise des Betreibers. Der Verein nutzt eBuSy aufgrund eines Vertrags mit dem Betreiber über die Software und ihre Module für Platzbelegung und Mitgliederverwaltung. Mit dem Betreiber besteht ein Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO).',
        'Diese Website ist von der Mitgliederverwaltung entkoppelt und speichert keine Mitgliedsdaten. Die Daten unserer Mitglieder verarbeitet der Verein in eBuSy zur Durchführung der Mitgliedschaft (Art. 6 Abs. 1 lit. b DSGVO). Auskunft, Berichtigung und Löschung dieser Daten erfolgen dort, über den Verein: schreib dazu an [{{facts.verein.email}}](mailto:{{facts.verein.email}}). Wir verlinken außerdem auf Seiten des Hessischen Tennisverbands und weiterer Anbieter. Beim Anklicken überträgt dein Browser Daten an den jeweiligen Anbieter. Darauf haben wir keinen Einfluss.',
      ],
    }},
    { type: 'richtext', data: {
      titel: '7. WhatsApp-Infodienst',
      absaetze: [
        'Wer möchte, kann sich für unseren WhatsApp-Infodienst anmelden: eine Nachricht an unsere Clubnummer genügt. Dabei verarbeiten wir deine Mobilnummer und, falls dein WhatsApp-Profil sie zeigt, deinen Namen. Wir nutzen sie ausschließlich, um dir Vereinsinformationen zu schicken.',
        'Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die du mit dem Absenden der Anmeldenachricht erteilst. Du kannst sie jederzeit widerrufen: Schreib STOP an die Clubnummer, dann schicken wir dir nichts mehr. Die Anmeldung ist freiwillig und für keine Leistung des Vereins nötig.',
        'WhatsApp wird von Meta Platforms Ireland Limited betrieben. Die Verarbeitung durch WhatsApp, auch außerhalb der Europäischen Union, richtet sich nach deren Datenschutzhinweisen. Auf diese Verarbeitung haben wir keinen Einfluss.',
      ],
    }},
    { type: 'richtext', data: {
      titel: '8. Daten und Fotos von Mitgliedern',
      absaetze: [
        'Im Zusammenhang mit dem Sportbetrieb und Veranstaltungen kann der Verein Namen, Vereins- und Abteilungszugehörigkeit, Funktion im Verein und Fotos von Mitgliedern veröffentlichen: auf dieser Website, in der Vereinszeitung und gegenüber Medien. Das betrifft etwa Mannschaftsaufstellungen, Ergebnisse, Sieger, Ehrungen oder Wahlergebnisse. Wo es aus sportlichen Gründen nötig ist, etwa bei der Einteilung in Wettkampfklassen, kann auch das Alter oder der Jahrgang genannt werden. Die automatisch erstellten Ergebnisübersichten dieser Website nennen nur Mannschaften, keine einzelnen Spielerinnen und Spieler.',
        'Wir achten darauf, dass erkennbar abgebildete Personen einverstanden sind, bei Kindern die Eltern. Rechtsgrundlage ist unser berechtigtes Interesse an der Öffentlichkeitsarbeit (Art. 6 Abs. 1 lit. f DSGVO) oder, wo wir dich um Erlaubnis bitten, deine Einwilligung (lit. a).',
        '**Du kannst der Veröffentlichung deiner Daten und Fotos jederzeit widersprechen**, formlos beim Vorstand. Wir entfernen sie dann von dieser Website und verzichten auf künftige Veröffentlichungen. Über Ehrungen und Geburtstage berichten wir nur, wenn du nicht widersprochen hast. Wir informieren dich vorher rechtzeitig.',
      ],
    }},
    { type: 'richtext', data: {
      titel: '9. Weitergabe an Dritte',
      absaetze: [
        'Wir verkaufen keine Daten. Als Mitglied des Hessischen Tennisverbands (HTV) ist der Verein verpflichtet, bestimmte Mitglieder- und Mannschaftsdaten dorthin zu melden. Mitgliederlisten erhalten nur Vorstandsmitglieder und Funktionäre, soweit ihre Aufgabe es erfordert. Darüber hinaus geben wir Daten nur weiter, wenn ein Gesetz es verlangt oder du eingewilligt hast.',
      ],
    }},
    { type: 'richtext', data: {
      titel: '10. Wie lange wir Daten aufbewahren',
      absaetze: [
        'Anfragen über das Formular löschen wir {{facts.datenschutz.frist_anfragen}} nach Eingang, Einträge des Assistenten nach {{facts.datenschutz.frist_chat}}. Die Mobilnummern des WhatsApp-Infodienstes behalten wir bis zur Abmeldung. Mitgliedsdaten liegen nicht auf dieser Website, sondern in eBuSy und werden dort nach den Regeln der Mitgliederverwaltung gelöscht. Unterlagen der Vereinsbuchhaltung bewahren wir so lange auf, wie das Gesetz es verlangt, bis zu zehn Jahre (§ 147 AO).',
      ],
    }},
    { type: 'richtext', data: {
      titel: '11. Deine Rechte',
      absaetze: [
        'Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Du kannst Verarbeitungen widersprechen, die auf unserem berechtigten Interesse beruhen (Art. 21). Eine erteilte Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3). Schreib dazu an [{{facts.verein.email}}](mailto:{{facts.verein.email}}).',
        'Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO). Für uns zuständig ist der [Hessische Beauftragte für Datenschutz und Informationsfreiheit](https://datenschutz.hessen.de) in Wiesbaden.',
      ],
    }},
    { type: 'richtext', data: {
      titel: '12. Änderungen',
      absaetze: [
        'Wir passen diese Erklärung an, wenn sich die Website oder die Rechtslage ändern. Stand: {{facts.datenschutz.stand}}.',
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

];
