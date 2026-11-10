# Betriebshandbuch — Krifteler Tennisclub, Website

**Für wen:** für alle, die diese Website am Laufen halten — heute Werner Schneider, morgen
jemand aus dem Verein. Du musst nicht programmieren können, um den Alltag zu erledigen
(Teil 2) und im Notfall richtig zu handeln (Teil 5). Für alles, was Code betrifft, steht in
Teil 8, wie jemand mit Claude Code weiterarbeitet.

**Stand:** 9.11.2026 (mit Winterrunde 2026/27). Was hier noch nicht stimmt oder fehlt, steht ganz unten (Teil 9) —
nicht versteckt in einer Fußnote.

> **Eine Regel vorweg:** In dieses Dokument gehören **keine Passwörter und Schlüssel**. Sie
> stehen im Passwortmanager des Vereins (Teil 3). Hier steht nur, *wo* etwas liegt und *wer*
> es verwaltet.

---

## 1 · Wie die Website gebaut ist (in einer Minute)

Es gibt kein WordPress und keinen Editor. Die Seiten sind **strukturierte Daten**; ein
Programm macht daraus jedes Mal dasselbe HTML. Daraus folgt, was du wissen musst:

| Was | Wo es liegt | Wer es ändert |
|---|---|---|
| **Programm und Seitenvorlagen** | Code-Repository auf GitHub (`WS63/ktc-website`) | Entwicklung, mit Claude Code |
| **Texte der Seiten, Beiträge, Termine, Fakten (Preise, Adressen, Zeiten), Anfragen** | **Datenbank** (Postgres auf dem Server) | Redaktion und Vorstand im **Cockpit** unter `/admin/` |
| **Hochgeladene Bilder** | Dauerhaftes Volume `/app/data` auf dem Server | Cockpit → Medien |
| **Spielpläne und Ergebnisse** (Sommer und Winterrunde) | Verband (HTV); Kopie in der Datenbank | automatisch; im April (Sommer) und im Herbst (Winter) von Hand die Mannschaften anlegen (Teil 4) |
| **Passwörter, Schlüssel** | Umgebungsvariablen in **Coolify** | wer Coolify verwaltet |

**Die wichtigste Folge:** Was im Cockpit geändert wird, steht nur in der Datenbank — **nicht im
Repository**. Wer die Datenbank verliert, verliert diese Änderungen. Deshalb ist die Sicherung
(Teil 6) kein Zusatz, sondern Pflicht.

**Der Weg einer Programmänderung:** Claude Code auf dem Rechner der Entwicklung → GitHub →
Coolify baut automatisch ein neues Abbild und startet es auf dem Server (VPS bei Ionos).
Die Datenbank-Struktur wird beim Start von selbst angepasst.

---

## 2 · Alltag: was die Redaktion selbst kann

Anmeldung unter `https://<unsere-adresse>/admin/`. Es gibt zwei Rollen:

| Rolle | Passwort in Coolify | Sieht im Cockpit |
|---|---|---|
| **Administrator** | `ADMIN_PASSWORT` | alles: Seiten, Menü, Fakten, Umleitungen, Anfragen, Aufrufe, Assistent |
| **Redaktion** (z. B. Presse) | `REDAKTION_PASSWORD` | Beiträge, Medien, Termine, Ergebnisdienst — kein Löschen von Seiten, keine Fakten, keine Navigation |

Welches Passwort jemand eingibt, bestimmt die Rolle. Eine Schritt-für-Schritt-Anleitung für
jeden Ablauf steht **im Cockpit selbst unter „Handbuch"** (zehn Abläufe: Seite anlegen,
Beitrag veröffentlichen, Bild einsetzen, Preis ändern, Termin eintragen, Anfrage bearbeiten,
umbenennen, löschen u. a.). Dieses Handbuch hier ersetzt es nicht.

**Dinge, die der Motor ungefragt richtig macht:**

- Wer den Adressnamen (Slug) einer veröffentlichten Seite ändert, bekommt automatisch eine
  Weiterleitung von der alten Adresse.
