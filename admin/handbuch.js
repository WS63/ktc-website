/* Das Handbuch. Jeder Ablauf, den ein Mensch von Hand macht.
 *
 * ZWEI REGELN, ohne die das hier verrottet:
 * 1. Ändert ein Commit einen Knopf, wird dieser Eintrag im SELBEN Commit
 *    mitgezogen. Eine Anleitung mit falschen Knopfnamen zerstört das
 *    Vertrauen in alle anderen Einträge.
 * 2. Die Fallstricke kommen aus echten Vorfällen, nicht aus Vermutungen.
 *    Jedes Mal, wenn etwas schiefgeht, entsteht hier eine Zeile.
 */
const HANDBUCH = [
  {
    titel: 'Nach dem Spieltag: Ergebnisse teilen und einen Spielbericht entwerfen',
    wann: 'Am Wochenende und danach. Der Server holt die Ergebnisse selbst; du entscheidest, was daraus wird.',
    schritte: [
      'Links auf <b>Redaktion</b>.',
      'Oben steht, wann der Server zuletzt beim Verband nachgesehen hat. Eilt es: <b>Jetzt beim Verband nachsehen</b> — das dauert rund eine Minute.',
      'Unter <b>Spielwochenende</b> das Wochenende wählen. Du siehst alle Mannschaften mit Ergebnis; „Meldung fehlt" heißt, dass der Verband es noch nicht hat.',
      '<b>Kurzinfo für den WhatsApp-Kanal:</b> Format wählen, <b>Text kopieren</b>, im Kanal einfügen. Oder <b>In WhatsApp öffnen</b>.',
      '<b>Spielbericht als Beitrag:</b> <b>Entwurf erzeugen</b>, kurz warten, dann <b>Entwurf öffnen</b>.',
      'Im Entwurf Text lesen und ändern, Fotos und Kommentare der Mannschaftsführer ergänzen, dann <b>Veröffentlichen</b>.',
    ],
    motor: 'Er fragt beim Verband nach 8, 16 und 24 Stunden nach Spielbeginn und am Folgetag um 14 Uhr nach, aber nur in den Gruppen, in denen noch ein Ergebnis fehlt. Die Ergebnistabelle im Beitrag baut er aus den Daten, und jede Zahl im Text prüft er gegen das Rohmaterial.',
    fallstricke: [
      'Der Entwurf ist <b>nie</b> veröffentlicht. Erst wenn du <b>Veröffentlichen</b> drückst, sehen ihn andere.',
      'Der Assistent kennt nur die Gesamtergebnisse, keine Spielernamen und keine Sätze. Wer den Bericht lebendiger will, ergänzt Namen und Kommentare von Hand — bei Kindern und Jugendlichen nur mit dem Einverständnis der Eltern.',
      'Zu einem Wochenende gibt es nur <b>einen</b> Entwurf. Gibt es ihn schon, öffnet sich der vorhandene unter <b>Seiten</b>; nichts wird überschrieben.',
      'Der Abruf beim Verband ist auf einmal alle zehn Minuten begrenzt, damit sein Server nicht leidet. Erscheint die Meldung, kurz warten.',
    ],
  },
  {
    titel: 'Eine neue Seite anlegen und veröffentlichen',
    wann: 'Wenn etwas dazukommt, das eine eigene Adresse braucht — etwa eine Seite für Sponsoren.',
    schritte: [
      'Links auf <b>Seiten</b>, dann rechts oben <b>+ Neue Seite</b>.',
      '<b>Art der Seite</b> wählen. „Inhaltsseite" passt fast immer.',
      '<b>Titel</b> eintragen. Die <b>Adresse</b> schlägt der Motor daraus vor — du kannst sie überschreiben.',
      '<b>Anlegen</b>. Die Seite ist jetzt ein <b>Entwurf</b> und noch nicht öffentlich.',
      'Unten Bausteine hinzufügen und ausfüllen. Mit <b>↑</b> und <b>↓</b> verschiebst du sie.',
      'Zwischendurch <b>Vorschau ↗</b> — so sieht die Seite später aus, ohne dass jemand sie findet.',
      'Wenn sie sitzt: <b>Veröffentlichen</b>. Ab diesem Moment ist sie unter ihrer Adresse erreichbar.',
      'Damit man sie auch findet: weiter zu <b>Navigation</b> und ins Menü hängen.',
    ],
    motor: 'Er setzt beim Anlegen die Pflichtbausteine der gewählten Seitenart — Kopfzeile und Fußzeile musst du nie selbst hinzufügen.',
    fallstricke: [
      'Veröffentlichen hängt die Seite <b>nicht</b> ins Menü. Das sind zwei getrennte Schritte, mit Absicht: nicht jede Seite gehört ins Menü.',
      'Die Beschreibung ist kein Zierfeld. Sie steht im Google-Ergebnis und beim Teilen in WhatsApp. Bleibt sie leer, entscheidet Google selbst, was dort steht.',
    ],
  },
  {
    titel: 'Eine Seite ins Menü hängen',
    wann: 'Immer dann, wenn eine neue Seite auch gefunden werden soll.',
    schritte: [
      'Links auf <b>Navigation</b>.',
      'Unten unter <b>Hinzufügen</b> stehen alle veröffentlichten Seiten als Knöpfe. Klick die an, die ins Menü soll.',
      'Sie erscheint oben unter <b>Im Menü oben</b>. Mit <b>↑</b> und <b>↓</b> an die richtige Stelle schieben.',
      'Die Beschriftung kannst du im Feld ändern — sie muss nicht dem Seitentitel entsprechen. Kürzer ist im Menü fast immer besser.',
      'Soll der Punkt nach unten in die Fußzeile statt ins Menü: <b>in die Fußzeile</b> klicken.',
      '<b>Menü speichern</b>. Die Änderung ist sofort auf der Website sichtbar.',
    ],
    motor: 'Er versteckt Menüpunkte, die auf eine gelöschte oder zurückgezogene Seite zeigen, statt ins Leere zu verlinken — und zeigt dir oben eine Warnung.',
    fallstricke: [
      'Nur <b>veröffentlichte</b> Seiten stehen als Knöpfe zur Auswahl. Fehlt deine Seite, ist sie noch ein Entwurf.',
      'Nicht alphabetisch sortieren. Die Reihenfolge ist Redaktion: was die meisten suchen, steht vorn.',
      'Vergiss das <b>Menü speichern</b> nicht — das Verschieben allein ändert noch nichts.',
    ],
  },
  {
    titel: 'Ein Bild hochladen und einsetzen',
    wann: 'Immer wenn ein Bild auf eine Seite soll.',
    schritte: [
      'Links auf <b>Medien</b>, rechts oben die Datei wählen. Sie wird sofort hochgeladen.',
      '<b>Alt-Text eintragen.</b> Beschreib, was zu sehen ist: „Drei Kinder beim Training auf Platz 2", nicht „Bild1".',
      'Jetzt zur Seite: <b>Seiten</b> → Seite öffnen → unten Baustein <b>Bild</b> hinzufügen.',
      'Auf <b>Bild wählen</b> klicken und das Bild aus der Liste anklicken. Du musst nie einen Pfad tippen.',
      'Den Alt-Text im Baustein noch einmal eintragen — er beschreibt das Bild <i>an dieser Stelle</i>.',
      '<b>Speichern</b>, dann <b>Vorschau ↗</b> zur Kontrolle.',
    ],
    motor: 'Er hängt eine Prüfsumme an den Dateinamen. Lädst du später ein anderes Bild mit demselben Namen hoch, bekommt es eine eigene Adresse — so zeigt niemand versehentlich noch das alte.',
    fallstricke: [
      '<b>WebP statt PNG</b>, außer du brauchst Transparenz. Bei Fotos spart das rund vier Fünftel Ladezeit.',
      'Ein Bild, das noch auf einer Seite benutzt wird, lässt sich nicht löschen — das Cockpit sagt dir, wo es steckt.',
      'Ohne Alt-Text ist das Bild für einen Vorleser nicht vorhanden. Das ist kein Zusatz, das ist die halbe Miete.',
    ],
  },
  {
    titel: 'Eine Seite umbenennen',
    wann: 'Wenn die Adresse nicht mehr passt — etwa aus /startseite-3/ soll /gastronomie/ werden.',
    schritte: [
      '<b>Seiten</b> → Seite öffnen.',
      'Oben das Feld <b>Adresse</b> ändern.',
      '<b>Speichern</b>.',
    ],
    motor: 'Er legt <b>ungefragt</b> eine dauerhafte Umleitung von der alten auf die neue Adresse an. Alte Links aus Google, aus E-Mails und von anderen Websites funktionieren weiter. Du siehst den Eintrag unter <b>Umleitungen</b>.',
    fallstricke: [
      'Die Umleitung entsteht nur, wenn die Seite <b>veröffentlicht</b> war. Bei einem Entwurf gab es ja noch keine Links.',
      'Steht die Seite im Menü, zeigt der Menüpunkt danach noch auf die alte Adresse. Die Umleitung fängt das ab — trotzdem unter <b>Navigation</b> geradeziehen.',
    ],
  },
  {
    titel: 'Eine Seite löschen',
    wann: 'Wenn etwas endgültig weg soll. Überleg vorher, ob <b>Zurückziehen</b> reicht — das macht sie unsichtbar, ohne sie zu verlieren.',
    schritte: [
      '<b>Seiten</b> → bei der Seite auf <b>Löschen</b>.',
      'War die Seite öffentlich, fragt das Cockpit, <b>wohin ihre Adresse künftig führen soll</b>. Das ist Pflicht, kein Vorschlag.',
      'Trag das nächstbeste Ziel ein — meistens die Übersichtsseite darüber, sonst <code>/</code>.',
      '<b>Endgültig löschen</b>.',
    ],
    motor: 'Er legt die Umleitung an und versteckt den Menüpunkt, der auf die Seite zeigte.',
    fallstricke: [
      'Löschen lässt sich nicht rückgängig machen. Der Inhalt ist weg.',
      'Willst du nur eine Pause: <b>Zurückziehen</b> im Seiten-Editor. Die Seite wird zum Entwurf, der Inhalt bleibt.',
    ],
  },
  {
    titel: 'Einen Preis oder eine Zahl ändern',
    wann: 'Wenn sich ein Mitgliedsbeitrag, eine Telefonnummer oder eine Öffnungszeit ändert.',
    schritte: [
      'Links auf <b>Fakten</b>.',
      'Die passende Gruppe suchen — Beiträge, Vorstand, Anlage, Links.',
      'Den neuen Wert eintragen. Unter jedem Feld steht der Grundwert, damit du siehst, was du überschreibst.',
      '<b>Speichern</b>.',
    ],
    motor: 'Er setzt den neuen Wert <b>überall gleichzeitig</b> ein, wo diese Zahl auf der Website vorkommt. Du musst keine einzige Seite anfassen.',
    fallstricke: [
      'Das ist der wichtigste Punkt im ganzen Cockpit: <b>Zahlen gehören hierher, nicht in den Seitentext.</b> Wer einen Preis direkt in einen Absatz tippt, hat ihn nächstes Jahr an drei Stellen stehen und ändert zwei davon.',
      'Ein Feld, unter dem rot „Fehlt" steht, erscheint auf der Website sichtbar als <code>[…]</code>. Das ist Absicht — eine auffällige Lücke ist besser als eine erfundene Zahl.',
      'Ein Feld leer lassen heißt: der Grundwert aus der Datei gilt wieder.',
    ],
  },
  {
    titel: 'Eine Anfrage bearbeiten',
    wann: 'Wenn jemand über ein Formular auf der Website geschrieben hat.',
    schritte: [
      'Die rote Zahl neben <b>Anfragen</b> zeigt, wie viele ungelesen sind.',
      'Links auf <b>Anfragen</b>. Die neueste steht oben.',
      'Antworten tust du in deinem normalen E-Mail-Programm — das Cockpit verschickt nichts.',
      'Danach <b>Als gelesen</b> klicken, damit die Zahl stimmt.',
    ],
    motor: 'Er speichert jede Anfrage, <b>bevor</b> er irgendetwas anderes versucht. Klemmt später die Benachrichtigung, liegt die Anfrage trotzdem hier. Verloren geht nichts.',
    fallstricke: [
      'Eine Anfrage, die niemand ansieht, ist so gut wie keine. Schau einmal am Tag auf die rote Zahl.',
      'Es kommen keine E-Mails, solange kein Versand eingerichtet ist. Bis dahin ist diese Liste der einzige Ort.',
    ],
  },
  {
    titel: 'Wenn etwas nicht so aussieht wie erwartet',
    wann: 'Du hast gespeichert, aber die Website zeigt noch das Alte.',
    schritte: [
      'Erst prüfen: Ist die Seite <b>veröffentlicht</b> oder noch <b>Entwurf</b>? Entwürfe sieht nur, wer angemeldet ist.',
      'Dann die Seite im Browser neu laden — einmal mit gedrückter Umschalttaste.',
      'Steht es immer noch falsch da: im Cockpit noch einmal <b>Speichern</b> drücken. Das leert die Zwischenablage des Motors.',
      'Hilft auch das nicht, stimmt etwas im System nicht — das ist dann ein Fall für die Entwicklung.',
    ],
    fallstricke: [
      'Der Motor merkt sich fertig gebaute Seiten, um schnell zu sein. Jede Änderung im Cockpit leert diesen Speicher von allein — aber nur, wenn du wirklich gespeichert hast.',
    ],
  },
];
