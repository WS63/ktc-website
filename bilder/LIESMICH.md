# Bilder

**Hier liegen die Originale.** Aus ihnen erzeugt `npm run bilder` die web-tauglichen
Fassungen in drei Größen und schreibt `inhalte/bilder.json`. Die Seiten beziehen sich
auf den **Namen**, nie auf einen Dateinamen — deshalb kannst du ein Bild austauschen,
ohne irgendwo eine Adresse nachzuziehen.

## So tauschst du ein Bild

1. Die neue Datei hier ablegen, **unter demselben Namen** wie die alte
2. `npm run bilder`
3. `npm run seed` — die Seiten übernehmen die neuen Adressen

Nie in `data/uploads/` arbeiten. Was dort liegt, ist erzeugt und wird überschrieben.

## Die drei Ordner

| Ordner | Wofür | Lebensdauer | Personen |
|---|---|---|---|
| `anlage/` | Der Ort: Plätze, Clubhaus, Terrasse. Aufmacher der Hauptseiten. | Jahre | möglichst ohne |
| `themen/` | Eyecatcher je Bereich: Wettkampf, Hobby, Jugend, Tennisschule, Minis, Gastronomie | Jahre | gern, aber prüfen |
| `beitraege/` | Ein Bild je Beitrag, zeigt das konkrete Ereignis | einmal | fast immer |

## Was ein gutes Bild ausmacht

- **Querformat.** Hochformat wird in Aufmachern und Karten beschnitten.
- **Mindestens 1600 Pixel breit.** Kleiner wird auf großen Schirmen unscharf.
- **Ruhige rechte oder untere Hälfte** bei Anlagenbildern — dort steht die Schrift.
- **Kein Datum eingebrannt,** keine Wasserzeichen.

## Die Alt-Texte

Stehen in `inhalte/bild-texte.json`, nach Namen. **Ein Bild ohne Alt-Text ist für
einen Vorleser nicht vorhanden** — und der Text beschreibt, was zu sehen ist, nicht
was es bedeutet.

## Persönlichkeitsrechte

**Das entscheidet kein Programm.** Wer auf einem Bild erkennbar ist, muss damit
einverstanden sein — bei Kindern die Eltern. Im Zweifel: ein anderes Bild.