- Beim Löschen einer Seite muss ein Ziel für die Weiterleitung angegeben werden.
- Eine Lücke bei einem Fakt (Preis, Telefonnummer …) erscheint sichtbar als `[…]`. Das ist
  Absicht: lieber eine auffällige Lücke als eine erfundene Zahl. **Tritt `[…]` auf einer
  Seite auf: Cockpit → Fakten → Wert eintragen.**

**Regeln für Inhalte** (stehen auch in `inhalte/stimme.md`):

- Durchgehend **duzen**.
- **Keine Zahl, keinen Preis, keine Adresse und keinen Termin in einen Text tippen**, sondern
  den Fakt benutzen (`{{facts.…}}`) bzw. den Termin im Bereich *Termine* anlegen.
- **Fotos mit erkennbaren Personen nur mit Einverständnis**, bei Kindern der Eltern. Im
  Zweifel ein anderes Bild.
- Jedes Bild braucht einen **Alt-Text**: was zu *sehen* ist, für Menschen mit Vorleser.

---

## 3 · Zugänge und Verantwortliche

**Diese Tabelle ist das Herzstück der Übergabe.** Sie ist heute zum Teil noch leer. Sie wird
vom Vorstand ausgefüllt und gepflegt — *ohne* Passwörter, nur mit Namen und Ort.

| Konto / Zugang | Wofür | Inhaber heute | Vertretung | Zugangsdaten liegen in |
|---|---|---|---|---|
| **Domain** `tennisclub-kriftel.de` (Registrar + DNS) | Adresse der Website, E-Mail | […] | […] | […] |
| **VPS bei Ionos** | der Server, auf dem alles läuft | Werner Schneider | […] | […] |
| **Coolify** (auf dem VPS) | Deploy, Umgebungsvariablen, Datenbank, Sicherung | Werner Schneider | […] | […] |
| **GitHub** `WS63/ktc-website` | der Code, Auslöser für Deploys (Auto-Deploy über die GitHub-App von Coolify, kein Webhook von Hand: jeder Push auf `main` stößt einen Deploy an) | Werner Schneider (privates Konto) | […] | […] |
| **Mail-Postfach** `info@tennisclub-kriftel.de` | Anfragen-Benachrichtigung, Kontakt | […] | […] | […] |
| **Anthropic-Konto / API-Schlüssel** | der Assistent „Lisa", der Generator | Werner Schneider | […] | […] |
| **Passwortmanager des Vereins** | verwahrt alle Zugangsdaten | […] | […] | — |

**Ziel dieser Tabelle:** In jeder Zeile stehen **zwei Personen**, und keine Zeile hängt nur an
einem privaten Konto einer Einzelperson. Solange das nicht stimmt, ist die Übergabe nicht
abgeschlossen (Teil 7).

**Was in Coolify als Umgebungsvariable steht** (die Werte nie in Chats, Mails oder dieses
Dokument kopieren):

