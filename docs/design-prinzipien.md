# Design-Prinzipien — Krifteler Tennisclub

> Verbindliche Gestaltungsregeln für diese Website. Diese Datei ist eine Anweisungsdatei:
> Sie wird gelesen, bevor UI-Code entsteht, und sie gewinnt, wenn ein Baustein etwas
> anderes macht.
>
> Schwester-Dokumente: `ki-native-website-motor.md` (die Bauanleitung, sieben Prinzipien) ·
> `docs/entscheidungen.md` (warum das System so gebaut ist) · `CLAUDE.md` (die kurze Fassung).
> **Die Werte stehen nicht hier, sondern in `config/theme.json`.** Diese Datei erklärt, was
> sie bedeuten.

---

## 0 · Wie diese Datei zu benutzen ist

**Für Menschen:** Abschnitt 1–4 lesen, danach gezielt nachschlagen.

**Für ein Modell, das hier Code schreibt — verpflichtend:**

1. Kein Wert wird getippt. Jede Farbe, jedes Maß, jede Dauer kommt als CSS-Variable aus
   `config/theme.json`. Ein Hex-Wert in einem Baustein ist ein Fehler, keine Abkürzung.
2. Regeln mit **IMMER** / **NIE** sind nicht verhandelbar. Kollidiert eine mit einem Wunsch:
   nachfragen, nicht still abweichen.
3. Im Zweifel gilt: **hell, ruhig, ein Akzent pro Seite.** Lieber weniger.

Diese Datei beschreibt das **Soll**. Bausteine aus Stufe 1 und 2 weichen an Stellen ab —
Abschnitt 16 führt sie auf. Sie sind *kein* Maßstab.

---

## 1 · Markenkern

Der Krifteler Tennisclub ist ein Verein, keine Marke mit Kampagne. Die Gestaltung trägt drei
Haltungen:

- **Der Platz ist der Held, nicht die Website.** Fotos der Anlage, klare Auskünfte, kurze Wege.
  Kein Dekor ohne Funktion.
- **Eine Handlung zählt.** „Mitglied werden" ist der Grund, warum diese Seite existiert.
  Alles andere ist Auskunft und ordnet sich unter.
- **Freundlich und erwachsen.** Hell, aufgeräumt, viel Luft. Der Verein muss niemanden
  überreden — er muss auffindbar und verständlich sein.

**Persönlichkeit in einem Satz:** hell und ruhig, ein arbeitendes Blau, ein einziges Gelb
für die eine Einladung.

---

## 2 · Logo & Zeichen

- `assets/ktc-logo-bild-2026.svg` — teildurchlässiger Grund, kein Rahmen. **Auf ein Foto.**
- `assets/ktc-logo-rahmen.svg` — weißer Grund, grüner Rahmen, quadratisch. **Das gehört in die
  Kopfzeile**; unter 48 px wird die Wortmarke Matsch. Der Vereinsname steht daneben als
  HTML-Text, damit er in jeder Größe scharf bleibt und auf dunklem Grund die Textfarbe annimmt.
- **Das Logo bleibt vierfarbig.** Es ist die Marke, nicht die Bedienung. **NIE** einfärben,
  verzerren, mit Effekten versehen oder in Code nachbauen.
- Das Zeichen liegt **inline** im `nav`-Baustein: eine Anfrage weniger, und es kann nicht
  fehlen, während die Seite schon steht (P6).
- **Schutzraum:** rundherum mindestens die Höhe des Schlägerkopfs freihalten.
- Die Logofarben sind **keine** UI-Palette. Wer Grün aus dem Logo zieht, um damit eine Fläche
  zu füllen, bringt eine vierte Farbe ins System, die keine Aufgabe hat.

---

## 3 · Farben

### 3.1 Die Palette

Verbindlich sind die Werte in `config/theme.json`. Hier steht, was sie tun.

