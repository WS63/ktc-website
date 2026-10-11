# Stufe 5 — Auf den Server

**Ziel:** `ktc-ai.schneiderwerner-consult.com` · Coolify-Projekt **labor** ·
Ionos-VPS `212.227.246.219`

Die echte Domain `tennisclub-kriftel.de` bleibt vorerst bei WordPress. Diese Seite ist
zum Zeigen und Abnehmen — deshalb ist sie **aus dem Suchindex ausgeschlossen**.

> **Docker Desktop brauchst du nicht.** Weder angemeldet noch überhaupt. Coolify baut das
> Abbild auf dem Server. Das Passwort-Problem blockiert hier nichts.

---

## Was schon bewiesen ist

Lokal durchgetestet, nicht angenommen:

| Geprüft | Ergebnis |
|---|---|
| Alle Migrationen auf Postgres 17 | laufen durch |
| Alle Seiten lesen, alle 31 Umleitungen | 200 / 301 |
| Anlegen, veröffentlichen, umbenennen, löschen | inklusive automatischer 301 |
| Fakt ändern ohne Deploy | wirkt sofort |
| Formular, Assistent, Suchindex | laufen auf Postgres |
| Docker-Abbild (264 MB) | baut, Container meldet `healthy` |
| Bilder aus dem Volume | 200, ein Jahr Cache |
| `SIGTERM` | schreibt offene Zähler weg, bevor er endet |
| 169 Zeilen SQLite → Postgres | vollständig |

---

## Die Testdomain ist gesperrt

In `config/site.json` steht `"suchmaschinen": false`. Das wirkt an drei Stellen:

- **`robots.txt`** liefert `Disallow: /`
- **`sitemap.xml`** gibt 404 — es gibt keine
- **Jede Seite** trägt `<meta name="robots" content="noindex, nofollow">`

Ein Test hält das fest: Solange der Schalter auf `false` steht, darf **keine** Seite für
Google freigegeben sein.

**Warum das wichtig ist:** Zwei Domains mit denselben Inhalten konkurrieren im
Suchergebnis, und Google entscheidet, welche es zeigt — nicht du. Im schlimmsten Fall
rangiert die Testdomain über der echten.

**Zusätzlich empfohlen:** In Coolify unter *Advanced* eine Basic-Auth-Sperre setzen. Dann
kommt auch niemand zufällig auf die Seite, der den Link weitergereicht bekommt.

---

## Die Vorschau hinter Name und Passwort

`suchmaschinen: false` (oben) sagt Google nur „bitte nicht aufnehmen" — es sperrt
niemanden aus. Solange der Verein sich den Entwurf ansehen soll, die Welt aber
nicht, gibt es zusätzlich einen **Zugangsschutz für die ganze Website**:

| Variable | Wert |
|---|---|
| `USER_NAME` | ein Benutzername, den du den Vereinsmitgliedern nennst |
| `USER_PASSWORD` | ein langes Passwort (Passwortmanager) |

In Coolify unter **Application → Environment Variables** eintragen, dann
**Redeploy**. Danach fragt der Browser vor jeder Seite nach Name und Passwort —
auch bei Bildern, Cockpit und Assistent. Nur `/health` bleibt offen, damit
Coolify den Server prüfen kann.

- **Beide leer oder nicht gesetzt = die Website ist öffentlich.** Zum Livegang
  beide Variablen löschen und neu deployen. Das ist der ganze Umzug.
- Das ist **nicht** das Cockpit-Passwort (`ADMIN_PASSWORT`). Wer das Cockpit
  benutzt, meldet sich nach dieser Sperre noch einmal an.
- Der Server meldet beim Start `Zugangsschutz AN` oder, in Produktion ohne die
  Werte, `Zugangsschutz AUS` als Warnung — so sieht man im Log, in welchem
  Zustand er läuft.
- Die Werte stehen **nur** in Coolify, nie im Repository (`compose.yaml` reicht
  sie nur durch).

### Demo-Spieltermine in der Vorschau

Die Saison 2026 ist vorbei, der Kalender blendet Vergangenes aus — bis zum April
zeigte er nur die drei Vereinstermine. Zur Ansicht schiebt eine Variable die
Spieltermine um ganze Jahre nach vorn:

| Variable | Wert |
|---|---|
| `SPIELPLAN_DEMO` | `1` |

