# Entscheidungen

**Weiche 1 — was bauen wir:** NACHBAU von https://ktc-test.wdwoffice.net/ (eigene Website, WordPress, Theme Twenty Seventeen)
**Weiche 2 — worauf läuft es:** C — Ionos VPS mit Coolify (212.227.246.219), Projekt "labor".
**Zieldomain:** ktc-ai.schneiderwerner-consult.com (Testdomain, aus dem Suchindex gesperrt).
  Die echte Domain tennisclub-kriftel.de bleibt vorerst bei WordPress.
  Umschalten: config/site.json → domain und suchmaschinen:true.
  · Gebaut wird zunächst auf Weg A (SQLite, localhost), Umzug in Stufe 5 auf Coolify + Postgres.
  · Offen: Port 8000 war von außen nicht erreichbar (Timeout). Vor dem Deploy prüfen.

**Art der Website:** Verein (Tennisclub, e.V.)
**Leser:** Jemand aus Kriftel oder Hofheim, der Tennis spielen möchte und noch nicht Mitglied ist —
  Wiedereinsteigerin Ende 30, oder Eltern eines 9-jährigen Kindes.
**Die eine Handlung:** **Mitglied werden.**
  „Platz buchen" (eBuSy) bleibt erreichbar, bekommt aber keinen auffälligen Knopf — wer bucht, ist längst dabei.
**Seiten zum Start:** `/` · `/sport/` · `/mitglied-werden/` · `/aktuelles/` · `/kontakt/`
  Dazu Pflicht: `/impressum/`, `/datenschutz/`. Plus eine Detailseite je Beitrag.
  Aus 19 gewachsenen Seiten werden 5 — sieben Sport-Unterseiten werden Abschnitte auf einer Seite.

**Designrichtung:** übernommen von der Vorlage, aber auf ein Signal zurückgeführt.
**Abweichung von der Vorlage:**
  1. Eine Signalfarbe statt vier. Das Logo bleibt vierfarbig, die Bedienung nicht.
  2. Signal markiert, es füllt nicht (P1). Gelb behält genau eine Aufgabe: der Knopf „Mitglied werden".
  3. `#6ab04c` entfällt — gehört nicht zum Logo.
  4. Sieben Sport-Unterseiten werden eine Seite mit Abschnitten.
  5. Logo künftig als SVG statt PNG.

**Farben:**
  Grund `#ffffff` · Text `#1e1e18` · Sekundärtext `#555555` · Linien `#e0e0e0` · Fläche `#f5f5f5`
  **Signal: Blau `#0050ff`** (5,85:1 auf Weiß) · hover `#0000c8` · leise Fläche `#eaf0ff`
  Entschieden an der Probeseite `probe/index.html` am 2026-09-21. Tiefgrün `#006e00` war die Alternative.
  Akzent (die eine Handlung): Gelb `#ffbe00` — nur dort, sonst nirgends.
  Warnung: Rot `#fa320a`.

**Schriften:** Libre Franklin (wie Vorlage), lokal eingebunden statt über Google Fonts.
**Anmutung:** sportlich, herzlich, familiär *(Selbstbeschreibung der Vorlage)*
**Anrede:** **durchgehend duzen.** Die Vorlage mischt Sie und Du — das hört auf.

**Stand der Stufen:**
  0 Gespräch · 0b Vorlage · 1 Motor · 2 Seiten · 3 Cockpit · 7 Assistent — abgeschlossen
  6 Erweitern — teilweise (neue Bausteine, Bilder, mobiles Menü)
  4 Generator — abgeschlossen (Modell: claude-opus-5, Stimme in inhalte/stimme.md)
  5 Öffentlich (Coolify + Postgres) — vorbereitet und geprüft, siehe docs/stufe5-oeffentlich.md
    Postgres 17, Docker-Abbild und Datenumzug sind lokal durchgetestet.
    Offen: Git-Repository anlegen, in Coolify deployen, Domain, Bilder aufs Volume.

**Assistent (Stufe 7):** Volltextsuche in JavaScript, keine Embeddings, keine Vektordatenbank.
  Modell: claude-haiku-5-5 (ANTHROPIC_API_KEY in .env). Umstellen: CHAT_MODELL in .env.
  Ohne Schlüssel erscheint kein Chatfenster — die Website läuft vollständig weiter (P6).