| Rolle | Token | Wert | Aufgabe |
|---|---|---|---|
| **Signal** | `--signal` | `#0050ff` | Links, Menü, Rahmen, Hinweise, Kartenkanten |
| Signal, gedrückt | `--signal-hover` | `#0000c8` | Hover und aktiver Zustand |
| Signal, gedeckt | `--signal-leise` | `#eaf0ff` | Getönte Fläche hinter Signal-Elementen |
| Signal auf Dunkel | `--signal-hell` | `#5b8cff` | dieselbe Rolle im dunklen Abschnitt |
| **Akzent** | `--handlung` | `#ffbe00` | der Knopf „Mitglied werden"; im Aufmacher auf dunklem Foto zusätzlich Thema, Zahlen und laufender Balken (`--titel-akzent`, gleicher Ton) |
| Akzent, gedrückt | `--handlung-hover` | `#e8ac00` | Hover auf genau diesem Knopf |
| Schrift auf Akzent | `--handlung-text` | `#1e1e18` | dunkel, weil Gelb keine weiße Schrift trägt |
| Text | `--text` | `#1e1e18` | Fließtext, Überschriften |
| Text, leise | `--text-leise` | `#555555` | Sekundärtext, Bildunterschriften, Meta |
| Text, still | `--text-still` | `#8a8a84` | **nur** De-Emphasis — siehe 3.5 |

### 3.2 Signal und Akzent — der Unterschied

- **Signal `#0050ff` macht die Arbeit.** Es markiert, es füllt keine großen Flächen. Ein
  Abschnitt ganz in Blau ist ein Fehler; eine blaue Kante an einer Karte ist richtig.
- **Akzent `#ffbe00` hat zwei Aufgaben:** der Knopf „Mitglied werden" und, im Aufmacher der
  Startseite auf dem dunklen Foto, der Akzent für Thema, Zahlen und laufenden Balken
  (`--titel-akzent` in `config/theme.json`, derselbe Gelbton). **Ein gelber Knopf pro
  Bildschirm, sonst nirgends** — auch „Platz buchen" bekommt ihn nicht. Ein Test hält das fest:
  höchstens ein `.knopf` je Seite.
  *Entschieden am 20.10.2026:* Blau und Grün trugen auf dem dunklen Foto nicht, Weiß allein
  ließ die Zahlen untergehen. Der Akzent gilt nur dort. Die Zahlen sind groß (ab 28 px) und
  tragen einen Schatten; bei neuen Fotos den Kontrast prüfen.
- **Gelb ist nie Textfarbe auf hellem Grund.** Auf Weiß erreicht es 1,66:1. Dort existiert es
  ausschließlich als Fläche mit dunkler Schrift darauf. Als Schrift steht es nur auf dem
  abgedunkelten Foto des Aufmachers. Diese Regel ist nicht Geschmack, sie ist gemessen.
- **Nie zwei volle Flächen Blau und Gelb nebeneinander.** Der Akzent verliert seine Wirkung in
  dem Moment, in dem er Gesellschaft bekommt.

### 3.3 Die Hintergrund-Treppe

Hell ist der Normalfall. Damit Abschnitte sich trotzdem voneinander absetzen, gibt es eine
Treppe statt einer einzigen Fläche:

| Token | Wert | Einsatz |
|---|---|---|
| `--grund` | `#ffffff` | Seitengrund |
| `--flaeche` | `#f5f5f5` | ruhiger Abschnitt (`.section--ruhig`) |
| `--karte` | `#ffffff` | Kartenfläche |
| `--erhoben` | `#ededed` | Eingabefelder, erhöhte Flächen |
| `--ueberfahren` | `#e4e4e4` | Hover-Zustand einer Fläche |
| `--dunkel` / `--dunkel-2` | `#1e1e18` / `#2b2b24` | **die Ausnahme**, siehe Abschnitt 12 |

**Zwei helle Töne wechseln sich ab** — Weiß, dann Ruhig, dann wieder Weiß. Das ist der
Rhythmus der Seite. Trennlinien kommen nur dort dazu, wo zwei gleichartige Abschnitte
aufeinanderstoßen; ein Abschnitt auf ruhiger Fläche trennt sich schon durch seinen Grund.

### 3.4 Die Ampel

Grün, Ocker und Rot sind **reine UI-Zustände**, keine Vereinsfarben. Sie erscheinen im
Cockpit und bei Formular-Rückmeldungen, nicht auf den öffentlichen Seiten als Schmuck.

