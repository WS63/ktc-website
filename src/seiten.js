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
import { readFileSync, existsSync } from 'node:fs';

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

const NAV = { type: 'nav', data: {
  marke: 'krifteler tennisclub',
  baum: menue,
  aktionLabel: 'Platz buchen',
  aktionHref: '{{facts.links.buchung}}',
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
  baum: [
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
        'Tennis in familiärer Atmosphäre, auf einer der schönsten Anlagen im Main-Taunus-Kreis. {{facts.anlage.plaetze}} gepflegte {{facts.anlage.belag}}plätze, ein gemütliches Clubhaus und eine sonnige Terrasse mit guter Gastronomie — hier bleibst du nach dem Spiel gern noch sitzen. Wir sind {{facts.anlage.mitglieder}} Mitglieder, darunter {{facts.anlage.jugendliche}} Kinder und Jugendliche.',
        'Ob du anfängst, nach Jahren wieder einsteigst oder ambitioniert in der Mannschaft spielst — bei uns findest du das passende Angebot. Im Jugend- und Erwachsenenbereich spielen {{facts.anlage.mannschaften}} Mannschaften Wettkämpfe bis zur Landesebene. Im Freizeitbereich gibt es übers Jahr Turniere und Veranstaltungen.',
        'Die Jüngsten trainieren bei der **{{facts.anlage.tennisschule}}**, auf die wir seit {{facts.anlage.tennisschule_seit}} vertrauen — mit eingespieltem Trainerteam und klarem Lernkonzept.',
        'Interessiert an einer Mitgliedschaft oder einem Schnuppertraining? Beiträge, Anträge und alles zum Herunterladen stehen auf [Mitglied werden](/mitglied-werden/). Oder komm einfach am {{facts.verein.strasse}} in {{facts.verein.ort}} vorbei — [so findest du uns](/kontakt/).',
        '**Krifteler Tennisclub — sportlich, herzlich, familiär.**',
      ],
    }},
    { type: 'infokarten', data: {
      // 'anschluss': die Eckdaten gehoeren zum Textabschnitt darueber — kein
      // eigener Grund, keine Trennlinie dazwischen. Die ruhige Flaeche setzt
      // erst bei 'Sportliche Vielfalt' ein.
      grund: 'anschluss',
      karten: [
        { label: 'Plätze', wert: '{{facts.anlage.plaetze}}',
          zusatz: 'gepflegte {{facts.anlage.belag}}plätze, bespielbar von {{facts.anlage.saison}}' },
        { label: 'Mitglieder', wert: '{{facts.anlage.mitglieder}}',
          zusatz: 'davon {{facts.anlage.jugendliche}} Kinder und Jugendliche, betreut von der {{facts.anlage.tennisschule}}' },
        { label: 'Mannschaften', wert: '{{facts.anlage.mannschaften}}',
          zusatz: 'von den Junioren bis Senioren 60 — dazu die Hobbyrunde ohne Anmeldung' },
      ],
    }},
    { type: 'cards', data: {
      titel: 'Sportliche Vielfalt',
      grund: 'ruhig',
      karten: [
        { titel: 'Team und Wettkampf', text: 'Über 20 Mannschaften in allen Alters- und Leistungsklassen. Wir spielen um jeden Punkt — und für die Geselligkeit.', linkLabel: 'Zu den Mannschaften', linkHref: '/sport/',
          bild: bild('club-tennisnetz', 'mittel'), bildAlt: bildAlt('club-tennisnetz') },
        { titel: 'Hobby und Freizeit', text: 'Die Hobbyrunde ohne Anmeldung, Doppelturniere und Freundschaftsspiele gegen andere Vereine.', linkLabel: 'Zur Hobbyrunde', linkHref: '/sport/',
          bild: bild('anlage-wiese', 'mittel'), bildAlt: bildAlt('anlage-wiese') },
        { titel: 'Jugend', text: 'Fördern und fordern. Mit Spaß, Freude und einem gezielten Lernkonzept an den Tennissport heran.', linkLabel: 'Zur Jugendarbeit', linkHref: '/sport/',
          bild: bild('sport-jugend', 'mittel'), bildAlt: bildAlt('sport-jugend') },
      ],
    }},
    { type: 'beitragsliste', data: {
      titel: 'Aus dem Verein',
      // Nur ein Aufhaenger. Die vollstaendige Liste steht auf /aktuelles/ —
      // dieselbe Abfrage, zwei Ansichten (P3).
      anzahl: '2',
      mehrLabel: 'Alle Beiträge',
      mehrHref: '/aktuelles/',
      leerText: 'Hier stehen bald die Neuigkeiten aus dem Verein.',
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
      sub: 'Vom ersten Schläger bis zur Hessenliga. Such dir aus, was zu dir passt — wechseln kannst du jederzeit.',
      ctaLabel: 'Mitglied werden', ctaHref: '/mitglied-werden/',
      bild: bild('anlage-tennisplatz'), bildAlt: bildAlt('anlage-tennisplatz'),
    }},
    // Die vier Wege ins Spielen, gleich oben. Wer die Jugendarbeit sucht,
    // soll nicht erst an der Medenrunde vorbeiscrollen.
    { type: 'cards', data: {
      karten: [
        { titel: 'Team und Wettkampf', text: 'Siebzehn Mannschaften von der Kreisliga bis zur Hessenliga.',
          linkLabel: 'Weiterlesen', linkHref: '/sport/#wettkampf',
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
        'Bei den Erwachsenen reicht es von der Kreisliga bis zur **Hessenliga** — dort spielen unsere Herren 50. Mehrere Teams treten als Spielgemeinschaft mit Diedenbergen und Kelkheim an, so bekommt jede Altersklasse genug Spielerinnen und Spieler zusammen.',
      ],
    }},
    { type: 'cards', data: {
      karten: [
        { titel: 'Alle Mannschaften im Überblick',
          text: 'Siebzehn Teams der Erwachsenen von der Kreisliga bis zur Hessenliga, dazu die Jugend von U12 bis U18 — mit Spielgemeinschaft, Stärke und Spielklasse.',
          linkLabel: 'Zur Mannschaftsübersicht', linkHref: '/mannschaften/' },
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
    { type: 'infokarten', data: {
      titel: 'Tennis für Minis',
      karten: [
        { label: 'Wann',    wert: '{{facts.minis.tag}}', zusatz: '{{facts.minis.zeit}}, außer in den Schulferien' },
        { label: 'Wer',     wert: '{{facts.minis.alter}}', zusatz: 'Kinder und Eltern gemeinsam auf dem Platz' },
        { label: 'Umfang',  wert: '{{facts.minis.einheiten}} Einheiten', zusatz: 'Schläger werden gestellt, Sportschuhe mitbringen' },
        { label: 'Kosten',  wert: '{{facts.minis.kursgebuehr_kind}} €', zusatz: 'Kind · Erwachsene parallel {{facts.minis.kursgebuehr_erwachsen}} €' },
      ],
    }},
    { type: 'richtext', data: {
      absaetze: [
        'Die Gruppen sind klein: bis zu {{facts.minis.gruppengroesse_kinder}} Kinder, parallel {{facts.minis.gruppengroesse_erwachsene}} Erwachsene. **Bitte ruf vor der Anmeldung kurz an**, damit wir die passende Altersgruppe finden — {{facts.minis.kontakt_name}}, {{facts.minis.kontakt_telefon}}.',
      ],
    }},
    { type: 'richtext', data: {
      titel: 'Tennisschule Kaus',
      anker: 'tennisschule',
      absaetze: [
        'Seit {{facts.anlage.tennisschule_seit}} vertraut der KTC auf die Kompetenz der {{facts.anlage.tennisschule}}. Geleitet von den staatlich geprüften Tennislehrern Bertrand und Oliver Kaus, steht sie für Qualität, Engagement und messbaren Trainingserfolg.',
        'Mit einem motivierten Trainerteam und modernen Lehrmethoden begleitet sie Kinder, Jugendliche und Erwachsene — vom Einsteiger bis zum Turnierspieler. Sie gehört zu den vom Deutschen Tennis Bund und vom Verband Deutscher Tennislehrer anerkannten Top-50-Tennisschulen.',
        'Kosten für individuelles Training, Tennis-Camps und Kurse sind nicht im Clubbeitrag enthalten.',
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
      sub: 'Siebzehn Teams der Erwachsenen, dazu die Jugend von U12 bis U18. Von der Kreisliga bis zur Hessenliga.',
      bild: bild('anlage-tennisplatz'), bildAlt: bildAlt('anlage-tennisplatz'),
    }},
    { type: 'tabelle', data: {
      titel: 'Mannschaften der Erwachsenen',
      kopf: ['Mannschaft', 'Spielgemeinschaft', 'Stärke', 'Spielklasse'],
      zeilen: [
        ['Damen', 'Diedenbergen/KTC', '6er', 'Kreisoberliga'],
        ['Damen II', 'Diedenbergen/KTC', '4er', 'Kreisoberliga'],
        ['Damen III', 'Diedenbergen/KTC', '4er', 'Kreisliga B'],
        ['Damen 40', '—', '4er', 'Kreisliga A'],
        ['Damen 50', '—', '4er', 'Gruppenliga'],
        ['Damen 55', '—', '4er', 'Gruppenliga'],
        ['Herren', '—', '4er', 'Kreisliga A'],
        ['Herren II', '—', '2er', 'Kreisliga A'],
        ['Herren 30', '—', '6er', 'Kreisoberliga'],
        ['Herren 40', '—', '6er', 'Gruppenliga'],
        ['Herren 40 II', '—', '4er', 'Kreisliga A'],
        ['Herren 50', '—', '6er', 'Hessenliga'],
        ['Herren 50 II', '—', '4er', 'Kreisoberliga'],
        ['Herren 55', '—', '4er', 'Gruppenliga'],
        ['Herren 60', '—', '4er', 'Kreisliga A'],
        ['Summer Mixed 50', '—', '4er', 'Pros'],
        ['Summer Mixed 50 II', '—', '4er', 'Amateurs'],
      ],
      hinweis: 'Dazu kommen die Jugendmannschaften von U12 bis U18. Alle Spieltermine stehen beim Hessischen Tennisverband.',
    }},
    { type: 'richtext', data: {
      absaetze: [
        'Mehrere Teams treten als Spielgemeinschaft mit Diedenbergen und Kelkheim an. So bekommt jede Altersklasse genug Spielerinnen und Spieler zusammen.',
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
      titel: 'Die Beiträge',
      spalte1: 'Mitgliedschaft', spalte2: 'pro Jahr',
      zeilen: [
        { label: 'Neumitglied Erwachsene, erstes Jahr', wert: '{{facts.beitraege.neumitglied_erstes_jahr}} €', hervor: true },
        { label: 'Aktives Mitglied', wert: '{{facts.beitraege.aktiv}} €' },
        { label: 'Aktives Mitglied, Ehe- oder Lebenspartner', wert: '{{facts.beitraege.aktiv_partner}} €' },
        { label: 'Aktives Mitglied in Ausbildung', wert: '{{facts.beitraege.aktiv_ausbildung}} €' },
        { label: 'Jugend bis zum vollendeten 18. Lebensjahr', wert: '{{facts.beitraege.jugend}} €' },
        { label: 'Jugend als Familienmitglied', wert: '{{facts.beitraege.jugend_familie}} €' },
        { label: 'Passives Mitglied', wert: '{{facts.beitraege.passiv}} €' },
      ],
      hinweis: 'Alle Beiträge gelten für das Kalenderjahr. Wer ab dem {{facts.beitraege.halber_beitrag_ab}} einsteigt, zahlt für das laufende Jahr die Hälfte. Die Kündigungsfrist endet am {{facts.beitraege.kuendigungsfrist}}.',
    }},
    { type: 'richtext', data: {
      titel: 'Das Kleingedruckte, kurz',
      absaetze: [
        '**In Ausbildung** heißt: gegen Nachweis eines Schüler-, Studenten- oder Ausbildungsausweises, bis zum vollendeten 27. Lebensjahr. Stichtag für alle Altersgrenzen ist der 31. Dezember des jeweiligen Jahres.',
        '**Jugend als Familienmitglied** setzt voraus, dass mindestens ein Elternteil aktives Mitglied ist.',
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
      // Beispieltermine, damit der Baustein etwas zu zeigen hat. Sie werden
      // ersetzt, sobald der Vorstand die echten Termine liefert.
      termine: [
        { datum: '2027-04-17', uhrzeit: '14:00', art: 'verein',
          titel: 'Saisoneröffnung',
          text: 'Start in die Freiluftsaison mit Schleifchenturnier und anschließendem Grillen.',
          ort: 'Clubhaus und Plätze' },
        { datum: '2027-04-24', uhrzeit: '09:00', art: 'wettspiel',
          titel: 'Erster Spieltag der Medenrunde',
          text: 'Herren 40, Damen 30, Junioren U18 und U15 — die Aufstellungen hängen im Clubhaus aus.' },
        { datum: '2027-05-08', uhrzeit: '09:30', art: 'verein',
          titel: 'Arbeitseinsatz',
          text: 'Gemeinsam die Anlage herrichten. Wer mitmacht, bekommt Frühstück.',
          ort: 'Treffpunkt am Clubhaus' },
        { datum: '2027-06-12', uhrzeit: '10:00', art: 'sonstiges',
          titel: 'Tag der offenen Tür',
          text: 'Schläger ausprobieren, Platz testen, Leute kennenlernen. Ohne Anmeldung.' },
      ],
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
          antwort: 'Ja, das Clubrestaurant mit sonniger Terrasse gehört zur Anlage.' },
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