| Variable | Zweck |
|---|---|
| `DATABASE_URL` | Verbindung zur Postgres-Datenbank (die *interne* Adresse) |
| `ADMIN_PASSWORT` | Cockpit, Administrator |
| `REDAKTION_PASSWORD` | Cockpit, Redaktion |
| `SESSION_GEHEIMNIS` | signiert die Anmeldungen. Fehlt sie, werden alle bei jedem Neustart abgemeldet |
| `ANTHROPIC_API_KEY` | Assistent und Generator. Fehlt er, verschwindet das Chatfenster — die Website läuft weiter |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_VON`, `MAIL_AN`, `WEBSITE_ADRESSE` | Mail bei neuen Anfragen. `SMTP_HOST` leer = kein Versand |
| `USER_NAME`, `USER_PASSWORD` | Zugangsschutz vor der **ganzen** Website. **Zum Livegang beide löschen** |
| `SPIELPLAN_DEMO` | Demo-Termine in der Vorschau. **Zum Livegang löschen** |
| `HTV_ABRUF` | `1` = der Server holt Ergebnisse selbst beim HTV |

Eine Variable ändern: Coolify → Application → *Environment Variables* → Wert ändern →
**Redeploy** bzw. Neustart. Der Server liest die Werte nur beim Start, bis dahin gilt der alte
Stand. Ein Push auf `main` deployt von selbst; für geänderte Variablen ist ein Redeploy nötig.

---

## 4 · Das Jahr der Website

| Wann | Was | Wer |
|---|---|---|
| **laufend** | Beiträge schreiben, Termine eintragen, Anfragen beantworten | Redaktion |
| **nach jedem Spieltag** | Ergebnisse kommen vom HTV von selbst (8, 16, 24 Stunden nach Spielbeginn). Ein Spielbericht ist ein Beitrag | automatisch / Redaktion |
| **jede Woche** | In den Cockpit-Bereich *Anfragen* schauen. Offene Anfragen abarbeiten (nur mit dem Administrator-Zugang sichtbar) | Vorstand |
| **jeden Monat** | Cockpit → *Assistent*: Fragen **ohne Treffer** sind rot markiert. Das sind Lücken auf der Website — die Antwort fehlt dort | Redaktion |
| **jede Saison, im April** | Neue Mannschaftsliste für den Sommer anlegen (siehe unten) | Technik |
| **jedes Jahr im Herbst** | Winterrunde in die Jahresdatei eintragen (siehe unten), sobald der HTV die Gruppen veröffentlicht hat | Technik |
| **sobald der HTV den Rahmenspielplan veröffentlicht** (meist im Herbst oder Winter) | Die Medenspieltage des nächsten Sommers in `inhalte/rahmenspielplan/<jahr>.json` eintragen; sie stehen dann im Kalender. Im April ersetzt der echte Spielplan sie von selbst | Technik |
| **Ende des Jahres** | Termine fürs nächste Jahr eintragen (Mitgliederversammlung, Putztag, Aktionstage). Preise/Beiträge in den Fakten prüfen | Vorstand |

### Vereinstermine über die Datei einspielen (statt von Hand im Cockpit)

Die Termine liegen im Betrieb in der Datenbank; die Datei `inhalte/termine.json` wird nur beim allerersten Start
gelesen. Kommen viele Termine auf einmal (z. B. das Programm eines Jahres), geht es so:

1. Termine in `inhalte/termine.json` ergänzen, committen, pushen, Deploy abwarten.
2. In Coolify → Application → *Terminal*: `npm run termine-nachtragen -- --trocken` (zeigt, was eingetragen würde),
   dann `npm run termine-nachtragen`.
3. **Anwendung neu starten** (Coolify: *Restart*). Erst dann kennt der Server die neuen Termine.

Das Skript ändert und löscht nichts und überspringt Beispiele, Vergangenes und schon Vorhandenes. Einzelne Termine
trägt man schneller direkt im Cockpit ein (Bereich *Termine*), das wirkt sofort und ohne Neustart.

### Neue Saison im April (heute noch Handarbeit am Code)

Sobald der HTV die Gruppeneinteilung veröffentlicht hat:

1. `inhalte/mannschaften/<vorjahr>.json` kopieren nach `<neues Jahr>.json`; Jahreszahl,
   Mannschaften und **alle Gruppennummern** anpassen (sie wechseln jedes Jahr komplett).
2. `npm run spielplan` — holt die Termine beim HTV und schreibt `inhalte/spielplan/<jahr>.json`.
3. `npm run seed` — übernimmt die neuen Seiten (überspringt Seiten, die im Cockpit geändert wurden).
4. Committen, pushen, Deploy abwarten.
5. **Danach im Cockpit einmal „Jetzt beim Verband nachsehen"** (Bereich *Redaktion*, dauert rund eine Minute).
   Der Server übernimmt die Spieltermine nur beim allerersten Start aus der Datei; neue Spiele kommen mit dem
   nächsten Abruf, spätestens mit dem Gesamtabruf am Montag. Ohne diesen Schritt ist der Kalender bis dahin leer.

**Die Winterrunde** (Oktober bis April, der HTV nennt sie z. B. „Winterrunde 2026/27") steht als Abschnitt
`winter` in der Jahresdatei des Jahres, in dem sie beginnt (2026/27 in `2026.json`). Der Ablauf im Herbst:

1. In der Jahresdatei den Abschnitt `winter` anlegen: `runde` (z. B. `Winter 2026/27`), `wettbewerb` (so, wie er in
   der HTV-Adresse steht, z. B. `Winterrunde+26%2F27`) und die Mannschaften mit Klasse, Stärke und **Gruppennummer**.
   Die Gruppennummern und Adressen liefert der Verband; am einfachsten kommen sie als HTV-Links aus dem Verein.
2. `npm run spielplan`, `npm run seed`, committen, pushen, Deploy abwarten.
3. Im Cockpit **„Jetzt beim Verband nachsehen"** (wie oben, Schritt 5).

Zu wissen: Die Winterrunde wird **in einer Halle** gespielt. Die erstgenannte Mannschaft bleibt „Heim", aber es gibt
keinen Heimvorteil und kein „Heimspiel auf unserer Anlage" (Winterspiele stehen deshalb nicht in `heimspiele.ics`).
Die Dauer im Kalender steht in den Fakten (`dauer_winterrunde_stunden`, derzeit 4). Die Datei für das neue Jahr
**erst anlegen, wenn die Winterrunde durch ist**, sonst holt der Abruf die Winter-Gruppen nicht mehr
(siehe `CLAUDE.md`, Abschnitt „Die Winterrunde").

Das ist heute die größte Lücke für eine Übergabe an Nicht-Entwickler; geplant ist,
Mannschaften im Cockpit pflegbar zu machen (Teil 9).

---

## 5 · Wenn etwas nicht stimmt

**Erste Hilfe bei jedem Problem:** `https://<adresse>/health` im Browser öffnen. Antwortet es
mit `{"status":"ok"}`, läuft der Server, und das Problem liegt im Inhalt oder bei einem
Zusatzdienst. Antwortet es nicht, geht es um Server oder Netz.

