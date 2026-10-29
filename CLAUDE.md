# Krifteler Tennisclub — KI-native Website

Diese Website hat kein CMS und keinen Editor. Inhalte sind **strukturierte Daten gegen einen
Vertrag**, das Rendern ist deterministisch. Bevor du hier etwas änderst, lies:

- **`ki-native-website-motor.md`** — die Bauanleitung. Die sieben Prinzipien in Teil I sind
  nicht Zierde, sie sind der Grund, warum das Ergebnis trägt.
- **`docs/entscheidungen.md`** — warum dieses System so gebaut ist und wofür. Kommt eine Frage
  auf, steht die Antwort dort. Steht sie nicht dort, ist das der Moment zu fragen statt zu raten.
- **`docs/vorlage.md`** — die Bestandsaufnahme der alten WordPress-Seite, inklusive der
  Umleitungstabelle alt → neu.
- **`docs/design-prinzipien.md`** — die Gestaltungsregeln. Verbindlich, bevor UI-Code entsteht.
  Die Werte stehen in `config/theme.json`, diese Datei erklärt, was sie bedeuten.

## Das Wichtigste in Kürze

**Die eine Handlung ist „Mitglied werden".** Sie bekommt den einen gelben Knopf. Alles andere
ist nachrangig und bekommt nie einen auffälligen Knopf — auch „Platz buchen" nicht.
Ein Test hält das fest: höchstens ein `.knopf` je Seite.

**Durchgehend duzen.** Die alte Seite mischt Sie und Du. Das hört hier auf.

## Die Regeln, gegen die du nicht verstoßen darfst

1. **Nie HTML von einem Modell schreiben lassen.** Ein Modell füllt Felder eines Schemas aus,
   mehr nicht. Wer das Modell HTML schreiben lässt, baut KI-first.
2. **Nie eine Farbe direkt in einen Baustein schreiben.** Alles kommt aus `config/theme.json`
   als CSS-Variable. Sonst ist ein Redesign eine Suchen-und-Ersetzen-Orgie statt einer Datei.
3. **Nie eine Zahl, einen Preis, eine Adresse oder einen Termin in einen Seitentext tippen.**
   Die stehen in `config/facts.json` und werden als `{{facts.pfad}}` eingestempelt. Fehlt ein
   Wert, erscheint sichtbar `[…]`. Eine Lücke, die auffällt, ist besser als eine erfundene Zahl.
4. **Nie eine Liste von Hand pflegen.** Übersichten sind Abfragen. Zahlen in Texten werden
   gerechnet (`{n} Beiträge`), nie getippt.
5. **Nie `edited` überschreiben.** Die Statuskette ist heilig:
   `draft → generated → edited → approved → published → archived`. Regeneration braucht Force.
6. **Nie denselben SQL-Platzhalter zweimal verwenden.** Postgres erlaubt `$5, $5`, die
   SQLite-Übersetzung in `src/db.js` zählt positionell und scheitert zur Laufzeit.
   Wert notfalls doppelt übergeben.

## Signalfarbe und Akzent — der Unterschied

- **Signal `#0050ff` (Blau)** macht die Arbeit: Links, Menü, Rahmen, Hinweise, Kartenkanten.
  Es markiert, es füllt keine großen Flächen.
- **Akzent `#ffbe00` (Gelb)** hat zwei Aufgaben, mehr nicht: die Fläche des Knopfes „Mitglied
  werden" — **ein gelber Knopf pro Bildschirm** — und, nur im Aufmacher der Startseite auf dem
  dunklen Foto, den Akzent für ein Schlüsselwort, Zahlen und laufenden Balken (`--titel-akzent`, derselbe
  Gelbton; so am 20.10.2026 entschieden, Blau und Grün trugen auf dem Foto nicht). Sonst nirgends.
  Gelb hat auf Weiß 1,66:1 Kontrast: **nie Textfarbe auf hellem Grund**, nur Fläche mit dunkler
  Schrift oder Schrift auf dem dunklen Foto.
- **Ein Etikett auf einem Foto** (Thema im Aufmacher, Zeile in der Kontakt-Kopfzeile) ist eine
  dunkle, runde Pille mit weißer Schrift (`--etikett-grund`) — **kein Link**. Links sind die
  hellblauen Pillen.
