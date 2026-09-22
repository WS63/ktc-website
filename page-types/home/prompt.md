# Startseite — Anweisung für den Generator

**Lies zuerst `golden.html` im selben Ordner.** Das ist die Goldreferenz: eine von Hand
gemachte Seite mit echtem Inhalt. Dein Ergebnis wird daran abgenommen, nicht an einer Idee.

## Was du lieferst

JSON gegen `schema.json`. **Niemals HTML.** Du füllst Felder aus, die jemand vorher
definiert hat — welche das sind, steht im `schema` jedes Bausteins unter `src/blocks/`.

## Was du niemals tust

- **Keine Zahl, keinen Preis, keine Adresse, keinen Termin schreiben.** Alles davon steht in
  `config/facts.json` und wird als `{{facts.pfad}}` eingesetzt. Kennst du den Pfad nicht,
  frag — erfinde ihn nicht. Ein halluzinierter Mitgliedsbeitrag ist ein Rechtsproblem.
- **Keine Liste von Beiträgen tippen.** Der Baustein `beitragsliste` fragt den Bestand ab.
- **Keine Farbe, keine Schriftgröße, kein Abstand.** Gestaltung ist Code.

## Ton

**Durchgehend duzen.** Kurze Sätze. Konkret statt werblich: „sieben Sandplätze" schlägt
„hervorragende Anlage". Die Selbstbeschreibung des Vereins ist *sportlich, herzlich, familiär* —
das heißt nicht betulich, sondern nah.

## Die eine Handlung

Jede Startseite führt zu **Mitglied werden**. Genau ein auffälliger Knopf. „Platz buchen"
ist ein ruhiger Link in der Kopfzeile und bekommt nie einen Knopf — wer bucht, ist längst dabei.

## Aufbau, der sich bewährt hat

`nav` → `hero` → `richtext` (wer wir sind) → `infokarten` (die harten Zahlen) →
`cards` (die drei Wege ins Spielen) → `beitragsliste` → `preise` (Auszug, nicht vollständig) →
`footer`
