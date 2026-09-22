-- Die Navigation ist Daten, kein Code. Wer das Menue in den Baustein schreibt,
-- hat eine Website, deren Struktur nur ein Entwickler aendern kann.
CREATE TABLE IF NOT EXISTS navigation (
  id        TEXT PRIMARY KEY,
  parent_id TEXT,
  ort       TEXT NOT NULL DEFAULT 'kopf',   -- kopf | fuss
  label     TEXT NOT NULL,
  href      TEXT NOT NULL,
  sort      INTEGER NOT NULL DEFAULT 0,
  visible   INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS navigation_ort ON navigation (ort, sort);

CREATE TABLE IF NOT EXISTS media (
  id         TEXT PRIMARY KEY,
  file_path  TEXT NOT NULL,
  alt        TEXT,
  bytes      INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS redirects (
  from_path  TEXT PRIMARY KEY,
  to_path    TEXT NOT NULL,
  code       INTEGER NOT NULL DEFAULT 301,
  created_at TEXT NOT NULL
);

-- Hier landet die EINE Handlung aus Stufe 0: Mitglied werden.
CREATE TABLE IF NOT EXISTS submissions (
  id         TEXT PRIMARY KEY,
  form       TEXT NOT NULL,
  page_slug  TEXT,
  daten      TEXT NOT NULL,
  gelesen    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS submissions_gelesen ON submissions (gelesen, created_at);

-- Fakten und Farben, die ohne Deploy aenderbar sein muessen.
CREATE TABLE IF NOT EXISTS config_overrides (
  schluessel TEXT PRIMARY KEY,
  wert       TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