| Zustand | Fläche / Icon | Text |
|---|---|---|
| gut | `--gut` `#00af00` | `--gut-text` `#006e00` (6,5:1) |
| Achtung | `--achtung` `#e08a00` | `--achtung-text` `#8a5000` (6,5:1) |
| Alarm | `--alarm` `#fa320a` | `--alarm-text` `#b3200a` (6,7:1) |

**Warum zwei Sätze:** Ein Ton kann selten beides. `#fa320a` ist als Fläche kräftig und richtig,
als Text auf Weiß erreicht er nur 3,8:1 und fällt durch. Die `-text`-Fassungen sind gegen Weiß
geprüft. Wer farbigen Text schreibt, nimmt **immer** die `-text`-Fassung — das macht die Regel
mechanisch statt erinnerbar.

**Farbe ist nie alleiniger Bedeutungsträger.** Ein Zustand trägt zusätzlich ein Zeichen
(✓ / ! / ✕) oder Text.

### 3.5 Die leiseste Textstufe ist keine Informationsstufe

`--text-still` erreicht auf Weiß 3,2:1 und liegt damit unter AA. Es ist reserviert für
Platzhalter, Durchgestrichenes und rein dekorative Meta-Zeilen. **Alles, was jemand wissen
muss** — Termine, Adressen, Preise, Hinweise, Fehlertexte — nutzt mindestens `--text-leise`
(7,5:1). Die Treppe verführt dazu, „leise" mit „unwichtig" zu verwechseln.

---

## 4 · Typografie

### 4.1 Schrift

- **Libre Franklin** trägt die ganze Seite — Überschriften, Fließtext, Bedienung.
  Token `--font-sans`. Eine Familie reicht; Hierarchie entsteht durch Größe, Gewicht und Farbe.
- **Monospace** (`--font-mono`) für Technisches: Aktenzeichen, Zeitstempel, Zahlen mit
  technischem Charakter.
- **NIE mehr als diese zwei Familien.**

### 4.2 Die Skala

Diskret. Nur diese Stufen — keine Zwischengrößen, keine krummen Werte.

| Token | px | Einsatz |
|---|---|---|
| `--fs-xs` | 12 | Eyebrows, Badges, Meta, Labels (Versalien) |
| `--fs-sm` | 14 | Sekundär- und Hilfetext, dichte Oberflächen |
| `--fs-md` | 17 | **Fließtext — die Basis** |
| `--fs-lg` | 20 | Lead, große Bedienelemente, kleine Überschrift |
| `--fs-xl` | 24 | H3 |
| `--fs-2xl` | 32 | H2 |
| `--fs-3xl` | 42 | H1 mit fester Größe |
| `--fs-aufmacher` | `clamp(34px, 6vw, 60px)` | **bewusste Ausnahme**: der Aufmacher wächst mit |

- **Fließtext:** `--fs-md`, `line-height` 1.7, Gewicht 400.
- **Überschriften:** Gewicht 500, `line-height` 1.2, `letter-spacing: -.015em`. Auf dieser
  Seite sind Überschriften ruhig, nicht laut — 700 ist dem Aufmacher vorbehalten.
- **Eyebrows / Labels:** `--fs-xs`, Versalien, weites Tracking (`.1em`), Signalfarbe.
- **Lesebreite:** Fließtext bricht bei `--breite-text` (68ch). Längere Zeilen liest niemand.

---

## 5 · Tokens — wo sie herkommen

**Es gibt genau einen Ort: `config/theme.json`.**

`src/blocks/_theme.js` erzeugt daraus den `:root`-Block. Es gibt keine zweite Datei, die
gespiegelt werden müsste, und deshalb auch nichts, was auseinanderlaufen kann. Wer einen neuen
Token braucht, trägt ihn in die JSON ein — die CSS-Variable entsteht von allein, benannt wie
der Schlüssel.

```
theme.json                         erzeugte Variable
  farben.signal            →         --signal
  schriften.sans           →         --font-sans     (einzige Gruppe mit Präfix)
  schriftgroessen.fs-md    →         --fs-md
  masse.raum-3             →         --raum-3
  schatten.schatten-m      →         --schatten-m
  bewegung.t               →         --t
  dunkel-abschnitt.*       →         nicht in :root, sondern in .section--dunkel
```