- Das Logo bleibt vierfarbig. Es ist die Marke, nicht die Bedienung.
- **Hell ist der Normalfall.** Zwei helle Töne wechseln sich ab. Ein einzelner Abschnitt darf
  dunkel sein: `.section--dunkel` setzt dieselben Variablennamen neu — die Tokens kippen, die
  Bausteine bleiben unverändert. Eine zweite Klasse je Baustein verfehlt den Mechanismus.
- **Farbigen Text nur über die geprüften Fassungen** `--gut-text`, `--achtung-text`,
  `--alarm-text`. Die Flächenfarben derselben Ampel fallen als Text auf Weiß durch.

## Bedienung

```bash
npm run dev     # Entwicklung, startet bei Änderungen neu
npm start       # Betrieb
npm test        # 11 Tests: Prinzipien, Sicherheit, Vertrag
npm run seed    # alle Seiten und Beiträge anlegen oder aktualisieren
                # überspringt Seiten mit status 'edited' (P5) und Seiten, die im Cockpit geändert
                # wurden (gemerkter Stand `pages.seed_hash` weicht ab) — mit -- --force überschreiben.
                # Seiten ohne gemerkten Stand (vor Migration 014) bekommen den Seed einmalig wie früher.
npm run struktur # Menü und die 301-Umleitungen der alten Website anlegen (einmalig)
```

Läuft auf http://localhost:3000 · Cockpit unter http://localhost:3000/admin/

Das Passwort steht in `.env` als `ADMIN_PASSWORT`. **Die Datei gehört nicht ins Repository**
und steht in `.gitignore`. `.env.beispiel` zeigt, welche Werte gebraucht werden.

**Für Prüfungen keine Shell-Befehle, sondern Node** — das läuft auf Mac und Windows gleich:

```bash
node -e "fetch('http://localhost:3000/').then(r=>console.log(r.status))"
```

## Wo was liegt

```
server.js            Einstieg: Migrationen → Middleware → Routen
config/
  site.json          Domain, Sprache, Titel-Zusatz
  facts.json         Fakten-SSOT (P2) — hier und nirgends sonst
  theme.json         Design-Tokens — hier und nirgends sonst
migrations/          idempotent, lexikalisch sortiert
src/
  db.js              kapselt Weg A (SQLite) und B/C (Postgres). Sonst weiß niemand, welcher läuft.
  renderer.js        renderPage(seite) → HTML. Reine Funktion.
  archetypes.js      Seitentypen + validateContent() — der Vertrag
  blocks/            ein Baustein = Schema + Vorgaben + render() + CSS
  routes/public.js   öffentliche Seiten
src/seiten.js        der Inhalt aller Startseiten — Handarbeit aus Stufe 2, keine Generator-Ausgabe
src/seiten-teile.js  Bausteine für Seiten, die aus Daten entstehen (Beiträge)
page-types/          home · sport · standard · aktuelles · beitrag · rechtstext
  home/golden.html   die Goldreferenz (P4) — jedes Generator-Ergebnis wird daran abgenommen
  home/prompt.md     die Anweisung für den Generator
assets/              ktc-logo-rahmen.svg (Kopfzeile) · ktc-logo-bild-2026.svg (Aufmacher)
probe/               die Probeseite aus Stufe 0, in der die Signalfarbe entschieden wurde
tests/               node --test
```

## Stand

- **Stufe 0 · abgeschlossen** — Entscheidungen und Bestandsaufnahme liegen in `docs/`
- **Stufe 1 · abgeschlossen** — Motor läuft, Startseite gerendert, 11 Tests grün
- **Stufe 2 · abgeschlossen** — Goldreferenz liegt, 8 Seiten + 14 übernommene Beiträge, 17 Tests grün
- **Stufe 3 · abgeschlossen** — Cockpit unter `/admin/`, 32 Tests grün, Prüfstein erfüllt
- **Stufe 4 · abgeschlossen** — der Generator. Aus Notizen wird ein Entwurf
- **Stufe 5 · vorbereitet und geprüft** — Ziel: `ktc-ai.schneiderwerner-consult.com`,
  Coolify-Projekt „labor". Postgres, Abbild und Umzug sind lokal durchgetestet.
  **Die Schritte stehen in `docs/stufe5-oeffentlich.md`.**
- **Stufe 6 · teilweise** — neue Bausteine und Seitentypen sind Stufe-6-Arbeit
- **Stufe 7 · abgeschlossen** — der Assistent. 67 Stücke, Antworten nur aus dem Bestand

