# Krifteler Tennisclub — KI-native Website

Diese Website hat kein CMS und keinen Editor. Inhalte sind **strukturierte Daten gegen einen
Vertrag**, das Rendern ist deterministisch. Bevor du hier etwas änderst, lies:

- **`ki-native-website-motor.md`** — die Bauanleitung. Die sieben Prinzipien in Teil I sind
  nicht Zierde, sie sind der Grund, warum das Ergebnis trägt.
- **`docs/entscheidungen.md`** — warum dieses System so gebaut ist und wofür. Kommt eine Frage
  auf, steht die Antwort dort. Steht sie nicht dort, ist das der Moment zu fragen statt zu raten.
- **`docs/vorlage.md`** — die Bestandsaufnahme der alten WordPress-Seite, inklusive der
  Umleitungstabelle alt → neu.

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
- **Akzent `#ffbe00` (Gelb)** hat genau eine Aufgabe: der Knopf „Mitglied werden".
  **Ein gelber Knopf pro Bildschirm, sonst nirgends.** Gelb hat auf Weiß 1,66:1 Kontrast —
  es kann niemals Textfarbe sein, deshalb ist es nur für die eine Fläche reserviert.
- Das Logo bleibt vierfarbig. Es ist die Marke, nicht die Bedienung.

## Bedienung

```bash
npm run dev     # Entwicklung, startet bei Änderungen neu
npm start       # Betrieb
npm test        # 11 Tests: Prinzipien, Sicherheit, Vertrag
npm run seed    # alle Seiten und Beiträge anlegen oder aktualisieren
                # überspringt Seiten mit status 'edited' (P5) — mit -- --force überschreiben
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
assets/              ktc-logo.svg (voll) · ktc-zeichen.svg (Kopfzeile, ohne Wortmarke)
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

**Nie in `data/uploads/` arbeiten.** Was dort liegt, ist erzeugt.

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

`assets/ktc-logo.svg` ist die aufgeräumte Fassung der Vektordatei von 2026-07-02:
Inkscape-Ballast entfernt, `viewBox` ergänzt (fehlte — ohne sie skaliert nichts),
weißes Hintergrund-Rechteck entfernt, Titel für Vorleser gesetzt.

`assets/ktc-zeichen.svg` ist dasselbe ohne die Wortmarke, mit engem `viewBox`.
**Das gehört in die Kopfzeile** — unter 48 px wird die Wortmarke Matsch. Der Vereinsname
steht daneben als HTML-Text, damit er in jeder Größe scharf bleibt und auf dunklem Grund
die Textfarbe annimmt.

Das Zeichen liegt inline im `nav`-Baustein: eine Anfrage weniger, und es kann nicht fehlen,
während die Seite schon steht (P6).

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

`admin/handbuch.js` beschreibt acht Abläufe, im Cockpit lesbar. **Ändert ein Commit einen
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
- **`/app/data` muss ein dauerhaftes Volume sein.** Sonst sind alle hochgeladenen Bilder
  nach dem nächsten Deploy weg und die Seiten zeigen ins Leere.
- **`SIGTERM`** schreibt die gesammelten Aufrufe weg, bevor der Prozess endet

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
