# Die Vorlage — Bestandsaufnahme

**Quelle:** https://ktc-test.wdwoffice.net/ (WordPress, Theme Twenty Seventeen, eigene Seite)
**Rechtlich:** eigene Website → Texte, Fotos und Logo dürfen vollständig übernommen werden.
**Gelesen am:** 2026-09-21

---

## 1 · Seiten (19 Seiten + 16 Beiträge)

| # | URL | Zweck | Vorschlag |
|---|---|---|---|
| 1 | `/` | Startseite: Club, Sport, Mitglied werden, Aktuelles — alles auf einer Seite | **BEHALTEN** |
| 2 | `/aktuelles/` | News-Übersicht | **BEHALTEN** (wird P3-Abfrage, keine gepflegte Liste) |
| 3 | `/startseite-2/der-vorstand/` | Ansprechpartner, 7 Vorstandsmitglieder | **BEHALTEN** als `/kontakt/` |
| 4 | `/faq/` | Häufige Fragen | **BEHALTEN** |
| 5 | `/impressum/` | Pflichtseite | **BEHALTEN** (Pflicht, zählt nicht zu den fünf) |
| 6 | `/datenschutz/` | Pflichtseite | **BEHALTEN** (Pflicht, zählt nicht zu den fünf) |
| 7 | `/anfahrt/` | Auto + ÖPNV | **ZUSAMMENLEGEN** → Abschnitt auf `/kontakt/` |
| 8 | `/team_sport/` | Wettkampfsport | **ZUSAMMENLEGEN** → Abschnitt auf einer Seite `/sport/` |
| 9 | `/hobby-und-freizeit-spieler/` | Hobbybereich | **ZUSAMMENLEGEN** → `/sport/` |
| 10 | `/startseite-2/jugend/` | Jugend | **ZUSAMMENLEGEN** → `/sport/` |
| 11 | `/tennisschule/` | Tennisschule Kaus | **ZUSAMMENLEGEN** → `/sport/` |
| 12 | `/tennis-fuer-minis/` | Minis | **ZUSAMMENLEGEN** → `/sport/` |
| 13 | `/trainer/` | Trainerteam | **ZUSAMMENLEGEN** → `/sport/` |
| 14 | `/startseite-2/startseite-3/` | Gastronomie | **BEHALTEN?** — kryptische URL, Inhalt prüfen |
| 15 | `/sponsoren/` | Sponsoren | **SPÄTER** — nicht im Start-Set |
| 16 | `/service/` | unklar | **STREICHEN?** — Zweck prüfen |
| 17 | `/social-media/` | Social-Links | **STREICHEN** → gehört in den Footer, keine eigene Seite |
| 18 | `/blog/` | Doppelt zu `/aktuelles/` | **STREICHEN** |
| 19 | `/startseite-2/startseiite/` | Tippfehler-URL, Karteileiche | **STREICHEN** |

**Beiträge:** 16, davon 2 Tests (`dies-ist-ein-test`, `test`) → nicht übernehmen. 14 echte Beiträge wandern mit.

### Vorschlag: die fünf Seiten zum Start
`/` (Start) · `/sport/` · `/mitglied-werden/` · `/aktuelles/` · `/kontakt/`
Dazu Pflicht: `/impressum/`, `/datenschutz/`. Und pro Beitrag eine Detailseite.

**Das ist die Halbierung:** aus 19 gewachsenen Seiten werden 5 + 2 Pflichtseiten. Sieben Unterseiten zum Thema Sport werden zu einer Seite mit Abschnitten — denn heute muss man raten, hinter welchem Menüpunkt das Jugendtraining steckt.

---

## 2 · Die eine Handlung

Die Vorlage hat **drei konkurrierende Handlungen**:

1. **„PLATZ BUCHEN"** — auffälligster Knopf, oben rechts im Menü, führt zu `tennisclub-kriftel.ebusy.de`. Richtet sich an **bestehende Mitglieder**.
2. **„Mitglied werden / Anmelden"** — großer Abschnitt auf der Startseite mit Beitragstabelle, führt ebenfalls zu eBuSy. Richtet sich an **Neue**.
3. **„Aktuelles / WhatsApp-Kanal / Kalender"** — Bindung bestehender Mitglieder.