## Bilder

**Die Originale liegen in `bilder/`, aufgeteilt nach Rolle:**

| Ordner | Wofür | Lebensdauer | Personen |
|---|---|---|---|
| `anlage/` | Der Ort: Plätze, Clubhaus, Terrasse. Aufmacher der Hauptseiten. | Jahre | möglichst ohne |
| `themen/` | Eyecatcher je Bereich: Wettkampf, Hobby, Jugend, Tennisschule, Minis | Jahre | gern, aber prüfen |
| `beitraege/` | Ein Bild je Beitrag, zeigt das konkrete Ereignis | einmal | fast immer |

```bash
npm run bilder    # erzeugt drei Größen + inhalte/bilder.json
npm run seed      # die Seiten übernehmen die neuen Adressen
```

**Ein Bild austauschen:** neue Datei unter demselben Namen in `bilder/` ablegen,
die zwei Befehle laufen lassen. Fertig.

**Nie in `assets/bilder/` arbeiten.** Was dort liegt, ist erzeugt.

### Zwei Orte für Bilder, zwei Zwecke

| Ort | URL | Kommt woher | Überlebt Deploy |
|---|---|---|---|
| `assets/bilder/` | `/bilder/…` | aus `bilder/` erzeugt, **im Repository** | ja, kommt mit |
| `data/uploads/` | `/uploads/…` | im Cockpit hochgeladen | ja, liegt auf dem Volume |

**Warum die erzeugten Bilder ins Repository gehören:** `npm run bilder` braucht `sips`
und läuft nur auf einem Mac. Im Linux-Container gibt es das nicht — die fertigen
Fassungen müssen also mitkommen. Und sie sind Inhalt der Website, genau wie die Seiten
in `src/seiten.js`.

### Warum ein Verzeichnis statt fester Dateinamen

Der Dateiname trägt eine Prüfsumme des Inhalts (`terrasse-1600-8c0fb931.jpg`) — deshalb
darf der Browser ihn ein Jahr behalten, und ein ausgetauschtes Bild bekommt von allein
eine neue Adresse. **In der ersten Fassung standen diese Namen fest in `src/seiten.js`.**
Damit war jeder Bildwechsel eine Suche durch den Quelltext. Jetzt beziehen sich die
Seiten auf den **Namen**, und `inhalte/bilder.json` übersetzt ihn.

`npm run bilder` räumt überholte Fassungen **eigener** Bilder weg. Was jemand über das
Cockpit hochgeladen hat, bleibt liegen.

### Quellen klein halten

`bilder/` liegt im Repository — **Git vergisst nichts**, jede Fassung bleibt für immer
in der Geschichte. Ein Handy-Original mit 5 MB kostet dauerhaft. 2400 Pixel reichen
für die größte Ausgabe (1600) mit Reserve; das Skript warnt ab 1 MB.

### Alt-Texte

`inhalte/bild-texte.json`, nach Namen. **Ein Bild ohne Alt-Text ist für einen Vorleser
nicht vorhanden.** Der Text beschreibt, was zu *sehen* ist, nicht was es bedeutet.

### Persönlichkeitsrechte

Das entscheidet kein Programm. Wer erkennbar ist, muss einverstanden sein — bei Kindern
die Eltern. Im Zweifel: ein anderes Bild.

## Das Logo

Die Marke kommt aus den Vektordateien von 2026-07-02 unter
`Documents/80 Krifteler TC/10 KTC LOGOS/VECTORS/2026.07-02`. Zwei davon sind im
Repository, beide aufgeräumt: Inkscape-Ballast entfernt, `viewBox` ergänzt
(fehlte — die Maße standen in mm, ohne `viewBox` skaliert nichts), Titel für
Vorleser gesetzt.

- **`assets/ktc-logo-rahmen.svg`** (aus `KTC_LOGO_2026-10-white.svg`) — weißer
  Grund, grüner Rahmen, quadratisch. **Das gehört in die Kopfzeile**, 40 × 40 px.
- **`assets/ktc-logo-bild-2026.svg`** (aus `KTC_LOGO_2026-10-trans_no frame.svg`) —
  teildurchlässiger Grund (`opacity:0.35`), kein Rahmen. **Das gehört auf ein Foto.**
  Es trägt sich selbst, egal wie unruhig das Bild an der Stelle ist.

