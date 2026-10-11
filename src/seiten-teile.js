/** Bausteine fuer Seiten, die aus Daten entstehen — hier: die Beitraege. */

const menue = [
  { label: 'Club',            href: '/' },
  { label: 'Sport',           href: '/sport/' },
  { label: 'Mitglied werden', href: '/mitglied-werden/' },
  { label: 'Aktuelles',       href: '/aktuelles/' },
  { label: 'Termine',         href: '/kalender/' },
  { label: 'Kontakt',         href: '/kontakt/' },
];

export const seitenBausteine = {
  beitrag: (b) => [
    { type: 'nav', data: {
      marke: 'krifteler tennisclub', baum: menue,
      aktionLabel: 'Platz buchen', aktionHref: '{{facts.links.buchung}}',
    }},
    { type: 'hero', data: {
      pill: `${b.symbol ? b.symbol + ' ' : ''}${new Date(b.datum).toLocaleDateString('de-DE',
        { day: 'numeric', month: 'long', year: 'numeric' })}`,
      titel: b.titel,
    }},
    // EIN Bild je Beitrag, oben, mit Unterschrift (nur die Mannschaft, keine
    // Namen). Das Original hatte oft mehrere; hier gilt: eines, das den Beitrag
    // traegt. Das Bild gehoert in die Detailansicht. In der Uebersicht steht
    // stattdessen das Symbol — ein Bild je Zeile machte aus fuenfzig Beitraegen im Jahr
    // einen Flickenteppich, und nicht jeder Beitrag hat eines.
    ...(b.bildUrl ? [{ type: 'bild', data: { pfad: b.bildUrl, alt: b.bildAlt || '', bildunterschrift: b.bildunterschrift || '', breite: 'text' } }] : []),
    { type: 'richtext', data: { absaetze: b.absaetze } },
    { type: 'cards', data: {
      karten: [{ titel: 'Zurück zur Übersicht',
        text: 'Alle Neuigkeiten aus dem Verein.',
        linkLabel: 'Zu Aktuelles', linkHref: '/aktuelles/' }],
    }},
    { type: 'assistent', data: {
      name: 'Frag den KTC',
      begruessung: 'Ich kenne alles, was auf dieser Website steht. Womit kann ich dir helfen?',
      vorschlaege: ['Was kostet eine Mitgliedschaft?', 'Wann startet die Saison?'],
    }},
    { type: 'footer', data: {
      zeile: '{{facts.verein.name}} · {{facts.verein.strasse}}, {{facts.verein.plz}} {{facts.verein.ort}}',
      baum: [
        { label: 'FAQ', href: '/faq/' },
        { label: 'Impressum', href: '/impressum/' },
        { label: 'Datenschutz', href: '/datenschutz/' },
      ],
    }},
  ],
};