Schlüssel mit führendem `_` sind Kommentar in der JSON und werden übersprungen. Die Datei
erklärt sich damit selbst, ohne dass aus jedem Hinweis eine CSS-Variable wird.

**Ein Override im Cockpit kippt nur einzelne Blätter, nie ganze Äste** — `src/config.js` führt
Datei und Datenbank tief zusammen. Bei einem flachen Spread verdeckt ein Override den ganzen
Ast, und wer danach ein neues Feld nur in die Datei schreibt, wundert sich, warum es live nicht
erscheint.

---

## 6 · Raum, Raster, Layout

- **Raum-Skala:** ausschließlich `--raum-0` bis `--raum-6` (4 / 8 / 16 / 24 / 40 / 64 / 96).
  Keine krummen Pixelwerte. Vertikale Abstände zwischen Abschnitten großzügig — Luft ist Teil
  der Anmutung.
- **Radius-Skala:** `--r-xs` bis `--r-pill`. Faustregel: Eingabefelder und kleine Elemente
  `--r-sm`/`--r-md`, Karten `--r-lg`, der Knopf `--radius-knopf`. Innerhalb der Seite
  konsistent bleiben.
- **Container:** `--breite` (1120 px), zentriert, seitlich `--raum-3`. Fließtext schmaler:
  `--breite-text`.
- **Raster:** CSS Grid. Übliche Muster `repeat(auto-fit, minmax(240px, 1fr))` für Karten,
  Abstand `--raum-3`.
- **Mobile zuerst**, Bruchstelle bei **640 px**, zweite bei **900 px**. Drei Spalten werden
  unter 900 px zu einer.
- **Inline-Styles sind verboten** — immer Klassen und Tokens.

---

## 7 · Zeichen und Symbole

- Die Seite hat **keinen** eigenen Icon-Satz und braucht keinen. Wo ein Zeichen nötig ist:
  **Inline-SVG, Outline-Stil**, 1.5–2 px Strichstärke, `stroke="currentColor"`, damit es die
  Textfarbe erbt und im dunklen Abschnitt von allein mitkippt.
- **Keine Emojis als Bedienelemente** — nicht in Navigation, Überschriften, Knöpfen. Ein
  Zustandszeichen (✓ / ! / ✕) ist etwas anderes als ein Emoji.
- Rein dekorative Zeichen bekommen `aria-hidden="true"`. Ein Zeichen, das Bedeutung trägt,
  bekommt Text daneben.
- Strichstärke und Größe über die ganze Seite konstant halten. Zeichen sind Beiwerk, nie der
  Held einer Fläche.

---

## 8 · Bauteile

Ein Baustein = Schema + Vorgaben + `render()` + CSS. Das CSS gehört zum Baustein, nicht in eine
Sammeldatei — sonst weiß niemand mehr, welche Regel zu welchem Bauteil gehört.

### 8.1 Knöpfe

- **Echte Bedien-Semantik.** Was wie ein Knopf aussieht, **IST** ein `<button>` (Aktion) oder
  ein `<a>` (Navigation) — **NIE** ein `<span>`/`<div>` mit Knopf-Optik. `cursor: pointer` nur
  auf tatsächlich Bedienbarem.
- **`.knopf` ist die eine Handlung:** Fläche `--handlung`, Schrift `--handlung-text`, Radius
  `--radius-knopf`. **Höchstens einer pro Seite**, durch einen Test abgesichert.
- **`.knopf--leise` ist alles andere:** durchsichtig, Kontur und Schrift in `--signal`.
  Davon dürfen mehrere auf einer Seite stehen.
- **Hover:** `translateY(-1px)` plus Farbwechsel, Dauer `--t-schnell`. Kein Wachsen, kein
  Schlagschatten.
- **Fokus immer sichtbar:** `:focus-visible` mit 2 px Kontur in `--signal` und
  `outline-offset: 3px`. **NIE** `outline: none` ohne Ersatz.

### 8.2 Karten