`ktc-logo.svg` und `ktc-zeichen.svg` sind die Fassung davor — erkennbar am gelben
Punkt im C. Sie werden nicht mehr verwendet.

Der Vereinsname steht in der Kopfzeile **daneben als HTML-Text**, nicht als Teil
des Bildes: so bleibt er in jeder Größe scharf und nimmt auf dunklem Grund die
Textfarbe an.

Das Logo der Kopfzeile liegt **als Datei**, nicht inline: 15 KB in jeder Seite wären
teurer als die eine Anfrage. Fällt sie aus, fehlt das Zeichen und sonst nichts — der
Vereinsname steht daneben als Text und trägt die Marke allein (P6).

## Die Mannschaften einer Saison

`inhalte/mannschaften/<jahr>.json` — eine Datei je Jahr. **Die jüngste gilt**,
die älteren bleiben liegen und sind das Archiv: wer wissen will, wer 2026 in
welcher Liga spielte, findet es dort.

Angelegt wird sie **im April**, sobald der HTV die Gruppeneinteilung
veröffentlicht hat. Darin stehen je Mannschaft Name, Spielgemeinschaft, Stärke,
Spielklasse und die **Gruppennummer** beim HTV — nicht die ganze URL. Die baut
`htv()` in `src/seiten.js` zusammen.

```jsonc
{
  "saison": "2026",
  "wettbewerbe": { "standard": "Medenrunde+2026", "sommer": "HTV-Summer-Mixed+Tour+2026" },
  "erwachsene": [{ "name": "Damen", "sg": "…", "staerke": "6er", "klasse": "…", "gruppe": "10" }],
  "jugend":     [{ "name": "Gemischt U12", …, "wettbewerb": "sommer" }]
}
```

**Neue Saison:** Datei kopieren, Jahreszahl und Gruppennummern anpassen,
`npm run seed`. Die Seite nimmt die neue Datei von allein.

**Die Gruppennummern wechseln jedes Jahr komplett.** Wer sie vergisst, merkt es:
die Links gehen ins Leere. Das ist Absicht — eine Nummer, die stillschweigend
auf die Gruppe des Vorjahres zeigt, wäre schlimmer.

### Verlinkt, nicht abgeschrieben

Spielplan, Tabelle und Ergebnisse stehen beim HTV und sind dort immer aktuell.
Eine Kopie auf dieser Website wäre ab der ersten Verlegung falsch — und jemand
fährt umsonst zur Anlage. Deshalb führt die Spielklasse als Link zur Gruppe.

Technisch geht auch mehr: `htv.liga.nu` liefert UTF-8, erlaubt den Abruf laut
`robots.txt` und hat eine stabile Tabellenstruktur (Datum steht nur in der
ersten Zeile eines Spieltags, die folgenden Begegnungen erben es). Ein Import
der Termine ist also möglich — er braucht dann aber ein sichtbares „Stand: …"
und muss einen Ausfall des Abrufs überleben, ohne die Seite zu beschädigen.

### Die Vereinstermine: im Cockpit gepflegt

Sie liegen in der Tabelle `vereinstermine` (Migration 017), im Speicher gehalten wie der Spielstand
(`src/vereinstermine.js`), gepflegt unter **Cockpit → Termine** (auch die Redaktion darf). `pruefe()` prüft jede
Eingabe (gültiges Datum, Ende nach Beginn, Links nur `/…` oder `https://`). **`inhalte/termine.json` ist nur die
Ausgangslage:** beim ersten Start mit leerer Tabelle wird sie einmal übernommen, danach verhindert die Marke
`vereinstermine_importiert`, dass gelöschte Termine zurückkommen. Wer dort etwas ändert, ändert nur frische
Datenbanken. Eine Änderung leert den Seiten-Cache und liest die Seiten mit Terminen für Lisa neu ein. Ein Server
mit `suchmaschinen: true` und Beispielterminen warnt beim Start.

### Die Terminliste auf `/kalender/`

- **Nach vorn wichtig, nach hinten nicht:** `termine` mit `zuklappen: 'an'` ordnet die
  Monate in `<details>`. Kommend sind die **nächsten zwei Monate mit Terminen** offen,
  spätere stehen zugeklappt mit ihrer Zahl da. Vergangen ist nur offen, was jünger als
  **zwei Wochen** ist — die Route markiert es als `frisch`, der Baustein kennt keine Uhr (P1).