In Coolify eintragen, **Redeploy**. Der Kalender weist die Verschiebung selbst
aus („DEMO: … keine echten Termine"), die Startseite zeigt die nächsten drei
Termine daraus. Der Assistent lernt davon nichts: er bekommt immer die echten Daten.

- **Zum Livegang die Variable löschen**, genau wie `USER_NAME` und `USER_PASSWORD`.
- Der Server warnt beim Start, wenn Demo AN und der Zugangsschutz AUS ist —
  dann stünden erfundene Termine öffentlich im Netz.
- Im April: `npm run spielplan` lokal, committen, deployen. Ist der Plan wieder
  aktuell, verschiebt der Demo-Modus von selbst nichts mehr.

### Die Redaktion (zweites Passwort)

Für die Pressewartin und ausgewählte Personen gibt es einen zweiten Zugang zum Cockpit,
der nur **Redaktion, Beiträge und Medien** zeigt — keine Startseite, keine Fakten, keine
Navigation, kein Löschen.

| Variable | Wert |
|---|---|
| `REDAKTION_PASSWORT` | ein eigenes Passwort, nicht dasselbe wie `ADMIN_PASSWORT` |

In Coolify eintragen, **Redeploy**. Angemeldet wird im selben Cockpit-Formular: welches
Passwort jemand eingibt, bestimmt die Rolle. Gesperrt ist es auf dem Server, nicht nur in der
Oberfläche.

### Der Ergebnisdienst beim HTV

| Variable | Wert |
|---|---|
| `HTV_ABRUF` | `1` |

Mit `HTV_ABRUF=1` fragt der Server den Verband selbst nach Ergebnissen: **8, 16 und 24
Stunden nach Spielbeginn und am Folgetag um 14 Uhr**, nur in den Gruppen, in denen noch ein
Ergebnis fehlt, dazu montags ein Gesamtabruf für Verlegungen. Ohne die Variable zeigt der
Server, was in der Datenbank steht. Lokal und in Tests bleibt sie leer.

- Beim allerersten Start füllt sich die Datenbank aus `inhalte/spielplan/<jahr>.json`.
- Im April: neue Mannschaftsliste anlegen (`inhalte/mannschaften/2027.json`), einmal
  `npm run spielplan` (Jahresdatei und Ausgangsbestand), committen, deployen.
- Die Seite `/ergebnisse/` ist öffentlich und zeigt nur Mannschaften und Ergebnisse.

## Schritt 1 — Git

Coolify baut aus einem Repository. Das Projekt ist noch keines.

```bash
cd ~/Code-Repos/ki-native-denken && git init && git add -A
```

**Vor dem ersten Commit prüfen, dass nichts Geheimes mitgeht:**

```bash
git status --short | grep -E '\.env$|^A  data/'
```

Das muss **leer** bleiben. `.env` und `data/` stehen in `.gitignore` — dort liegen
Cockpit-Passwort, API-Schlüssel und Datenbank.

```bash
git commit -m "Krifteler Tennisclub: KI-native Website"
```

Dann auf GitHub oder GitLab schieben. **Privates Repository** — nicht wegen des Codes,
sondern wegen der sieben Telefonnummern in `config/facts.json`.

---

## Schritt 2 — Postgres im Projekt „labor"

Coolify → Projekt **labor** → **+ New** → **Database** → **PostgreSQL 17**

Coolify zeigt danach zwei Verbindungszeichenketten. **Nimm die interne**
(`postgres://postgres:…@<name>:5432/postgres`) — der Motor läuft im selben Docker-Netz,
und die Datenbank muss von außen gar nicht erreichbar sein.

Die öffentliche brauchst du nur einmal, in Schritt 4.

---

## Schritt 3 — Die Anwendung

Coolify → Projekt **labor** → **+ New** → **Application** → dein Repository

- **Build Pack:** Dockerfile
- **Port:** 3000
- **Healthcheck:** `/health` (steckt schon im Dockerfile)

### Umgebungsvariablen — nur hier, nie im Repository

| Name | Wert |
|---|---|
| `DATABASE_URL` | die **interne** Zeichenkette aus Schritt 2 |
| `ADMIN_PASSWORT` | **neu vergeben.** Das lokale ist verbrannt, es stand in einem Chat |
| `SESSION_GEHEIMNIS` | siehe unten |
| `ANTHROPIC_API_KEY` | derselbe wie lokal |
| `NODE_ENV` | `production` |

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Volume — sonst sind alle Bilder nach dem nächsten Deploy weg

Coolify → Storage → **Persistent Volume** → Pfad im Container: `/app/data`

**Das ist die Falle, die jede Zwei-Server-Aufstellung trifft.** Ohne Volume liegt jedes
hochgeladene Bild nur im Container. Beim nächsten Deploy ist es fort, und die Seiten
zeigen auf Dateien, die es nicht mehr gibt.

---

## Schritt 4 — Daten umziehen

Der Container startet mit **leerer Datenbank**. Die 23 Seiten, 14 Beiträge, 31 Umleitungen
und das Menü liegen noch lokal.

1. In Coolify bei der Datenbank **Public Port** einschalten
2. Umziehen:

```bash
ZIEL_DATABASE_URL="<öffentliche Zeichenkette>" npm run umzug
```

3. **Public Port wieder ausschalten.** Eine Datenbank offen im Netz ist ein Risiko ohne
   Gegenwert.

Das Skript ist wiederholbar: Ein zweiter Lauf überschreibt, statt zu verdoppeln.

### Die 13 Bilder

Die kopiert das Skript nicht — sie gehören auf das Volume. **Der schnellste Weg bei
dieser Menge: im Cockpit neu hochladen.** Unter `/admin/#medien`, die Alt-Texte stehen
ohnehin schon in der Datenbank.

Der andere Weg, falls es mehr werden: per `scp` auf den Server, dann im Coolify-Terminal
`docker cp ./uploads/. <container>:/app/data/uploads/`.

---

## Schritt 5 — Domain

1. Beim Anbieter von `schneiderwerner-consult.com` einen **A-Record** anlegen:
   `ktc-ai` → `212.227.246.219`
2. Coolify → Application → **Domains** → `ktc-ai.schneiderwerner-consult.com`

Coolify holt das Let's-Encrypt-Zertifikat selbst, sobald der DNS-Eintrag greift. Das
dauert je nach Anbieter ein paar Minuten bis eine Stunde.

```bash
dig +short ktc-ai.schneiderwerner-consult.com
```

Zeigt das `212.227.246.219`, ist der DNS durch.

---

## Schritt 6 — Nach dem Deploy prüfen

```bash
node -e "
const B='https://ktc-ai.schneiderwerner-consult.com';
(async()=>{
for (const p of ['/','/sport/','/mitglied-werden/','/aktuelles/','/kontakt/','/faq/','/impressum/','/datenschutz/','/robots.txt','/admin/']) {
  const r = await fetch(B+p, {redirect:'manual'});
  console.log(String(r.status).padEnd(4), p);
}
const rb = await (await fetch(B+'/robots.txt')).text();
console.log('robots.txt sperrt:', /Disallow: \//.test(rb) ? 'ja' : 'NEIN — nachsehen!');
console.log('sitemap.xml:', (await fetch(B+'/sitemap.xml')).status, '(soll 404 sein)');
})();"
```

Dazu von Hand:

- **Cockpit** unter `/admin/` — Anmeldung mit dem neuen Passwort
- **Ein Bild** auf der Startseite — lädt es?
- **Der Assistent** — eine Frage stellen
- **Das Formular** auf `/kontakt/` — kommt die Anfrage im Cockpit an?

---

## Auto-Deploy

Coolify → Application → **Webhooks** → beim Git-Dienst eintragen. Danach baut jeder Push
auf `main` neu.

**Migrationen laufen beim Start von allein** — `server.js` ruft `runMigrations()` auf,
bevor der Server horcht. Eine neue `migrations/007_*.sql` ist damit Teil des Deploys.

---

## Später: der Umzug auf die echte Domain

Wenn der Vorstand zustimmt und `tennisclub-kriftel.de` übernommen wird:

1. In `config/site.json`: `domain` auf `https://tennisclub-kriftel.de`,
   **`suchmaschinen` auf `true`**
2. In Coolify die Domain umhängen, DNS umstellen
3. Basic-Auth-Sperre entfernen
4. **Die 31 Umleitungen prüfen** — sie liegen schon in der Datenbank und greifen ab dem
   ersten Aufruf:

```bash
node -e "
const B='https://tennisclub-kriftel.de';
['/team_sport/','/anfahrt/','/blog/','/2026/04/die-plaetze-sind-geoeffnet/'].forEach(p=>
  fetch(B+p,{redirect:'manual'}).then(r=>console.log(r.status,p,'→',r.headers.get('location'))));"
```

**Das ist der Punkt, an dem Neubauten Sichtbarkeit verlieren**, und er wird fast immer
vergessen.

---

## Was offen bleibt

- **Impressum: Registergericht und Registernummer fehlen** und erscheinen sichtbar als
  `[…]`. Bei einem e.V. ist das eine Pflichtangabe. Auf der Testdomain verkraftbar, vor
  dem echten Start nicht. Cockpit → *Fakten*.
- **Social-Media-Links** stehen als leere Werte in den Fakten. Die alten zeigten auf
  `facebook.com/wordpress` — Theme-Platzhalter.
- **Sicherung:** Coolify kann Postgres regelmäßig sichern (Database → Backups). Das
  Volume mit den Bildern sichert es **nicht** mit. Beides einrichten.
- **Port 8000** war von außen nicht erreichbar, als ich es geprüft habe. Falls die
  Coolify-Oberfläche nicht antwortet: Ionos-Firewall prüfen.