**Vorschlag:** Die eine Handlung ist **Mitglied werden**. Begründung: „Platz buchen" brauchen nur Leute, die den Weg ohnehin kennen und die eBuSy-App auf dem Telefon haben — dafür reicht ein ruhiger Link in der Kopfzeile. Eine Website arbeitet für die, die noch nicht dabei sind.

→ **Entscheidung nötig.**

---

## 3 · Gestaltung (aus dem ausgelieferten CSS und dem Logo, nicht geschätzt)

### Das Logo (exakt dekodiert aus `KTC_LOGO_1200x1200.png`, 1000×1000)

| Rolle im Logo | Wert | Flächenanteil | Kontrast auf Weiß |
|---|---|---|---|
| Blau (Buchstabe K) | `#0050ff` | 8,1 % | **5,85 : 1** ✓ Fließtext |
| Dunkelblau (Schattierung K) | `#0000c8` | 2,2 % | 11,45 : 1 ✓ |
| Grün (Buchstabe T) | `#00af00` | 6,7 % | 2,94 : 1 ✗ nur Fläche |
| Dunkelgrün (Überlappung) | `#008c00` | 5,0 % | 4,42 : 1 ~ |
| Tiefgrün (Rahmen) | `#006e00` | 1,9 % | **6,50 : 1** ✓ Fließtext |
| Gelb (Buchstabe C) | `#ffbe00` | 6,4 % | **1,66 : 1** ✗✗ nie Text |
| Rot (Akzent im C) | `#fa320a` | 1,6 % | 3,80 : 1 ~ nur große Schrift |
| Schwarz (Wortmarke) | `#1e1e18` | 2,9 % | 16,75 : 1 ✓ |
| Weiß (Grund) | `#ffffff` | 63,1 % | — |

*Schwelle: 4,5:1 Fließtext · 3,0:1 große Schrift und Bedienelemente.*

### Die Website heute

| Rolle | Wert | Fundstelle |
|---|---|---|
| Grund | `#FFFFFF` | Theme-Grundfläche |
| Text | `#1a1a1a` | Fließtext, Buttons |
| Signal | `#FCB900` | `.ktc-inline-button`, `.ktc-heading-link` |
| Signal hover | `#d49d00` | dieselben |
| Grautöne | `#f5f5f5` · `#e0e0e0` · `#555555` | Flächen, Linien, Sekundärtext |
| eBuSy-Icon | `#6ab04c` | `li.menu-item-ebusy > a::before` |

**Schrift:** Libre Franklin (Twenty Seventeen), Überschriften und Fließtext dieselbe.

### Befund

1. **Das Website-Gelb ist korrekt abgeleitet.** `#FCB900` ≈ Logo-Gelb `#ffbe00`. Das war kein Zufallsgriff.
2. **`#6ab04c` gehört nicht zum Logo.** Eine fünfte Farbe, eingeschlichen. Das Logo-Grün ist `#00af00` bzw. `#006e00`.
3. **Das Gelb kann kein Signal im Sinne von P1 sein.** 1,66:1 auf Weiß — es ist als Textfarbe unbrauchbar und *muss* deshalb Fläche werden. „Signal markiert, es füllt nicht" ist mit Gelb auf Weiß nicht erfüllbar.
4. **Das Logo hat vier Signale.** Es darf vierfarbig bleiben — es ist fröhlich und passt zu einem Verein mit 120 Kindern. Die *Website* muss sich für eines entscheiden.

### Vorschlag

- **Signal: Blau `#0050ff`** — die dominanteste Logofarbe, 5,85:1 auf Weiß. Taugt für Links, Rahmen, Unterstreichungen, Bedienelemente. Als Text lesbar, ohne Fläche werden zu müssen.
- **Akzent: Gelb `#ffbe00`** — behält genau eine Aufgabe: die Fläche der *einen Handlung*. Genau ein gelber Knopf pro Bildschirm, sonst nirgends.
- **Tiefgrün `#006e00`** für Zustände (Platz offen, Termin bestätigt), Rot `#fa320a` nur für Warnungen.
- **`#6ab04c` entfällt ersatzlos.**