- **Spielwochenenden sind `kompakt`** (`wochenendTermine`): eine Zeile, der Titel ist der
  Link zu den Ergebnissen. Drei Zeilen je Wochenende drückten die Clubtermine aus dem Blick.
- **Keine Suche auf `/kalender/`** — die Filter darüber und Lisa reichen.
- **Demo-Modus verschiebt in Schritten von 52 Wochen**, nicht um Kalenderjahre: sonst
  wird aus dem Spielwochenende Fr–So ein Sa–Mo.

### Das Kalender-Abo

`src/kalender-abo.js` baut drei Zuschnitte, **kein „Alles“** — zweihundert Termine
im Kalender kündigt man nach einer Woche:

| Adresse | Inhalt | ein Termin je |
|---|---|---|
| `/kalender/club.ics` | Vereinstermine (Cockpit → Termine, Tabelle `vereinstermine`) | Termin |
| `/kalender/heimspiele.ics` | Medenspiele auf **unserer** Anlage (ohne Heimspiele einer Partner-SG) | Datum + Anwurfzeit |
| `/kalender/mannschaft/<name>.ics` | eine Mannschaft, Name wie `herren-40-ii` | Begegnung |

- **Immer die echten Termine** (`echterSpielplan()`), nie die im Demo-Modus
  verschobenen. Was einmal in einem fremden Kalender steht, holt niemand zurück.
  Ein Test prüft das in einem eigenen Prozess mit `SPIELPLAN_DEMO=1`.
- **Dauer der Medenspiele:** `facts.kalender.dauer_wettkampf_stunden` (5). Der HTV nennt
  nur den Anfang. Fehlt der Fakt, haben Spiele nur eine Startzeit.
- **Vereinstermine haben keine Standarddauer.** In `termine.json`: nur `datum` =
  ganztägig · `bis` = mehrtägig · `uhrzeit` = nur Start · `uhrzeit` + `ende` = Spanne ·
  `bis` + `uhrzeit` (+ `ende`) = **täglich wiederholt** (Trainingscamp).
- **Ortszeit mit `TZID=Europe/Berlin`**, nicht UTC — sonst springt ein Camp über die
  Zeitumstellung um eine Stunde.
- **Feste ID je Begegnung** (Gruppe, Heim, Gast, Runde — kein Datum): eine Verlegung
  verschiebt den Termin, statt ihn zu verdoppeln. `begegnungsSchluessel` muss gleich
  bleiben wie `spielstand.schluessel` — `kalender-abo.js` darf `spielstand.js` nicht
  importieren, weil es über `seiten.js` am Seed hängt und `db.js` beim Import die
  Datenbank wählt.
- **Erwachsene und Jugend unterschiedlich**, weil die Teams es sind: Erwachsene
  behalten **eine Adresse über die Jahre** (`/kalender/mannschaft/herren-40.ics`, alle
  Saisons — dieselben Leute, das Abo läuft weiter). Die Jugend bekommt **eine je Saison**
  (`/kalender/mannschaft/2026/junioren-u15-ii.ics`) — die Teams setzen sich jedes Jahr neu
  zusammen; ein altes Abo bleibt auf seiner Saison stehen und zeigt nie fremde Kinder.
  Eine **aufgelöste Mannschaft** liefert weiter ihre alten Spiele statt 404, sonst zeigt
  der Kalender des Abonnenten einen Fehler.
- **Abonniert wird über `/kalender/abo/<feed>/`** bzw. das Formular `/kalender/abo/?mannschaft=…&weg=apple|google`:
  Weiterleitung auf `webcal://` oder Google Kalender. Die Links auf den Seiten bleiben
  relativ — beim Domainwechsel muss nichts neu geseedet werden. Android kann `webcal:`
  nicht, deshalb steht überall auch der Google-Weg.
- **Der Baustein `abo`** (`src/blocks/abo.js`) steht auf `/kalender/` unter dem Anker `#abo`,
  der Aufmacher springt mit einem leisen Knopf dorthin. „Deine Mannschaft“ ist die erste
  Karte, die Auswahl kommt aus derselben Jahresdatei wie die Tabellen auf `/mannschaften/`.
  Neue Saison: Datei anlegen, `npm run seed` — Auswahl und Jugend-Adressen stimmen.
