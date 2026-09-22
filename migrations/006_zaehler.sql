-- Datensparsame Zaehlung: was wurde wie oft aufgerufen, pro Tag.
-- KEINE IP, kein Cookie, keine Kennung, kein fremder Dienst — nichts, was
-- eine Einwilligung braucht. Nur: Pfad, Tag, Anzahl.
CREATE TABLE IF NOT EXISTS aufrufe (
  pfad    TEXT NOT NULL,
  tag     TEXT NOT NULL,
  anzahl  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (pfad, tag)
);