- Basis: Fläche `--karte`, 1 px Rahmen `--linie`, Radius `--r-lg`, Innenabstand `--raum-3`.
- **Schatten sparsam.** Auf hellem Grund trägt schon der Rahmen; `--schatten-m` bleibt Karten
  vorbehalten, die wirklich über der Seite schweben.
- **Akzentkante:** `border-left: 3px solid var(--signal)` für Listen- und Hinweiskarten.
- **Eine Fläche, eine Klick-Bedeutung.** Entweder die ganze Karte ist der Link **oder** ein
  Knopf darin — nie beides. Sonst weiß niemand, was er trifft.

### 8.3 Eyebrows, Pillen, Badges

- **Pille:** `inline-flex`, Radius `--r-pill`, kleine Schrift, getönte Fläche plus 1 px Rahmen
  in derselben Farbe mit niedriger Deckkraft — etwa `--signal-leise` mit `--signal`-Rahmen.
- **Eyebrow:** Versalien, weites Tracking, `--fs-xs`, Signalfarbe, über der Überschrift.
  Eyebrow → H2 → Einleitungsabsatz, in dieser Reihenfolge, Abstände `--raum-2`.
- **Meta-Pille** (Datum, Version): Monospace, `--text-leise`, sehr zurückhaltend.

### 8.4 Formulare

- Eingabefelder: volle Breite, Fläche `--erhoben`, 1 px Rahmen `--linie`, Radius `--r-md`,
  Innenabstand `12px 16px`, Schrift `--font-sans`, Größe `--fs-md`.
- **Fokus:** Rahmen auf `--linie-aktiv`, sichtbare Kontur bleibt.
- **Label** darüber, klein und in `--text-leise`. **Hinweis** darunter, `--fs-sm`.
  Ein Feld ohne Label ist für einen Vorleser namenlos.
- Fehlertexte in `--alarm-text` **plus** Zeichen oder Klartext — nie Farbe allein.
- Alle Oberflächentexte Deutsch, **durchgehend geduzt** (Abschnitt 14).

### 8.5 Der Assistent — Warten sichtbar machen

Der Assistent braucht zwei Sekunden für eine Antwort. **Zwei Sekunden Stille sind ein Fehler.**
Sobald spürbar gearbeitet wird (ab etwa 0,5 s), zeigt die Oberfläche das — mit atmenden Balken
und wechselnden Wörtern, die sagen, was gerade passiert.

Die Takte stehen als Tokens bereit: `--denk-puls` (Atmung eines Balkens), `--denk-versatz`
(Versatz je Balken, erzeugt das Wandern), `--denk-takt` (Wort-Wechsel), `--denk-wort-ein`
(Einblendung des neuen Worts).

```html
<span class="denkt" role="status" aria-live="polite">
  <span class="denkt__puls" aria-hidden="true"><i></i><i></i><i></i></span>
  <span class="denkt__wort">liest deine Frage</span>
</span>
```
```css
.denkt { display: inline-flex; align-items: center; gap: 12px;
  font-family: var(--font-mono); font-size: var(--fs-sm); color: var(--text-leise); }
.denkt__puls { display: inline-flex; align-items: flex-end; gap: 4px; height: 18px; }
.denkt__puls i { display: block; width: 4px; height: 100%; border-radius: var(--r-pill);
  background: var(--signal); transform-origin: 50% 100%;
  animation: denkt-puls var(--denk-puls) ease-in-out infinite; }
.denkt__puls i:nth-child(2) { animation-delay: var(--denk-versatz); }
.denkt__puls i:nth-child(3) { animation-delay: calc(2 * var(--denk-versatz)); }
.denkt__wort { animation: denkt-wort var(--denk-wort-ein) var(--ease-aus) both; }
@keyframes denkt-puls { 0%, 100% { transform: scaleY(.4); opacity: .45; }
                        50%      { transform: scaleY(1);  opacity: 1; } }
@keyframes denkt-wort { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .denkt__puls i, .denkt__wort { animation: none; } }
```

**Die Balken des Chats sind blau, nicht gelb.** Gelb gehört dem Knopf und dem Aufmacher-Akzent;
ein gelbes Element im Chatfenster nähme dem Knopf die Wirkung. (Der laufende Balken der
Themenleiste im Aufmacher ist gelb: dort ist es der Akzent.)