- Solange der Zugangsschutz an ist, holt nur Apple Kalender (mit Passwortabfrage)
  die Feeds ab. Wirksam wird das Abo mit dem Livegang.

## Das Cockpit

Der Prüfstein aus Stufe 3: **ein Mensch ohne Entwickler muss neun Dinge können.**
Jedes davon ist in `tests/cockpit.test.js` festgehalten und läuft bei `npm test` mit:

1. eine Seite anlegen · 2. sie ins Menü hängen · 3. ein Bild einsetzen ·
4. veröffentlichen · 5. umbenennen · 6. löschen · 7. eine Anfrage empfangen ·
8. einen Preis ändern · 9. ohne dass etwas kaputtgeht

**Drei Dinge macht der Motor ungefragt**, weil sie sonst vergessen werden:

- **Slug einer veröffentlichten Seite geändert → 301 wird angelegt.** Nicht als Angebot,
  nicht als Häkchen. Sonst bricht jemand einen Link und merkt es in sechs Monaten.
- **Seite gelöscht → das Ziel der Umleitung ist Pflichtangabe**, und der Menüpunkt,
  der darauf zeigte, wird versteckt statt ins Leere zu verlinken.
- **Jede Änderung leert den Render-Cache.** Eine halb gültige Zwischenablage ist
  schlimmer als gar keine.

### Drei Fallen, hier gebaut und gefunden

- **Das Cockpit darf seine eigene `app.js` nicht hinter die Anmeldung stellen.** Ohne sie
  gibt es kein funktionierendes Anmeldeformular, und der Fehler sieht aus, als wäre das
  Passwort falsch. Geschützt ist `/api/`, nicht die Oberfläche.
- **Eine echte Seite schlägt eine alte Umleitung.** Sonst überschattet ein Eintrag aus
  der Altlast eine neu angelegte Seite, die im Cockpit veröffentlicht dasteht und trotzdem
  nicht erreichbar ist. Das Cockpit markiert solche toten Umleitungen.
- **Fakten-Overrides tief zusammenführen, nicht flach.** Bei einem flachen Spread verdeckt
  ein Override den ganzen Ast: wer danach ein neues Feld nur in die Datei schreibt, wundert
  sich, warum es live nicht erscheint. Das ist die Falle aus Abschnitt 3.8 des Dokuments.

### Das Handbuch pflegt sich mit

`admin/handbuch.js` beschreibt zehn Abläufe, im Cockpit lesbar. **Ändert ein Commit einen
Knopf, wird das Handbuch im selben Commit mitgezogen** — eine Anleitung mit falschen
Knopfnamen zerstört das Vertrauen in alle anderen Einträge. Die Fallstricke kommen aus
echten Vorfällen, nicht aus Vermutungen.

## Der Generator (Stufe 4)

Aus Rohmaterial — Notizen, ein Protokoll, drei Sätze nach dem Spieltag — wird ein
Entwurf. Im Cockpit unter **Generator**, oder von der Kommandozeile:

```bash
echo "drei Sätze" | npm run generiere beitrag
npm run generiere standard notizen.txt
```

**Drei Regeln, hart durchgesetzt:**

1. **Der Vertrag.** `validateContent()` prüft das Ergebnis. Fällt es durch, gibt es
   keine Seite — der Fehler kommt an der API, nicht als kaputte Seite.
2. **Die Fakten.** Der Prompt zeigt dem Modell **alle** verfügbaren `{{facts.…}}`-Pfade
   mit ihren Werten. Was nicht in der Liste steht, darf es nicht schreiben — es soll
   es stattdessen unter `hinweise` melden.
3. **Der Status ist `generated`, nie `published`.** Ein Mensch liest, ändert, veröffentlicht.

**Was das Modell bekommt:** das Schema aller erlaubten Bausteine, die Pflichtbausteine
des Seitentyps, `inhalte/stimme.md`, `page-types/<typ>/prompt.md` und `golden.html`
als Beispiel.

### Die Stimme ist die halbe Miete

`inhalte/stimme.md` geht bei jedem Lauf mit. Ohne sie schreibt das Modell
Vereinsprosa von der Stange. Mit ihr entstehen Sätze wie *„Wer bei uns ein Punktspiel
schaut, sitzt nicht auf einer Tribüne, sondern mit einem Kaffee neben Platz eins."*