### Die Website ist nicht erreichbar

1. `/health` prüfen (siehe oben). Geht auch das nicht: ist die Domain noch gültig, zeigt der
   DNS-Eintrag auf den VPS? (`dig +short <domain>` muss die Adresse des VPS liefern.)
2. Coolify öffnen (Adresse des VPS, Port 8000). Antwortet es nicht: bei Ionos prüfen, ob der VPS
   läuft und die Firewall den Port erlaubt.
3. In Coolify die Anwendung öffnen → *Logs*. Steht dort *„Die Datenbank ist nicht erreichbar"*,
   stimmt `DATABASE_URL` nicht (es muss die **interne** Adresse sein) oder die Datenbank läuft nicht.
4. **Letzter Ausweg:** Anwendung *Restart*. Bleibt es kaputt, der Stand vor der letzten
   Änderung: in Coolify unter *Deployments* eine frühere, grüne Version erneut starten.

### Passwort vergessen oder vermutlich bekannt geworden

Cockpit-Passwort: in Coolify `ADMIN_PASSWORT` (bzw. `REDAKTION_PASSWORD`) ändern, neu starten.
Auch `SESSION_GEHEIMNIS` ändern, damit alte Anmeldungen ungültig werden. Das neue Passwort
**nur** im Passwortmanager notieren.

### Anfragen aus dem Formular kommen nicht per Mail an

Die Anfrage geht **nie verloren**: sie steht immer im Cockpit unter *Anfragen*. Kommt die Mail
nicht, ist `SMTP_*` falsch oder der Mailanbieter lehnt ab. Im Log steht dann
`[FEHLER] Benachrichtigung`. Prüfen mit `npm run mailtest` im Terminal des Containers (Coolify →
Application → *Terminal*). Passwort des Postfachs geändert? Dann auch `SMTP_PASSWORD` ändern.

