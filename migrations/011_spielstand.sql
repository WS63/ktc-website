-- Der Spielstand: alle Begegnungen der KTC-Mannschaften, vom HTV geholt.
--
-- Vorher lag er als Datei im Abbild (inhalte/spielplan/<jahr>.json). Auf dem
-- Server ueberschreibt jeder Deploy so eine Datei, und der Server kann sie nicht
-- selbst aktualisieren. Jetzt liegt er in der Datenbank; die Datei bleibt als
-- Jahresarchiv und als Ausgangsbestand beim allerersten Start.
CREATE TABLE IF NOT EXISTS spiele (
  id              TEXT PRIMARY KEY,           -- saison|gruppe|heim|gast|durchlauf
  saison          TEXT NOT NULL,
  gruppe          TEXT NOT NULL,
  mannschaft      TEXT NOT NULL,
  sg              TEXT,
  datum           TEXT NOT NULL,              -- JJJJ-MM-TT, Ortszeit; leer = noch ohne Termin
  uhrzeit         TEXT,
  heim            TEXT NOT NULL,
  gast            TEXT NOT NULL,
  zuhause         INTEGER NOT NULL DEFAULT 0,
  gegner          TEXT,
  matchpunkte     TEXT,
  gespielt        INTEGER NOT NULL DEFAULT 0,
  bericht         TEXT,
  gemeldet_um     TEXT,                       -- wann wir das Ergebnis ZUM ERSTEN MAL sahen (UTC)
  geprueft_um     TEXT,
  stufe           INTEGER NOT NULL DEFAULT 0, -- wie viele der vier Abfragen schon liefen
  aktualisiert_um TEXT
);
CREATE INDEX IF NOT EXISTS spiele_datum ON spiele (datum);

-- Ein Eintrag je Abruf beim HTV: wann, warum, was dabei herauskam.
CREATE TABLE IF NOT EXISTS abrufe (
  id      TEXT PRIMARY KEY,
  zeit    TEXT NOT NULL,                      -- UTC
  art     TEXT NOT NULL,                      -- zeitplan | gesamt | manuell
  gruppen INTEGER,
  neu     INTEGER,                            -- neu gemeldete Ergebnisse
  fehler  INTEGER,
  meldung TEXT
);
