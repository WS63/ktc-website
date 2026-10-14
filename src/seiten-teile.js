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
    // Die Fotos stehen im Textbaustein, in einer schmalen Spalte daneben — so
    // muss niemand scrollen, um den Text zu lesen. Jedes Foto hat nur eine
    // Unterschrift (die Mannschaft, keine Spielernamen), keine Textstelle.
    { type: 'richtext', data: { absaetze: b.absaetze, bilder: b.fotos || [] } },
    { type: 'cards', data: {
      karten: [{ titel: 'Zurück zur Übersicht',
        text: 'Alle Neuigkeiten aus dem Verein.',
        linkLabel: 'Zu Aktuelles', linkHref: '/aktuelles/' }],
    }},
    { type: 'assistent', data: {} },
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