**Wer sie ändert, ändert den Ton der ganzen Website.**

### Zwei Arten von Zahlen

Die erste Fassung des Prompts sagte „niemals eine Zahl schreiben". Das ist zu absolut
und hätte Spielergebnisse gekostet. Jetzt unterscheidet er:

- **Fakten über den Verein** — Beiträge, Anschrift, Telefonnummern: **nie** selbst
  schreiben, nur `{{facts.…}}`
- **Zahlen aus dem Rohmaterial** — Spielergebnisse, Tabellenplätze: normal ausschreiben,
  genau wie im Rohmaterial, nichts runden

### Der JSON-Parser ist gehärtet

Modelle liefern gelegentlich Text um das JSON herum, Code-Zäune oder ein Komma zu viel.
`holeJson()` versucht eine Kette: direkt → Zäune weg → aus dem Text schneiden → reparieren.

**Der wichtigste Fall ist der unscheinbarste:** `{{facts.…}}` steht in fast jedem
generierten Text. Ein naiver Klammer-Zähler bricht dort ab. Der Parser zählt deshalb
nur Klammern **außerhalb** von Zeichenketten. Neun Tests halten das fest.

## Der Assistent (Stufe 7)

Ein Chat, der **ausschließlich über die eigenen Inhalte** spricht. Unten rechts auf jeder
Seite. Ohne `ANTHROPIC_API_KEY` in `.env` erscheint er gar nicht — die Website bleibt
vollständig bedienbar (P6).

```bash
npm run index     # Suchindex neu bauen (läuft beim Speichern im Cockpit automatisch mit)
```

## Betrieb (Stufe 5)

```bash
npm run umzug     # SQLite → Postgres. ZIEL_DATABASE_URL setzen.
docker build -t ktc-website .
```

- **`Dockerfile`** — zweistufig, läuft als `node`, nicht als root, mit Healthcheck auf `/health`
- **`compose.yaml`** — für Coolify. Echte Werte kommen aus der Coolify-Oberfläche, nie hierher
- **Zugangsschutz:** `USER_NAME` und `USER_PASSWORD` setzen = die ganze Website
  verlangt Name und Passwort (`src/zugang.js`), nur `/health` bleibt offen. Beide
  leer = öffentlich. Siehe `docs/stufe5-oeffentlich.md`.
- **`/app/data` muss ein dauerhaftes Volume sein.** Sonst sind alle hochgeladenen Bilder
  nach dem nächsten Deploy weg und die Seiten zeigen ins Leere.
- **`SIGTERM`** schreibt die gesammelten Aufrufe weg, bevor der Prozess endet
- **Sicherheits-Kopfzeilen** (`src/sicherheit.js`) auf jeder Antwort: CSP ohne fremde
  Server, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; HSTS nur über HTTPS.
  **Inline-Skripte sind nur über ihren Hash erlaubt.** Ein Baustein mit `<script>` meldet
  es unter `skripte` — sonst blockiert der Browser es still, und `tests/sicherheit.test.js`
  schlägt fehl.
- **`trust proxy` steht auf 1** (Traefik vor dem Server). Ohne das sähe der Server jede
  Anfrage von derselben Adresse: die Bremsen für Chat (12 / 10 Min.) und Formular
  (5 / 10 Min., `src/bremse.js`) träfen alle Besucher zugleich, und HSTS käme nie.

**Zwei Fallen, hier gefunden:**

- **`src/db.js` entscheidet beim Importieren**, welche Datenbank läuft. Wer `DATABASE_URL`
  danach setzt, migriert die falsche Datenbank.
- **`COUNT(*)` und `SUM(...)` liefern auf Postgres Text, nicht Zahl.** Jede solche Abfrage
  braucht `Number(...)` um das Ergebnis.

## Die Seite läuft als Testdomain

`config/site.json` trägt `"suchmaschinen": false`. Das wirkt an **drei** Stellen, und
alle drei sind nötig:

- `robots.txt` liefert `Disallow: /`
- `sitemap.xml` gibt 404
- jede Seite trägt `<meta name="robots" content="noindex, nofollow">`

Ein Test hält das fest. **Zwei Domains mit denselben Inhalten konkurrieren im
Suchergebnis, und Google entscheidet, welche es zeigt — nicht du.**