**Die Wörter sind Tätigkeiten, keine Floskeln:** „liest deine Frage", „sucht auf der Seite",
„gleicht ab", „formuliert" — nie „Lädt …" oder „Bitte warten". Für den Wechsel je Takt einen
**neuen DOM-Knoten** einsetzen, sonst feuert die Einblendung nur beim ersten Mal.

*Stand: die Tokens liegen, das Bauteil ist noch nicht gebaut — Stufe-6-Arbeit.*

### 8.6 Ladeplatzhalter

Ein Platzhalter hat die **Form des kommenden Inhalts** — Zeilen, Bild, Karte —, nicht die eines
grauen Einheitskastens: Fläche `--erhoben`, Radius `--r-xs`, ruhige Atmung der Deckkraft.
Der Platz wird exakt reserviert, damit nichts springt. Blöcke `aria-hidden="true"`, der
umgebende Bereich `aria-busy="true"`.

---

## 9 · Abläufe zeigen

Der Verein erklärt Wege: Mitglied werden, einen Platz buchen, zum Schnuppertraining kommen.
Diese Wege werden **sichtbar**, nicht erzählt.

- **Nummernkreise** für mehrstufige Abläufe: rund, 28–44 px, Ziffer darin. Inaktiv: Fläche
  `--flaeche`, Rahmen `--linie`, Ziffer `--text-leise`. Aktiv: Fläche `--signal`, Ziffer weiß.
  Erledigt: `--signal` mit `✓` statt der Ziffer. Verbindungslinie 1 px in `--linie`, erledigte
  Strecke in `--signal`.
- **Große Nummern (01 · 02 · 03)** für „So läuft das"-Abschnitte: zweistellige Ziffer als
  zurückhaltendes Hintergrundelement der Karte, darunter Titel und zwei Sätze. Drei nebeneinander.
- **Rund bedeutet Ablauf.** Karten und Flächen bleiben rechteckig mit `--r-*`. Kreise werden
  nicht zur Dekoration gestreut.

---

## 10 · Bewegung

- **Dezent und schnell.** Bewegung erklärt einen Zustand, sie unterhält nicht. Dauern aus
  `--t-schnell` / `--t` / `--t-langsam` (150–400 ms).
- **Easing:** `--ease` für Übergänge, `--ease-aus` für Einblendungen.
- **Hover-Lift:** `translateY(-1px)` bis `-2px`, immer mit `transition`. Kein Wachsen.
- **`prefers-reduced-motion: reduce` IMMER respektieren.** Die Regel steht bereits global in
  `_theme.js` — wer eine Animation mit `!important` daran vorbeischreibt, verstößt gegen WCAG.

---

## 11 · Bilder

Die Regeln zu Ordnern, Größen und Prüfsummen-Dateinamen stehen in `CLAUDE.md`. Gestalterisch gilt:

- **Fotos bleiben farbig.** Der Verein zeigt seine Anlage, nicht eine Stimmung.
- **Über jedem Foto, das Text trägt, liegt ein Verlauf.** Ohne ihn ist der Untertitel auf einem
  hellen Bild nicht zu lesen — gemessen an der Terrasse mit den weißen Sonnenschirmen: bei 30 %
  in der Mitte war er weg. Der Aufmacher fährt deshalb bis 88 % am unteren Rand.
- **Jedes inhaltliche Bild hat einen Alt-Text** in `inhalte/bild-texte.json`. Er beschreibt, was
  zu *sehen* ist, nicht was es bedeutet. **Ein Bild ohne Alt-Text ist für einen Vorleser nicht
  vorhanden.**
- **Persönlichkeitsrechte entscheidet kein Programm.** Wer erkennbar ist, muss einverstanden
  sein — bei Kindern die Eltern. Im Zweifel ein anderes Bild.

---

## 12 · Der dunkle Abschnitt — die Ausnahme

Die Seite ist hell. Ein **einzelner** Abschnitt darf dunkel sein, wenn er Kontrast braucht —
eine Fußzeile, ein Aufruf, ein Zitat.