**Datenschutz:** Die Mail ist eine Kopie im Postfach. Die Löschfrist (12 Monate) gilt dort
ebenfalls, wird aber **nicht automatisch** erzwungen — der Vorstand löscht von Hand.

### Eine Seite zeigt `[…]`

Ein Fakt fehlt. Cockpit → *Fakten* → eintragen. Das ist kein Fehler, sondern der Zweck der Lücke.

### Der Kalender ist leer oder zeigt falsche Spieltermine

- Läuft `HTV_ABRUF=1`? Ohne diese Variable zeigt der Server nur, was in der Datenbank steht.
- Gibt es für die laufende Saison eine Jahresdatei und einen Spielplan (Teil 4)? Fehlen **neue** Spiele
  (z. B. nach dem Eintrag der Winterrunde), im Cockpit „Jetzt beim Verband nachsehen" drücken: der Deploy allein
  füllt eine schon benutzte Datenbank nicht.
- Eine Winterrunden-Begegnung hat im Kalender-Abo **keinen Ort** (gespielt wird in einer Halle, die der HTV in der
  Gruppe nennt). Das ist gewollt, kein Fehler.
- `SPIELPLAN_DEMO` darf auf der Live-Seite **nicht** gesetzt sein: es verschiebt Termine um
  Jahre und zeigt erfundene Daten.

### Im Cockpit wurde etwas Falsches veröffentlicht

Seite im Cockpit öffnen und korrigieren, speichern. Jede Änderung leert den Zwischenspeicher
sofort. Gelöscht heißt weg: eine Seite lässt sich nur aus der **Sicherung** (Teil 6) zurückholen.
Deshalb vor dem Löschen kurz prüfen.

### Ein Bild fehlt (leeres Feld statt Foto)

Bilder im Cockpit hochgeladen liegen auf dem Volume `/app/data`. Ist das Volume nicht (mehr)
eingehängt, sind **alle** hochgeladenen Bilder weg und die Seiten zeigen auf Dateien, die es
nicht gibt. Coolify → Application → *Storage*: Ist ein *Persistent Volume* auf `/app/data`
eingetragen? Ist es leer, muss es aus der Sicherung zurück (Teil 6).

### Die Website ist für Suchmaschinen gesperrt oder falsch freigegeben

`config/site.json` enthält `"suchmaschinen"` (`false` = gesperrt, `true` = frei). Das wirkt an
drei Stellen (robots.txt, sitemap.xml, Meta-Tag). **Auf der echten Domain `true`, auf einer
Testdomain `false`.** Der Server warnt beim Start, wenn er freigegeben ist, aber noch
Beispieltermine im Kalender stehen.

---

## 6 · Sicherung und Wiederherstellung

**Ehrlich: Das ist heute noch nicht eingerichtet und nicht getestet.** Das ist der wichtigste
offene Punkt vor dem Livegang.

### Was gesichert werden muss — zwei Dinge, getrennt

| Was | Enthält | Wie |
|---|---|---|
| **Postgres-Datenbank** | alle Seiten, Beiträge, Termine, Fakten, Menü, Umleitungen, Anfragen, Ergebnisse | Coolify → Datenbank → *Backups* (zeitgesteuert, mit Ziel außerhalb des VPS, z. B. S3-kompatibler Speicher) |
| **Volume `/app/data`** (Uploads) | hochgeladene Bilder | **Coolify sichert das Volume nicht mit.** Eigene Sicherung nötig (Kopie von `/app/data/uploads/` an einen zweiten Ort, mindestens wöchentlich) |

Der **Code** ist durch GitHub gesichert, aber nur, solange das Repository nicht verloren geht
(Teil 7: Kopie/Mirror an einem zweiten Ort).

### Wiederherstellung auf einem neuen Server (Skizze, noch nicht geprobt)

1. Neuen VPS oder Coolify bereitstellen; Postgres 17 anlegen.
2. Anwendung aus dem GitHub-Repository anlegen (Build Pack: Dockerfile, Port 3000); Volume
   auf `/app/data`; **alle Umgebungsvariablen** aus Teil 3 neu eintragen (sie stehen nur in Coolify).
