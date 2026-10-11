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
const AUFMACHER_BILDER = [
  'anlage-zentrum-oben', 'anlage-platz67oben', 'anlage-clubhaus-unten',
  'anlage-tennisplatz', 'anlage-platz2', 'anlage-zentrum-unten',
  'anlage-platz67unten',
].map((n) => ({ src: bild(n), alt: bildAlt(n) })).filter((b) => b.src);

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
const saisonVerzeichnis = 'inhalte/mannschaften';
const saisonDatei = existsSync(saisonVerzeichnis)
  ? readdirSync(saisonVerzeichnis).filter((f) => f.endsWith('.json')).sort().pop()
  : null;
export const saison = saisonDatei
  ? JSON.parse(readFileSync(`${saisonVerzeichnis}/${saisonDatei}`, 'utf8'))
  : { saison: '', wettbewerbe: {}, erwachsene: [], jugend: [] };

/** Eine Mannschaft als Tabellenzeile, mit Link auf ihre HTV-Gruppe. */
const mannschaftsZeile = (m) => [
  m.name, m.sg, m.staerke,
  { text: m.klasse, href: htv(m.gruppe, saison.wettbewerbe[m.wettbewerb || 'standard']) },
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
  marke: 'krifteler tennisclub',
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
const ASSISTENT = { type: 'assistent', data: {
  name: 'Frag den KTC',
  begruessung: 'Ich kenne alles, was auf dieser Website steht — Beiträge, Termine, '
    + 'Mannschaften, Anfahrt. Womit kann ich dir helfen?',
  vorschlaege: [
    'Was kostet eine Mitgliedschaft?',
    'Wie werde ich Mitglied?',
    'Kann ich als Gast mitspielen?',
    'Wann startet die Saison?',
  ],
}};

const FOOTER = { type: 'footer', data: {
  zeile: '{{facts.verein.name}} · {{facts.verein.strasse}}, {{facts.verein.plz}} {{facts.verein.ort}}',
  // 'Clubhaus' steht hier und nicht in der Kopfzeile: das Restaurant ist
  // kein Vereinsthema und soll die sechs Menuepunkte nicht auf sieben
  // bringen. Aber es ist die Seite mit den Oeffnungszeiten — wer sie auf
  // dem Telefon einmal verlassen hat, findet sie sonst nicht wieder.
  baum: [
    { label: 'Clubhaus',    href: '/clubhaus/' },
    { label: 'FAQ',         href: '/faq/' },
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
  vorspann: 'Frage zur Mitgliedschaft, Schnuppertraining oder etwas anderes — wir melden uns.',
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

export const seiten = [

// ══════════════════════════════════════════════════════════ STARTSEITE
{
  slug: 'start', page_type: 'home',
  title: 'Lust auf Tennis?',
  description: 'Krifteler Tennisclub: sieben Sandplätze, über 500 Mitglieder, Tennis in familiärer Atmosphäre im Main-Taunus-Kreis.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      // Keine Pille, kein Untertitel. Zwei Zeilen neben dem Logo: der
      // Vereinsname fuehrt, die Frage antwortet leiser darunter.
      wortmarke: 'Krifteler Tennisclub',
      titel: 'Lust auf Tennis',
      ctaLabel: 'Mitglied werden', ctaHref: '/mitglied-werden/',
      zweitLabel: 'Erst mal vorbeikommen', zweitHref: '/kontakt/',
      bild: bild('anlage-wiese'), bildAlt: bildAlt('anlage-wiese'),
      // Der Ort, in acht Ansichten. Alle aus bilder/anlage/ — dem Ordner fuer
      // Aufnahmen ohne erkennbare Personen, der genau dafuer da ist.
      bilder: AUFMACHER_BILDER,
      marke: 'ja', aufbau: 'zeile',
    }},
    { type: 'richtext', data: {
      titel: 'Bei uns findest du deinen Platz',
      absaetze: [
        'Tennis in familiärer Atmosphäre, auf einer der schönsten Anlagen im Main-Taunus-Kreis. {{facts.anlage.plaetze}} gepflegte {{facts.anlage.belag}}plätze, ein gemütliches Clubhaus und eine sonnige Terrasse mit [guter Gastronomie](/clubhaus/) — hier bleibst du nach dem Spiel gern noch sitzen. Wir sind {{facts.anlage.mitglieder}} Mitglieder, darunter {{facts.anlage.jugendliche}} Kinder und Jugendliche.',
        'Ob du anfängst, nach Jahren wieder einsteigst oder ambitioniert in der Mannschaft spielst — bei uns findest du das passende Angebot. Im Jugend- und Erwachsenenbereich spielen wir Wettkämpfe bis zur Landesebene. Im Freizeitbereich gibt es übers Jahr Turniere und Veranstaltungen.',
        'Trainieren kannst du bei der **{{facts.anlage.tennisschule}}** — Einzel- und Gruppenstunden für alle Mitglieder, vom ersten Schläger bis zum Mannschaftstraining. Wir vertrauen ihr seit {{facts.anlage.tennisschule_seit}}, mit eingespieltem Trainerteam und klarem Lernkonzept.',
        'Interessiert an einer Mitgliedschaft oder einem Schnuppertraining? Beiträge, Anträge und alles zum Herunterladen stehen auf [Mitglied werden](/mitglied-werden/). Oder komm einfach am {{facts.verein.strasse}} in {{facts.verein.ort}} vorbei — [so findest du uns](/kontakt/).',
      ],
      // Eigenes Feld statt fetter Absatz: ein Claim klingt aus, er ruft nicht.
      schluss: 'Dein Krifteler Tennisclub — sportlich, herzlich, familiär.',
    }},
    { type: 'infokarten', data: {
      // 'anschluss': die Eckdaten gehoeren zum Textabschnitt darueber — kein
      // eigener Grund, keine Trennlinie dazwischen. Die ruhige Flaeche setzt
      // erst bei 'Sportliche Vielfalt' ein.
      grund: 'anschluss',
      karten: [
        { label: 'Plätze', wert: '{{facts.anlage.plaetze}}',
          zusatz: 'gepflegt, bespielbar von {{facts.anlage.saison}}' },
        { label: 'Mitglieder', wert: '{{facts.anlage.mitglieder}}',
          zusatz: 'davon {{facts.anlage.jugendliche}} Kinder und Jugendliche' },
        { label: 'Mannschaften', wert: '{{facts.anlage.mannschaften}}',
          zusatz: 'Junioren bis Senioren 60, plus Hobbyrunde' },
      ],
    }},
    // Direkt nach den Eckdaten: die Vorstellung ist fertig, jetzt kommt der
    // Verein, der LEBT. Fuer das Mitglied, das jede Woche kommt, ist das der
    // Grund der Seite — er soll ihn nach einer Bildschirmhoehe finden und
    // nicht hinter Angebot und Gastronomie. Fuer den Interessenten ist ein
    // voller Kalender ein Argument. Bewusst ohne Knopf: der eine gelbe
    // gehoert 'Mitglied werden'.
    { type: 'aktuell', data: {
      beitraegeHref: '/aktuelles/',
      termineHref: '/kalender/',
    }},
    { type: 'cards', data: {
      // VIER Karten, nicht fuenf. Der Container misst 1120 px, abzueglich
      // 2 x 24 px Polster bleiben 1072. Das Gitter ist minmax(250px, 1fr)
      // bei 24 px Luecke: 4 x 250 + 3 x 24 = 1072 — passt auf den Pixel.
      // Eine fuenfte Karte braeche in eine zweite Reihe und saesse dort
      // allein ueber die volle Breite. Wer hier etwas ergaenzt, nimmt
      // etwas anderes heraus.
      //
      // Die Gastronomie steht bewusst NICHT hier: diese Reihe beantwortet
      // 'warum Mitglied werden', und das Restaurant ist oeffentlich. Sie
      // bekommt den Streifen darunter, der auch die Oeffnungszeiten traegt.
      titel: 'Was dich bei uns erwartet',
      grund: 'ruhig',
      karten: [
        // KEINE Mannschaftszahl in diesem Text. Sie stand hier frueher als
        // getipptes 'Über 20' — neben der Kachel darueber, die denselben
        // Wert aus facts.json zieht. Beim naechsten Saisonstand haette die
        // Kachel sich bewegt und die Karte weiter das Alte behauptet (P2).
        { titel: 'Team und Wettkampf', text: 'Von der Kreisliga bis zur Landesebene, in allen Altersklassen. Wir spielen um jeden Punkt — und für die Geselligkeit.', linkLabel: 'Zu den Mannschaften', linkHref: '/mannschaften/',
          bild: bild('sport-wettkampf1', 'mittel'), bildAlt: bildAlt('sport-wettkampf1') },
        { titel: 'Hobby und Freizeit', text: 'Die Hobbyrunde ohne Anmeldung, Doppelturniere und Freundschaftsspiele gegen andere Vereine.', linkLabel: 'Zur Hobbyrunde', linkHref: '/sport/',
          bild: bild('anlage-wiese', 'mittel'), bildAlt: bildAlt('anlage-wiese') },
        // Jugend und Tennisschule stehen nebeneinander, also muss der
        // Schnitt sauber sein: Jugend ist, WAS der Verein fuer Kinder tut,
        // die Tennisschule ist, WER unterrichtet — und zwar alle Mitglieder,
        // nicht nur die Jugend. Vorher sagten beide 'Lernkonzept'.
        { titel: 'Jugend', text: 'Mannschaften, Tenniscamps und die Minis. Fördern und fordern, mit Spaß und ohne Druck.', linkLabel: 'Zur Jugendarbeit', linkHref: '/sport/',
          bild: bild('sport-jugend', 'mittel'), bildAlt: bildAlt('sport-jugend') },
        { titel: 'Tennisschule', text: 'Die {{facts.anlage.tennisschule}} unterrichtet seit {{facts.anlage.tennisschule_seit}} bei uns — Einzel- und Gruppenstunden für alle Mitglieder.', linkLabel: 'Zur Tennisschule', linkHref: '/sport/',
          bild: bild('club-tennisnetz', 'mittel'), bildAlt: bildAlt('club-tennisnetz') },
      ],
    }},
    { type: 'streifen', data: {
      // Der Clubwirt hat keine eigene Website — geprueft. Stuenden die
      // Zeiten nicht hier, koennte weder die Seite noch der Assistent die
      // haeufigste Frage ueberhaupt beantworten: 'Haben die heute offen?'
      titel: 'Clubhaus und Terrasse',
      text: 'Nach dem Match sitzen bleiben. Das Clubrestaurant **{{facts.gastronomie.name}}** kocht {{facts.gastronomie.kueche}} auf der wohl schönsten Sonnenterrasse Kriftels — für Mitglieder, Gäste und alle, die gar nicht spielen.',
      bild: bild('club-restaurant', 'mittel'), bildAlt: bildAlt('club-restaurant'),
      zeilen: [
        // Zwei Werte, zwei Zeilen. Als ein Text mit Mitteltrenner brach der
        // Umbruch dort, wo er gerade passte — 'Uhr' stand allein unten.
        { label: '{{facts.gastronomie.zeiten_werktage}}',
          wert: ['{{facts.gastronomie.zeiten_mittag}}', '{{facts.gastronomie.zeiten_abend}}'] },
        { label: 'Samstag und Sonntag', wert: '{{facts.gastronomie.zeiten_wochenende}}' },
        { label: 'Ruhetag', wert: '{{facts.gastronomie.ruhetag}}' },
        { label: 'Tisch reservieren', wert: '{{facts.gastronomie.telefon}}' },
      ],
      fussnote: 'Stand {{facts.gastronomie.zeiten_stand}}. Außerhalb der Freiluftsaison gelten andere Zeiten — dann am besten kurz anrufen.',
      linkLabel: 'Mehr zum Clubhaus', linkHref: '/clubhaus/',
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ SPORT
{
  slug: 'sport', page_type: 'sport',
  title: 'Sport',
  description: 'Wettkampf, Hobbyrunde, Jugend und Tennisschule beim Krifteler Tennisclub — alles auf einer Seite.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Spielen beim KTC',
      titel: 'Tennis in jedem Alter und auf jedem Niveau',
      sub: 'Vom ersten Schläger bis zum Punktspiel. Such dir aus, was zu dir passt — wechseln kannst du jederzeit.',
      ctaLabel: 'Mitglied werden', ctaHref: '/mitglied-werden/',
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
        { titel: 'Hobby und Freizeit', text: 'Die Hobbyrunde ohne Anmeldung — einfach vorbeikommen und mitspielen.',
          linkLabel: 'Weiterlesen', linkHref: '/sport/#hobby',
          bild: bild('anlage-wiese', 'mittel'), bildAlt: bildAlt('anlage-wiese') },
        { titel: 'Jugend', text: 'Fördern und fordern — von den Minis ab fünf bis zur U18.',
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
        'Der KTC stellt {{facts.anlage.mannschaften}} Wettspiel-Mannschaften in unterschiedlichen Alters- und Leistungsklassen. Das Spektrum reicht von Kindern ab 12 Jahren bis zu den Senioren 60. Unsere Mannschaften spielen um jeden Punkt, aber auch für die Geselligkeit.',
        'Welche Teams antreten, in welcher Spielklasse und wo der Spielplan steht: [alle Mannschaften im Überblick](/mannschaften/).',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Hobby und Freizeit',
      anker: 'hobby',
      absaetze: [
        'Die Hobbyrunde ist die einfachste Art, beim KTC anzukommen. Du findest spielerisch Anschluss und lernst Leute kennen, die zu deinem Niveau passen. Geselligkeit, Spielpraxis und Spaß stehen im Mittelpunkt, eine professionelle Anleitung ist dabei.',
        '**Eine vorherige Anmeldung ist nicht nötig — einfach vorbeikommen und mitspielen.** Ansprechpartner vor Ort ist {{facts.vorstand.sport.name}}.',
        'Die Hobbyrunde organisiert außerdem Freundschaftsspiele gegen Teams anderer Vereine, unter turnierähnlichen Bedingungen und auf wechselnden Anlagen. Das richtet sich an alle, die erste Wettspiel-Erfahrung sammeln wollen, an Mitglieder ohne festen Mannschaftsplatz und an Mannschaftsspieler mit Leistungsklasse 22 bis 25.',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Jugend',
      anker: 'jugend',
      absaetze: [
        'Im KTC hat die Förderung von Kindern und Jugendlichen einen besonderen Stellenwert. Die Nachwuchsarbeit ist das Herz des Vereins — sie sorgt für frischen Wind und Gemeinschaft auf und neben dem Platz.',
        'Unser Ziel: Kindern und Jugendlichen die besten Bedingungen bieten, um Tennis mit Spaß zu lernen, sich sportlich weiterzuentwickeln und über sich hinauszuwachsen. Dabei zählt nicht nur das Training, sondern auch Teamgeist, Fairness und das gemeinsame Erlebnis im Club.',
        'Wir führen unsere jungen Talente Schritt für Schritt an das Turniertennis heran und ebnen ihnen den Weg in die Erwachsenenmannschaften.',
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
      absaetze: [
        'Seit {{facts.anlage.tennisschule_seit}} vertraut der KTC auf die Kompetenz der {{facts.anlage.tennisschule}}. Geleitet von den staatlich geprüften Tennislehrern Bertrand und Oliver Kaus, steht sie für Qualität, Engagement und messbaren Trainingserfolg.',
        'Mit einem motivierten Trainerteam und modernen Lehrmethoden begleitet sie Kinder, Jugendliche und Erwachsene — vom Einsteiger bis zum Turnierspieler. Sie gehört zu den vom Deutschen Tennis Bund und vom Verband Deutscher Tennislehrer anerkannten Top-50-Tennisschulen.',
        'Kosten für individuelles Training, Tennis-Camps und Kurse sind nicht im Clubbeitrag enthalten. Eines ihrer Angebote ist der Kurs **Tennis für Minis** für die Jüngsten.',
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
        'Die Gruppen sind klein: bis zu {{facts.minis.gruppengroesse_kinder}} Kinder, parallel {{facts.minis.gruppengroesse_erwachsene}} Erwachsene. **Bitte ruf vor der Anmeldung kurz an**, damit wir die passende Altersgruppe finden — {{facts.minis.kontakt_name}}, {{facts.minis.kontakt_telefon}}.',
      ],
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
  description: 'Alle Wettspiel-Mannschaften des Krifteler Tennisclubs mit Spielgemeinschaft, Teamstärke und Spielklasse.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Medenrunde',
      titel: 'Unsere Mannschaften',
      sub: 'Alle Wettspiel-Teams der Erwachsenen und der Jugend — von der Kreis- bis zur Landesebene.',
      bild: bild('anlage-tennisplatz'), bildAlt: bildAlt('anlage-tennisplatz'),
    }},
    { type: 'tabelle', data: {
      titel: 'Mannschaften der Erwachsenen',
      kopf: ['Mannschaft', 'Spielgemeinschaft', 'Stärke', 'Spielklasse'],
      zeilen: saison.erwachsene.map(mannschaftsZeile),
      hinweis: 'Ein Klick auf die Spielklasse führt zur Gruppe beim Hessischen Tennisverband — dort stehen Spielplan, Tabelle und Ergebnisse.',
    }},
    { type: 'tabelle', data: {
      titel: 'Mannschaften der Jugend',
      kopf: ['Mannschaft', 'Spielgemeinschaft', 'Stärke', 'Spielklasse'],
      zeilen: saison.jugend.map(mannschaftsZeile),
      hinweis: 'Mehrere Jugendteams treten als Spielgemeinschaft mit Diedenbergen und Kelkheim an — so bekommt jede Altersklasse genug Spielerinnen und Spieler zusammen.',
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
  description: 'Beiträge, Bedingungen und Anmeldung beim Krifteler Tennisclub. Keine Aufnahmegebühr, keine Arbeitsstunden.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Dabei sein',
      titel: 'Mitglied werden',
      sub: 'Keine Aufnahmegebühr, keine Arbeitsstunden. Im ersten Jahr zahlst du als Erwachsene oder Erwachsener nur {{facts.beitraege.neumitglied_erstes_jahr}} €.',
      ctaLabel: 'Jetzt anmelden', ctaHref: '{{facts.links.buchung}}',
      zweitLabel: 'Erst mal fragen', zweitHref: '/kontakt/',
      bild: bild('anlage-zentrum-unten'), bildAlt: bildAlt('anlage-zentrum-unten'),
    }},
    { type: 'preise', data: {
      titel: 'Unsere Mitgliedsbeiträge',
      // Kein Spaltenkopf: 'Mitgliedschaft' und 'pro Jahr' stehen ueber einer
      // Liste, die sich selbst erklaert. Der Zeitraum steht im Hinweis.
      zeilen: [
        { label: 'Neumitglied Erwachsene, erstes Jahr', wert: '{{facts.beitraege.neumitglied_erstes_jahr}} EUR', hervor: true },
        { label: 'Aktives Mitglied (1. Mitglied)', wert: '{{facts.beitraege.aktiv}} EUR' },
        { label: 'Aktives Mitglied (2. Mitglied als Ehe- oder Lebenspartner)', wert: '{{facts.beitraege.aktiv_partner}} EUR' },
        { label: 'Aktives Mitglied in Ausbildung', fussnote: 1, wert: '{{facts.beitraege.aktiv_ausbildung}} EUR' },
        { label: 'Jugendmitglied (bis vollendetem 18. Lebensjahr)', wert: '{{facts.beitraege.jugend}} EUR' },
        { label: 'Jugendmitglied als Familienmitglied', fussnote: 2, wert: '{{facts.beitraege.jugend_familie}} EUR' },
        { label: 'Passives Mitglied', wert: '{{facts.beitraege.passiv}} EUR' },
      ],
      // Die beiden Erlaeuterungen standen vorher als Absaetze unter der
      // Tabelle. Als Fussnote sitzen sie an der Zeile, zu der sie gehoeren.
      fussnoten: [
        'Gegen Nachweis eines Schüler-, Studenten- oder Ausbildungsausweises, bis zum vollendeten 27. Lebensjahr. Stichtag für alle Altersgrenzen ist der 31. Dezember des jeweiligen Jahres.',
        'Setzt voraus, dass mindestens ein Elternteil aktives Mitglied ist.',
      ],
      hinweis: 'Alle Beiträge gelten für das Kalenderjahr. Wer ab dem {{facts.beitraege.halber_beitrag_ab}} einsteigt, zahlt für das laufende Jahr die Hälfte. Die Kündigungsfrist endet am {{facts.beitraege.kuendigungsfrist}}.',
    }},
    { type: 'richtext', data: {
      absaetze: [
        'Die Anmeldung läuft über die [eBuSy-Mitgliederverwaltung]({{facts.links.buchung}}). Dort buchst du später auch deine Plätze.',
      ],
    }},
    { type: 'infokarten', data: {
      titel: 'Gastspiel und Spind',
      karten: [
        { label: 'Gastspielgebühr', wert: '{{facts.gast.gebuehr}} €', zusatz: 'pro Gast, höchstens {{facts.gast.max_doppel}} im Doppel' },
        { label: 'Spieldauer',      wert: '{{facts.gast.dauer_einzel}}', zusatz: 'im Einzel · {{facts.gast.dauer_doppel}} im Doppel' },
        { label: 'Spind',           wert: '{{facts.spind.gebuehr}} €', zusatz: 'pro Jahr, Anfrage an {{facts.verein.email}}' },
      ],
    }},
    { type: 'richtext', data: {
      absaetze: [
        'Gäste sind willkommen, egal ob jung oder alt. Ein Gastspiel ist nur zusammen mit einem Vereinsmitglied möglich, nicht aber zeitgleich zu Turnieren oder Punktspielen. Buchung und Abrechnung laufen über das Vereinsmitglied.',
      ],
    }},
    { ...FORMULAR, data: { ...FORMULAR.data,
      titel: 'Noch eine Frage offen?',
      vorspann: 'Schreib uns, bevor du dich anmeldest — wir antworten meist am selben Tag.' } },
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
  title: 'Clubhaus und Terrasse',
  description: 'Das Clubrestaurant des Krifteler Tennisclubs mit Sonnenterrasse: Küche, Öffnungszeiten und Tischreservierung.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      titel: 'Clubhaus und Terrasse',
      sub: 'Essen, trinken und sitzen bleiben — auf der wohl schönsten Sonnenterrasse Kriftels. Auch ohne Schläger.',
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
      text: '**{{facts.gastronomie.name}}** bringt {{facts.anlage.belag}}platz und Currygeruch zusammen: Clubwirt {{facts.gastronomie.wirt}} kocht {{facts.gastronomie.kueche}} nach Originalrezepten — mit frischen Zutaten, hausgemachten Soßen und einer großen Auswahl an vegetarischen und veganen Gerichten. Beliebt sind die fettarmen Tandoori-Gerichte aus dem traditionellen Ofen.',
      bild: bild('club-restaurant', 'mittel'), bildAlt: bildAlt('club-restaurant'),
      zeilen: [
        // Zwei Werte, zwei Zeilen. Als ein Text mit Mitteltrenner brach der
        // Umbruch dort, wo er gerade passte — 'Uhr' stand allein unten.
        { label: '{{facts.gastronomie.zeiten_werktage}}',
          wert: ['{{facts.gastronomie.zeiten_mittag}}', '{{facts.gastronomie.zeiten_abend}}'] },
        { label: 'Samstag und Sonntag', wert: '{{facts.gastronomie.zeiten_wochenende}}' },
        { label: 'Ruhetag', wert: '{{facts.gastronomie.ruhetag}}' },
      ],
      fussnote: 'Öffnungszeiten {{facts.gastronomie.zeiten_stand}}. **Außerhalb der Freiluftsaison gelten andere Zeiten** — wenn kein Tennisbetrieb mehr auf der Anlage ist, ändern sich Ruhetage und Zeiten. Dann vorher kurz anrufen.',
      linkLabel: 'Tisch reservieren: {{facts.gastronomie.telefon}}',
      linkHref: 'tel:{{facts.gastronomie.telefon_waehlen}}',
    }},
    { type: 'richtext', data: {
      absaetze: [
        'Eine Tischreservierung nimmt der Clubwirt jederzeit telefonisch an — unter {{facts.gastronomie.telefon}} oder mobil unter {{facts.gastronomie.telefon_mobil}}. Für eine größere Runde nach dem Punktspiel lohnt sich ein kurzer Anruf vorab.',
        'Du findest uns am {{facts.verein.strasse}} in {{facts.verein.plz}} {{facts.verein.ort}} — [so kommst du her](/kontakt/).',
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
  description: 'Neuigkeiten, Ergebnisse und Termine aus dem Krifteler Tennisclub.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Aus dem Verein',
      titel: 'Aktuelles',
      sub: 'Ergebnisse, Termine und was sonst auf der Anlage passiert.',
      bild: bild('club-newspaper'), bildAlt: bildAlt('club-newspaper'),
    }},
    { type: 'beitragsliste', data: {
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
  description: 'Termine des Krifteler Tennisclubs: Spieltage der Medenrunde, Clubveranstaltungen und was sonst ansteht.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Was ansteht',
      titel: 'Clubkalender',
      sub: 'Spieltage, Veranstaltungen und Termine rund um die Anlage.',
      bild: bild('club-kalender'), bildAlt: bildAlt('club-kalender'),
    }},
    { type: 'termine', data: {
      vorspann: 'Abgelaufene Termine verschwinden von selbst — was hier steht, kommt noch.',
      leerText: 'Zurzeit steht nichts an. Sobald die Termine der neuen Saison feststehen, erscheinen sie hier.',
      // Die Termine stehen NICHT hier, sondern in inhalte/termine.json —
      // dieselbe Quelle speist die Startseite (P3).
    }},
    { type: 'richtext', data: {
      titel: 'Spieltermine der Mannschaften',
      absaetze: [
        'Die vollständigen Spielpläne aller Mannschaften stehen beim Hessischen Tennisverband. Dort sind sie immer aktuell — auch wenn ein Spiel kurzfristig verlegt wird.',
        'Eine Übersicht unserer Mannschaften findest du auf der Seite [Mannschaften](/mannschaften/).',
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
  description: 'Ansprechpartner im Vorstand des Krifteler Tennisclubs und wie du zur Anlage am Schmelzweg kommst.',
  blocks: [
    NAV,
    { type: 'hero', data: {
      pill: 'Jederzeit ein offenes Ohr',
      titel: 'Kontakt und Anfahrt',
      sub: 'Ruf an, schreib uns oder komm einfach vorbei. Am schnellsten geht es über {{facts.verein.email}}.',
      bild: bild('anlage-zentrum-oben'), bildAlt: bildAlt('anlage-zentrum-oben'),
    }},
    { type: 'personen', data: {
      titel: 'Der Vorstand',
      vorspann: 'Wer wofür zuständig ist.',
      leute: vorstand,
    }},
    { type: 'richtext', data: {
      titel: 'Mit dem Auto',
      absaetze: [
        'A66, Abfahrt Frankfurt-Zeilsheim / Hofheim-Nord, Richtung Hofheim folgen. Am Ortseingang Hofheim an der zweiten Ampel, vor der Aral-Tankstelle, links in den Schmelzweg abbiegen. Die Anlage liegt unmittelbar links.',
        'Parkplätze sind am unteren Ende der Anlage, auf dem Parkplatz der Kreissportanlage.',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Mit Bus und Bahn',
      absaetze: [
        'Mit der S-Bahn S1 bis Hofheim. Von dort weiter mit Bus 263, Bus 401 oder Bus 812 bis zur Haltestelle Kriftel Kreissporthalle. Von dort sind es rund 100 Meter den Schmelzweg aufwärts bis zum Eingang.',
      ],
    }},
    FORMULAR,
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
    }},
    { type: 'faq', data: {
      fragen: [
        { frage: 'Wie werde ich Mitglied?',
          antwort: 'Schreib uns an [{{facts.verein.email}}](mailto:{{facts.verein.email}}) oder sprich uns auf der Anlage an. Zum Saisonstart im April bieten wir Schnupperkurse an — ideal, um den Club kennenzulernen. Alle Beiträge stehen auf der Seite [Mitglied werden](/mitglied-werden/).' },
        { frage: 'Was kosten die Mitgliedsbeiträge?',
          antwort: 'Zwischen {{facts.beitraege.passiv}} € für eine passive und {{facts.beitraege.aktiv}} € für eine aktive Mitgliedschaft im Jahr. Als Erwachsene oder Erwachsener zahlst du im ersten Jahr nur {{facts.beitraege.neumitglied_erstes_jahr}} €. Die vollständige Liste steht auf der Seite [Mitglied werden](/mitglied-werden/).' },
        { frage: 'Wann ist Saison?',
          antwort: 'Die Freiluftsaison startet {{facts.anlage.saison_start}} und endet im {{facts.anlage.saison_ende}}. In den Sommermonaten stehen {{facts.anlage.plaetze}} gepflegte Sandplätze zur Verfügung. Der Trainingsbetrieb beginnt ebenfalls im April mit Tenniscamps und Schnupperkursen.' },
        { frage: 'Kann ich als Nichtmitglied einen Platz buchen?',
          antwort: 'Die Plätze sind für Vereinsmitglieder reserviert. Als Gast eines Mitglieds kannst du aber mitspielen — die Gastspielgebühr beträgt {{facts.gast.gebuehr}} € pro Gast. Mitglieder buchen ihre Plätze über [eBuSy]({{facts.links.buchung}}).' },
        { frage: 'Brauche ich eigene Ausrüstung?',
          antwort: 'Für die Minis-Kurse werden Schläger gestellt, du brauchst nur Sportschuhe. Ansonsten hilft dir die {{facts.anlage.tennisschule}} gern bei der Auswahl.' },
        { frage: 'Gibt es Gastronomie?',
          antwort: 'Ja — das Clubrestaurant {{facts.gastronomie.name}} mit sonniger Terrasse gehört zur Anlage und ist auch für Gäste ohne Schläger offen. Öffnungszeiten, Ruhetag und die Nummer für eine Tischreservierung stehen auf [Clubhaus und Terrasse](/clubhaus/).' },
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ IMPRESSUM
{
  slug: 'impressum', page_type: 'rechtstext',
  title: 'Impressum',
  description: 'Anbieterkennzeichnung des Krifteler Tennisclubs e.V.',
  blocks: [
    NAV,
    { type: 'hero', data: { titel: 'Impressum' } },
    { type: 'richtext', data: {
      titel: 'Verantwortlich für den Inhalt',
      absaetze: [
        '{{facts.verein.name}}',
        '{{facts.verein.strasse}}, {{facts.verein.plz}} {{facts.verein.ort}}',
        'E-Mail: [{{facts.verein.email}}](mailto:{{facts.verein.email}})',
        '**Vertretungsberechtigter Vorstand:** {{facts.vorstand.erster.name}} ({{facts.vorstand.erster.rolle}}), Telefon {{facts.vorstand.erster.telefon}}',
        '**Registergericht:** {{facts.verein.registergericht}} · **Registernummer:** {{facts.verein.registernummer}}',
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

// ══════════════════════════════════════════════════════════ DATENSCHUTZ
{
  slug: 'datenschutz', page_type: 'rechtstext',
  title: 'Datenschutz',
  description: 'Wie der Krifteler Tennisclub mit personenbezogenen Daten umgeht.',
  blocks: [
    NAV,
    { type: 'hero', data: { titel: 'Datenschutz' } },
    { type: 'richtext', data: {
      absaetze: [
        'Der {{facts.verein.name}} nimmt als Betreiber dieser Website den Schutz der persönlichen Daten seiner Mitglieder und Partner ernst. Wir behandeln personenbezogene Daten vertraulich und entsprechend den gesetzlichen Vorschriften.',
        'Soweit auf diesen Seiten personenbezogene Daten wie Name, Anschrift oder E-Mail-Adresse erhoben werden, geschieht das stets auf freiwilliger Basis. Wir weisen darauf hin, dass die Datenübertragung im Internet Sicherheitslücken aufweisen kann; ein lückenloser Schutz vor dem Zugriff Dritter ist nicht möglich.',
        'Personenbezogene Daten werden Dritten nicht zugänglich gemacht, weitergegeben oder verkauft. Über welche persönlichen Daten wir Kenntnis erlangen, bestimmst du durch die Eingabe deiner Daten.',
        'Der Verein erhebt, verarbeitet und nutzt personenbezogene Daten seiner Mitglieder zur Erfüllung der satzungsgemäßen Zwecke und Aufgaben, etwa im Rahmen der Mitgliederverwaltung. Als Mitglied des Hessischen Tennisverbands ist der Verein verpflichtet, bestimmte personenbezogene Daten dorthin zu melden.',
        'Bei Fragen zum Datenschutz wende dich an [{{facts.verein.email}}](mailto:{{facts.verein.email}}).',
      ],
    }},
    ASSISTENT,
    FOOTER,
  ],
},

];