**Der Mechanismus:** `.section--dunkel` setzt **dieselben Variablennamen** neu. `--grund` wird
dunkel, `--text` wird hell, `--signal` wird `#5b8cff`. Kein Baustein weiß davon, kein Baustein
braucht eine Sonderregel — die Tokens kippen, die Bauteile bleiben.

```html
<section class="section section--dunkel"> … </section>
```

- **Warum das Signal kippt:** `#0050ff` erreicht auf `#1e1e18` nur 2,9:1 und fällt durch.
  `#5b8cff` erreicht 5,3:1. Wer die Farbe nicht mitkippt, macht Links unlesbar.
- **Was nicht kippt:** der gelbe Knopf. `#ffbe00` auf Dunkel trägt (10:1) und bleibt, wie er ist.
- **Wer eine zweite Klasse einführt** (`.karte--dunkel`), hat den Mechanismus verfehlt: dann
  kippt nicht mehr das Token, sondern der Baustein, und jeder neue Baustein muss nachziehen.
- **Ein dunkler Abschnitt je Seite.** Sonst wird die Ausnahme zur Regel und die Seite kippt in
  eine Anmutung, die zu diesem Verein nicht passt.
- Ein dunkler Abschnitt trennt sich durch seinen Grund — **keine** zusätzliche Trennlinie.

---

## 13 · Barrierefreiheit

**WCAG 2.1 AA ist Pflicht.** Nicht Kür, nicht später.

- **Kontrast** ≥ 4,5:1 für Text, ≥ 3:1 für Bedienelemente und Grafik.
  Gemessene Werte: Text auf Weiß 16,8:1 · `--text-leise` 7,5:1 · Signal auf Weiß 5,9:1 ·
  Signal auf `--flaeche` 5,4:1 · **Gelb auf Weiß 1,66:1 (fällt durch — nie Text)** ·
  **`--text-still` 3,2:1 (fällt durch — nie Information, siehe 3.5)**.
- **Berührungsziele** ≥ 44 × 44 px.
- **Fokus immer sichtbar.** `:focus-visible`, 2 px Kontur in `--signal`, `outline-offset: 3px`.
- **Semantisches HTML.** Bedienbares ist `<button>` oder `<a>`. `aria-label` an Icon-Knöpfen
  und Formularfeldern ohne sichtbares Label, `aria-hidden` an Dekoration, Sprunglink zum Inhalt.
- **Farbe nie alleiniger Bedeutungsträger.**
- `alt` an jedem inhaltlichen Bild; dekorative Bilder bekommen `alt=""`.
- **Bei jeder neuen Farbkombination wird der Kontrast gerechnet, nicht geschätzt.** Die Werte
  in dieser Datei stammen aus einer Rechnung, nicht aus dem Gefühl.

---

## 14 · Ton und Sprache

- **Durchgehend duzen.** Die alte Seite mischt Sie und Du. Das hört hier auf — in Knöpfen,
  Labels, Platzhaltern, Fehlermeldungen, generierten Texten.
- **Deutsch in der Oberfläche**, Englisch höchstens dort, wo ein Fachwort keine Entsprechung hat.
- **Klar statt Vereinsprosa.** Kurze, konkrete Sätze. Was jemand davon hat, steht vor der
  Mechanik. Der Ton der ganzen Website liegt in `inhalte/stimme.md` — **wer sie ändert, ändert
  alles.**
- **Fehlermeldungen zweistufig:** technisch ins Log, menschlich in die Oberfläche. Nie ein
  Statuscode, nie ein Rohfehler.
- **Eine Lücke, die auffällt, ist besser als eine erfundene Zahl.** Fehlt ein Fakt, erscheint
  sichtbar `[…]`.
- **Knopfbeschriftungen sind Handlungen:** „Mitglied werden", „Zum Kalender", nicht „Mehr" oder
  „Hier klicken".

---

## 15 · Code-Regeln mit Gestaltungsbezug

- **Werte NIE hartkodieren** — immer Tokens aus `config/theme.json`.
- **Keine Inline-Styles** — immer Klassen.
- **Klassennamen deutsch und kebab-case**, BEM-artig: `.hero__titel`, `.knopf--leise`.
- **`!important` verboten.**
- **Nie HTML von einem Modell schreiben lassen.** Ein Modell füllt Felder eines Schemas aus.
  Wer das Modell HTML schreiben lässt, baut KI-first.