3. Deployen — der Motor legt die Tabellen beim Start selbst an.
4. Datenbank-Sicherung einspielen; Uploads in `/app/data/uploads/` zurückkopieren.
5. DNS auf den neuen Server umstellen.
6. Prüfen (Prüfskript unter „Nach dem Deploy prüfen" in `docs/stufe5-oeffentlich.md`).

**Aufgabe vor dem Livegang:** einmal in einer Wegwerf-Umgebung durchspielen und hier die
Dauer und Stolpersteine eintragen. Eine Sicherung, die nie zurückgespielt wurde, ist eine
Hoffnung, keine Sicherung.

---

## 7 · Übergabe an den Verein, Stück für Stück

Die Reihenfolge ist so gewählt, dass das Risiko schnell sinkt und der Aufwand klein bleibt.

| Stufe | Ergebnis | Erledigt |
|---|---|---|
| **1 · Konten zuordnen** | Tabelle in Teil 3 ist ausgefüllt; jede Zeile hat Inhaber **und** Vertretung; alle Zugangsdaten liegen im Passwortmanager des Vereins | ☐ |
| **2 · Code beim Verein** | Repository liegt in einer **GitHub-Organisation des Vereins** (oder im Konto des Vereins); Entwicklung ist dort Mitglied. Coolify ist an diesen Ort gebunden | ☐ |
| **3 · Sicherung läuft** | Datenbank- und Uploads-Sicherung eingerichtet; einmal zurückgespielt (Teil 6); Kopie des Repositories an zweitem Ort | ☐ |
| **4 · Redaktion eingewiesen** | Mindestens zwei Personen können Beiträge, Termine, Fakten und Anfragen im Cockpit bearbeiten | ☐ |
| **5 · Technische Betreuung** | Eine Person (Technischer Wart oder externer Dienstleister) kennt Teile 5 bis 8 und hat Zugang zu Coolify, VPS und GitHub | ☐ |
| **6 · Vertretung** | Es ist festgelegt, wer außer der Entwicklung deployen, die Seite sperren und aus der Sicherung wiederherstellen darf | ☐ |
| **7 · Rechnungen** | Domain, VPS und Anthropic-Nutzung laufen auf den Verein, nicht auf eine Privatperson | ☐ |

### Was passiert, wenn die Entwicklung ausfällt

- **Die Website läuft weiter.** Der Server braucht keine Entwicklung zum Laufen.
- **Die Redaktion arbeitet weiter** im Cockpit (Beiträge, Termine, Fakten, Anfragen).
- **Nicht möglich** ohne Entwicklung: neue Funktionen, Fehlerbehebung im Code, Sicherheits-
  Updates, die Saison im April (heute noch), Umzüge. Das ist der Grund für Stufe 5 und 6.
- **Gefährlich wird es**, wenn Zugänge nur an einer Person hängen (privates GitHub, privates
  Coolify). Genau das behebt Stufe 1 und 2.

---

## 8 · Weiterentwicklung mit Claude Code (für die technische Betreuung)

Das Projekt ist so gebaut, dass jemand mit Claude Code ohne Vorwissen weiterarbeiten kann:

1. Repository klonen, `npm install`, in `.env.beispiel` nachsehen, welche Werte nötig sind
   (Datei `.env` anlegen, **nie** committen). `npm run dev` startet lokal, `npm test` führt
   die Tests aus (einige hundert; nicht gleichzeitig mit `seed` oder `index`).
2. **`CLAUDE.md`** im Hauptordner lesen. Dort stehen die Regeln, gegen die man nicht
   verstoßen darf (u. a. keine Farbe, Zahl oder Adresse fest in den Code schreiben; nie
   `edited`-Seiten überschreiben), und der Aufbau.
3. Weitere Pflichtlektüre: `ki-native-website-motor.md` (Prinzipien),
   `docs/entscheidungen.md` (Warum so?), `docs/design-prinzipien.md` (Gestaltung),
   `docs/stufe5-oeffentlich.md` (Server und Umzug).
4. **Die Tests sind das Sicherheitsnetz.** Sie halten die Regeln fest (u. a. höchstens ein
   gelber Knopf je Seite, kein ungeprüftes Inline-Skript, Zugangsschutz, Kalender). Eine
   Änderung ist erst fertig, wenn `npm test` grün ist.
5. Änderung → Commit → Push auf `main` → Coolify deployt (Auto-Deploy über Webhook, siehe
   `docs/stufe5-oeffentlich.md`). Migrationen laufen beim Start von selbst.
6. **Nach einem Deploy nicht automatisch nötig:** `npm run seed` (nur wenn Seitentexte im Code
   geändert wurden), `npm run index` (läuft beim Speichern im Cockpit ohnehin mit),
   `npm run struktur` (einmalig, schon erledigt).

**Zwei Fallen, die schon einmal Zeit gekostet haben:**

- `npm run seed` überschreibt **keine** im Cockpit geänderten Seiten (es merkt sich den
  Stand). Mit `-- --force` überschreibt es doch — vorher prüfen, was im Cockpit geändert wurde.
- Auf Postgres liefern `COUNT(*)` und `SUM(...)` Text, nicht Zahlen; und derselbe SQL-Platzhalter
  darf nicht zweimal vorkommen (`$5, $5`). Beides steht in `CLAUDE.md`.

---

## 9 · Was heute noch fehlt (ehrliche Liste, Stand 9.11.2026)

**Vor dem Livegang auf `tennisclub-kriftel.de`:**

- [ ] Konten-Tabelle (Teil 3) ausgefüllt, Vertretungen benannt
- [ ] Repository in der Hand des Vereins (Teil 7, Stufe 2)
- [ ] Datenbank- und Uploads-Sicherung eingerichtet **und einmal zurückgespielt**
- [ ] `USER_NAME`, `USER_PASSWORD` und `SPIELPLAN_DEMO` in Coolify gelöscht; `HTV_ABRUF=1` gesetzt
- [ ] Beispieltermine im Cockpit gelöscht, echte Termine eingetragen (die roten Hinweise im Bereich *Termine* sind weg)
- [ ] SMTP-Zugang für `info@tennisclub-kriftel.de` in Coolify, `npm run mailtest` erfolgreich
- [ ] Impressum: Vereinsregister-Nummer und Registergericht eingetragen (Pflichtangabe beim e. V.)
- [ ] Datenschutzerklärung und Impressum fachlich geprüft; `datenschutz.mail_anbieter` eingetragen
- [ ] `config/site.json`: Domain geändert **und** `suchmaschinen` auf `true`
- [ ] 45 Umleitungen der alten Seite gegen die echten Adressen geprüft
- [ ] Social-Media-Links der alten Seite waren Theme-Platzhalter — echte Adressen oder weglassen

**Für eine echte Übergabe an Nicht-Entwickler:**

- [ ] Mannschaften, Saisonwechsel im April und Winterrunde im Herbst im Cockpit statt am Code (Teil 4)
- [ ] Bilder-Pipeline (`npm run bilder`) läuft nur auf einem Mac (`sips`). Bilder, die im Cockpit
  hochgeladen werden, gehen; die Verarbeitung großer Originale nicht
- [ ] Überwachung: eine automatische Meldung, wenn `/health` ausfällt (z. B. kostenloser
  Prüfdienst, der an eine Vereinsadresse mailt)
- [ ] Einführung für die Redaktion (eine Stunde, anhand des Cockpit-Handbuchs)
- [ ] Offene Sicherheitsmeldung: `npm audit` nennt zwei Schwachstellen in `qs` (Teil von
  Express); bei der nächsten Wartung klären

**Entscheidungen, die beim Verein liegen:** Wer ist Verantwortliche/r für Redaktion, für
Betrieb und für die Technik? Wie lange bleibt die Entwicklung Ansprechpartner? Welches
Wartungsmodell (Technischer Wart im Verein, externer Dienstleister, oder gemischt)?