Alternative, falls Blau zu technisch wirkt: **Tiefgrün `#006e00`** als Signal (6,50:1, Rahmenfarbe des Logos, Assoziation Verein und Platz), Blau wird dann Akzent.

**Beides wird in Stufe 1 als Probeseite unter `/probe/` gezeigt, nicht beschrieben.**

**Logo:** liegt nur als PNG vor (1200×1200). Als SVG wäre es in jeder Größe scharf — bei den harten Kanten und Kreissegmenten ist es gut nachzeichenbar.

## 4 · Tonfall

Siezt durchgehend in den Hauptseiten, duzt in den neueren Abschnitten („Hier findest Du") — **inkonsistent, das ist eine Entscheidung, die fällt**. Warm, vereinsnah, viele konkrete Zahlen (7 Sandplätze, 500 Mitglieder, 120 Jugendliche, 20+ Mannschaften). Selbstbeschreibung: *„sportlich, herzlich, familiär."*

---

## 5 · Fakten → `config/facts.json` (P2)

Verein: Krifteler Tennisclub e.V. · Schmelzweg, 65830 Kriftel · info@tennisclub-kriftel.de
1. Vorsitzender: Oliver Kinzel, +49 173 5764855
2. Vorsitzende: Anne Yasemin Leupold, +49 175 5984214
Sportwart: Markus Messerschmitt, +49 160 8323193 · sport@
Jugendwart: Oliver Kaus, +49 172 6750873 · jugend@
Kassenwart: Tobias Klug, +49 162 2835986
Technischer Wart: Christian Schwarzer, +49 179 4365454 · technik@
Schriftführerin/Presse: Ute Walter, +49 178 6989000 · presse@

**Beiträge (Kalenderjahr):** Aktiv 290 € · Aktiv 2. Mitglied (Ehe-/Lebenspartner) 225 € · Aktiv in Ausbildung 174 € · Jugend (bis 18) 135 € · Jugend als Familienmitglied 95 € · Passiv 60 € · **Neumitglieder Erwachsene 1. Jahr 225 €**
Keine Aufnahmegebühr, keine Arbeitsstunden. Kündigungsfrist 30.11. Halber Beitrag ab 01.07.
**Gastspiel:** 15,00 € pro Gast, max. 2 im Doppel. Einzel 60 Min, Doppel 90 Min.
**Spind:** 30 € pro Jahr.
**Anlage:** 7 Sandplätze, über 500 Mitglieder, davon ca. 120 Kinder/Jugendliche, 20+ Mannschaften.
**Buchung/Mitgliederverwaltung:** https://tennisclub-kriftel.ebusy.de

**Offen / zu prüfen:**
- Vollständige Anschrift mit Hausnummer (auf der Vorlage nur „Schmelzweg in Kriftel")
- Vereinsregister-Nummer und Registergericht (fehlt im Impressum — **bei einem e.V. ist das Pflicht**)
- Die Facebook- und Instagram-Links zeigen auf `facebook.com/wordpress` und einen WordCamp-Hashtag — **Platzhalter aus dem Theme, keine echten Konten**
- Öffnungszeiten Anlage und Clubrestaurant

---

## 6 · Umleitungen alt → neu (301, Stufe 5)

Nur relevant, wenn die neue Website unter derselben Domain die alte ersetzt.

| alt | neu |
|---|---|
| `/team_sport/`, `/hobby-und-freizeit-spieler/`, `/startseite-2/jugend/`, `/tennisschule/`, `/tennis-fuer-minis/`, `/trainer/` | `/sport/` |
| `/startseite-2/der-vorstand/`, `/anfahrt/` | `/kontakt/` |
| `/blog/`, `/startseite-2/startseiite/` | `/aktuelles/` |
| `/social-media/` | `/` |
| `/startseite-2/startseite-3/` | `/gastronomie/` |
| `/JJJJ/MM/slug/` (Beiträge) | `/aktuelles/slug/` |
| `/category/<x>/` | `/aktuelles/?thema=<x>` |