- **Das CSS eines Bausteins lebt im Baustein.** Keine Sammeldatei.
- Neue Bauteile am nächstgelegenen bestehenden orientieren, bestehende Muster fortführen statt
  neu erfinden.

---

## 16 · Bekannte Abweichungen

Ehrlich aufgeführt, damit niemand sie für den Maßstab hält:

- **Die Schriftgrößen der Bausteine aus Stufe 1 und 2 folgen der Skala noch nicht.** Im Bestand
  stehen 12, 13, 14, 15, 16, 17, 18, 19, 20 und 21 px nebeneinander — 15 px allein fünfzehnmal.
  Die Skala aus 4.2 ist das Soll; angeglichen wird beim nächsten Anfassen eines Bausteins, nicht
  in einem Rutsch.
- **Übergangsdauern stehen teils hart im CSS** (`.12s ease` statt `--t-schnell var(--ease)`).
  Gleiches Vorgehen.
- **`--radius-knopf: 26px` steht neben der Radius-Skala.** Der Wert stammt aus Stufe 1 und
  wirkt bei der Knopfhöhe wie `--r-pill`. Er bleibt, bis jemand den Knopf ohnehin anfasst.
- Wo Bestand und diese Datei kollidieren: **diese Datei gewinnt.**

---

## 17 · Wo was liegt

| Datei | Rolle |
|---|---|
| `config/theme.json` | **die Werte** — Farben, Maße, Schrift, Schatten, Bewegung |
| `src/blocks/_theme.js` | erzeugt daraus den `:root`-Block und die Grundregeln |
| `docs/design-prinzipien.md` | **diese Datei** — was die Werte bedeuten |
| `src/blocks/*.js` | je ein Bauteil mit eigenem CSS |
| `page-types/home/golden.html` | die Goldreferenz — jedes Generator-Ergebnis wird daran abgenommen |
| `probe/` | die Probeseite, in der die Signalfarbe entschieden wurde |
| `inhalte/stimme.md` | der Ton aller Texte |

---

## 18 · Schnell-Checkliste

**SO**
- Heller Grund, zwei helle Töne im Wechsel, viel Luft.
- Jeder Wert aus `config/theme.json`. Raum in 4er-Schritten, Schriftgrößen aus der Skala.
- **Ein gelber Knopf pro Seite.** Alles andere `.knopf--leise` oder die Pille. Gelb als Akzent
  nur im Aufmacher auf dem dunklen Foto (Thema, Zahlen, laufender Balken).
- Blau markiert, es füllt nicht.
- Farbigen Text nur über die geprüften `-text`-Fassungen.
- Höchstens ein dunkler Abschnitt, und der kippt die Tokens, nicht die Bausteine.
- Abläufe als Nummernkreise oder `01 · 02 · 03` zeigen.
- Wartezeiten des Assistenten sichtbar machen — nie stumm laden.
- `:focus-visible`, Kontrast gerechnet, `prefers-reduced-motion`, 44-px-Ziele.
- Durchgehend duzen.

**NICHT SO**
- Farben hartkodieren · Inline-Styles · `!important`.
- Gelb als Textfarbe auf hellem Grund · ein zweiter gelber Knopf · Gelb außerhalb des Aufmachers
  als Akzent · Gelb und Blau als zwei volle Flächen.
- Blau als große Fläche · Logofarben als UI-Palette.
- `<span>`/`<div>` als Knopf · Karte **und** innenliegender Knopf gleichzeitig klickbar.
- `--text-still` für etwas, das jemand wissen muss.
- Eine zweite Klasse für den dunklen Abschnitt.
- Mehr als zwei Schriftfamilien · krumme Schriftgrößen.
- Emojis als Bedienelemente.
- Animation ohne `reduced-motion`-Ausweg · `outline: none` ohne Ersatz.
- Zahlen, Preise, Adressen in einen Seitentext tippen — die stehen in `config/facts.json`.

---

*Lebendes Dokument. Kollidiert eine Regel mit einem Wunsch: kurz nachfragen statt still abweichen.*
