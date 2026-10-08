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
  Modell: claude-sonnet-5 (ANTHROPIC_API_KEY in .env). Umstellen: CHAT_MODELL in .env.
  Ohne Schlüssel erscheint kein Chatfenster — die Website läuft vollständig weiter (P6).

**Offene Punkte (Design/Inhalt):**
  - Mannschaftstabelle auf /mannschaften/: die Links der alten WordPress-Seite fehlen.
    Dort führten Einträge zu Medenspieltagen und Gruppeneinteilungen beim HTV.
    Beim Übernehmen in den `tabelle`-Baustein sind sie verlorengegangen — der
    Baustein kennt nur Text je Zelle, keine Ziele. Braucht eine Schema-Erweiterung.
  - /mannschaften/ hängt bewusst nicht im Menü, nur über /sport/ erreichbar.

**Offene Fakten:**
  - Vereinsregister-Nummer und Registergericht — **bei einem e.V. Pflichtangabe im Impressum, fehlt heute**
  - Echte Facebook- und Instagram-Adressen — heute stehen Theme-Platzhalter drin
  - Öffnungszeiten Anlage und Clubrestaurant

  - ERLEDIGT: Logo als Vektordatei vorhanden, aufgeräumt unter assets/
  - ERLEDIGT: Hausnummer gefunden (Schmelzweg 6), stand auf der Minis-Seite