**Datenbank (eingeordnet am 13.11.2026):**
  · **Lokal SQLite** (Datei `data/site.db`), **auf dem VPS Postgres 17** (Coolify, Projekt „labor").
    Nur `src/db.js` kennt den Unterschied; geschaltet wird allein über `DATABASE_URL`.
    Der Umzug war ein Umgebungs-Eintrag, kein Umbau des Codes.
  · **Belegte Gründe** (`ki-native-website-motor.md`, Stufe 0 und Stufe 5; `docs/stufe5-oeffentlich.md`):
    SQLite ist eine Datei auf dem eigenen Rechner, ideal zum Bauen und Zeigen, aber nicht öffentlich.
    Weg B/C (Server, Postgres) ist für eine öffentlich erreichbare Seite mit mehreren Menschen im
    Cockpit gedacht. SQLite sperrt beim Schreiben die ganze Datei. Coolify bringt Postgres als fertige
    Datenbank mit zeitgesteuerter Sicherung (Database → Backups) mit.
  · **Nicht dokumentiert:** eine eigene Abwägung „Postgres statt SQLite auf dem VPS". Postgres stand von
    Anfang an als Ziel fest (Weiche 2 = C), es gab keinen Auslöser wie ein Schreibproblem.
    **Ehrliche Einschätzung:** SQLite im WAL-Modus (so läuft es lokal) würde eine Handvoll Redakteure
    tragen, denn Schreibvorgänge laufen nacheinander und Lesen blockiert nicht. Gleichzeitiges Arbeiten
    im Cockpit ist bei einem Verein deshalb kein zwingender Grund. Für Postgres sprechen vor allem: die
    Daten liegen getrennt vom Anwendungscontainer, die Sicherung mit Zeitplan ist in Coolify eingebaut,
    und es bleibt der Weg offen, falls es einmal mehr wird.
  · **SQLite auf dem VPS wäre möglich.** `/app/data` ist ohnehin ein Volume (Bilder). Die Datei läge
    daneben. Preis: die Sicherung muss man selbst bauen (Coolify sichert Volumes nicht von selbst), und
    die Datei darf nur von einer Instanz beschrieben werden. Beschlossen ist das nicht.
  · **Erinnerung des Betreibers (13.11.2026):** der Grund ist nicht mehr bekannt, vermutet wird
    Leistungsfähigkeit. Belegt ist das nirgends. Bei dieser Datenmenge (beim Umzug 169 Zeilen) ist
    Leistung kein Unterscheidungsmerkmal zwischen SQLite und Postgres.
  · **Wo auf dem VPS was liegt:** (1) im Container: Code, `assets/bilder/`, `config/`, `inhalte/`,
    kommt aus GitHub und wird bei jedem Deploy neu gebaut; (2) im Volume `/app/data`: die Uploads aus
    dem Cockpit, überleben Deploys, stehen nur auf dem VPS; (3) im Postgres-Container mit eigenem
    Speicher: die Datenbank, überlebt Deploys, Sicherung über Coolify. Punkt 2 und 3 stehen nicht in GitHub.
  · **Was in der Datenbank liegt** (Migrationen `001` bis `018`): die Seiten samt Beiträgen
    (`pages`, Inhalt als JSON, mit Status und Seed-Stand), Menü (`navigation`), Umleitungen
    (`redirects`), Fakten, die im Cockpit geändert wurden (`config_overrides`), Vereinstermine
    (`vereinstermine`), Spiele und Abrufe beim HTV (`spiele`, `abrufe`), Formular-Anfragen
    (`submissions`), Suchindex und Fragen an Lisa (`chunks`, `chat_log`), Seitenaufrufe (`aufrufe`) und
    die **Verweise** auf hochgeladene Bilder (`media`: Pfad, Alt-Text, Größe).
  · **Was nicht darin liegt:** die Bilddateien selbst (erzeugte Fassungen im Repository unter
    `assets/bilder/`, Cockpit-Uploads als Dateien unter `data/uploads/` auf dem Volume), das Design
    (`config/theme.json`), die Grundfassung der Fakten (`config/facts.json`), die Mannschaften und der
    Rahmenspielplan (`inhalte/`), die Startinhalte (`src/seiten.js`, per `npm run seed` in die Datenbank
    kopiert) und der Code.
  · **Folge:** Was im Cockpit geändert wird, steht nur in der Datenbank, nicht im Repository.
    Deshalb braucht es zwei Sicherungen: Datenbank und Volume (siehe `docs/betrieb.md`, Teil 6).

**Offene Punkte (Design/Inhalt):**
  - ~~Mannschaftstabelle auf /mannschaften/: die Links zum HTV fehlen.~~ **Erledigt.**
    Der `tabelle`-Baustein nimmt jetzt je Zelle entweder Text oder `{ text, href }`.
    Alle 29 Mannschaften verlinken auf ihre Spielgruppe bei `htv.liga.nu` — dort
    stehen Spielplan, Tabelle und Ergebnisse, immer aktuell.
    **Die Gruppennummern gelten je Saison.** Beim Saisonwechsel ändern sich
    `WETTBEWERB` und jede Nummer in `src/seiten.js`. Das ist Handarbeit einmal
    im Jahr und fällt auf, weil die Links sonst ins Leere gehen.
  - /mannschaften/ hängt bewusst nicht im Menü, nur über /sport/ erreichbar.

**Offene Fakten:**
  - Vereinsregister-Nummer und Registergericht — **bei einem e.V. Pflichtangabe im Impressum, fehlt heute**
  - Echte Facebook- und Instagram-Adressen — heute stehen Theme-Platzhalter drin
  - ERLEDIGT: Öffnungszeiten — die Anlage hat **keine festen Öffnungszeiten**, deshalb gibt es
    keinen Fakt dafür und keine Zeile im Fuß (entschieden 2026-10-18). Die Zeiten des
    Clubrestaurants stehen unter `facts.gastronomie`.

  - ERLEDIGT: Logo als Vektordatei vorhanden, aufgeräumt unter assets/
  - ERLEDIGT: Hausnummer gefunden (Schmelzweg 6), stand auf der Minis-Seite