Beim Umzug auf die echte Domain: `domain` ändern **und** `suchmaschinen` auf `true`.
Eines von beidem allein reicht nicht.

## Aufrufe zählen

Datensparsam: **Pfad, Tag, Anzahl. Sonst nichts.** Keine IP, kein Cookie, keine Kennung,
kein fremder Dienst — deshalb braucht es kein Einwilligungsbanner. Gesammelt wird im
Speicher, geschrieben im Minutentakt. Im Cockpit unter **Aufrufe**.

**Keine Vektordatenbank, keine Embeddings.** Bei 67 Stücken dauert eine Suche 1–3 ms;
der Aufruf beim Modell dauert zwei Sekunden. Ein Vektorindex würde genau den Teil
beschleunigen, der nicht der Engpass ist. Die Suche läuft in JavaScript, nicht in SQL —
sonst wüsste sie, welche Datenbank läuft, und genau das verhindert `src/db.js`.

Umgestellt wird jenseits von etwa 50.000 Stücken. Das ist ein Umzug, kein Umbau.

### Was bei der Messung schiefging — und warum es so gebaut ist

Vier Fehler, alle erst beim Ausprobieren mit echten Fragen sichtbar:

1. **Der Assistent indizierte sich selbst.** Seine Begrüßung steht auf jeder Seite und
   passte wortwörtlich zu jeder Frage. → `assistent` und `formular` stehen in `UEBERALL`.
2. **„Bus" fiel aus der Suche.** Der Wortstamm-Schnitt machte daraus „bu", zu kurz,
   verworfen. → Wörter unter sechs Zeichen bleiben unangetastet.
3. **Alle Vorstandsnamen fehlten im Index.** Das Feld `name` stand auf der Ausschlussliste,
   weil Formularfelder auch so heißen. Der Assistent behauptete, es werde keine
   Ansprechperson genannt. → `name` ist keine Ausnahme mehr; `formular` ist ohnehin ganz raus.
4. **Die Wortschatz-Lücke.** Gefragt wurde nach „öffentlichen Verkehrsmitteln", auf der
   Seite steht „Mit Bus und Bahn" — kein gemeinsames Wort. → Die Auswahl läuft auf
   **Seitenebene**: trifft eine Seite, kommen ihre übrigen Stücke mit. Wer nach der Anfahrt
   fragt, will die Seite, nicht einen Absatz daraus.

Dazu zwei Abwägungen, beide gemessen:

- **Beiträge zählen 0,62-fach.** Die 14 Nachrichten verdrängten sonst die fünf Seiten,
  auf denen die Auskünfte stehen.
- **Impressum und Datenschutz sind aus dem Index genommen.** „Personenbezogene Daten"
  passt auf fast jede Frage und beantwortet keine.

### Die Struktur ist der Vorteil

`STICHWORTE` in `src/assistent/zerlegen.js` gibt jeder Bausteinart Suchbegriffe für das,
was sie **ist**: ein `personen`-Baustein ist die Ansprechpartner-Liste, auch wenn die
Wörter „Ansprechpartner" oder „anrufen" nirgends im Text stehen. Das kann ein Scraper
nicht, der nur HTML sieht — und es war der Unterschied zwischen „finde ich nicht" und
„Jugendwart ist Oliver Kaus, erreichbar unter …".

### Die Abnahme

Das Dokument verlangt drei Fragen, deren Antwort auf der Website steht, **und eine, deren
Antwort nicht dort steht.** Die vierte ist die wichtige. Ergebnis: **6 von 6.**
Auf „Wie viel kostet ein Bier im Clubhaus?" antwortet er *„Dazu finde ich keine Angabe —
frag direkt vor Ort nach."*

### Cockpit → Assistent

Index neu bauen, Seiten herausnehmen, und **die Liste der gestellten Fragen**. Fragen ohne
Treffer werden rot markiert: das sind Lücken auf der Website, nicht Fehler des Assistenten.

## Offene Fakten

Stehen in `docs/entscheidungen.md`. Zwei davon sind dringend:

- **Vereinsregister-Nummer und Registergericht fehlen im Impressum.** Bei einem e.V. ist das
  eine Pflichtangabe.
- **Die Facebook- und Instagram-Links der alten Seite sind Theme-Platzhalter** und zeigen auf
  `facebook.com/wordpress`. Echte Adressen oder weglassen.
