-- Die Vereinstermine, im Cockpit gepflegt. Vorher standen sie in inhalte/termine.json, und nur ein Entwickler konnte
-- sie aendern. Die Datei bleibt die Ausgangslage: beim ersten Start mit leerer Tabelle werden ihre Termine einmal
-- uebernommen (danach merkt sich config_overrides 'vereinstermine_importiert', damit geloeschte Termine nicht
-- wiederkommen). Die Spieltermine des HTV stehen weiter nicht hier.
CREATE TABLE IF NOT EXISTS vereinstermine (
  id           TEXT PRIMARY KEY,
  datum        TEXT NOT NULL,
  bis          TEXT,
  uhrzeit      TEXT,
  ende         TEXT,
  art          TEXT NOT NULL,
  titel        TEXT NOT NULL,
  beschreibung TEXT,
  ort          TEXT,
  mehr         TEXT,
  mehr_label   TEXT,
  beispiel     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS vereinstermine_datum ON vereinstermine (datum);
