-- Die Website in suchbaren Stuecken. Entsteht beim Veroeffentlichen aus den
-- Bausteinen — nicht aus dem fertigen HTML. Der Vorteil: die Struktur ist
-- schon bekannt, jeder Baustein weiss, was er ist.
CREATE TABLE IF NOT EXISTS chunks (
  id           TEXT PRIMARY KEY,
  page_slug    TEXT NOT NULL,
  page_titel   TEXT,
  pfad         TEXT NOT NULL,
  ueberschrift TEXT,
  text         TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS chunks_page ON chunks (page_slug);

-- Wer aus dem Index heraus soll. Vorgabe: alles drin, der Mensch nimmt heraus.
-- Impressum, Datenschutz und Danke-Seiten verwaessern jede Antwort.
ALTER TABLE pages ADD COLUMN chat_excluded INTEGER NOT NULL DEFAULT 0;

-- Was gefragt wurde. Der wertvollste Nebeneffekt des Assistenten: du siehst,
-- was Leute wissen wollen und auf der Website nicht finden.
CREATE TABLE IF NOT EXISTS chat_log (
  id         TEXT PRIMARY KEY,
  frage      TEXT NOT NULL,
  antwort    TEXT,
  quellen    TEXT,
  gefunden   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_log_zeit ON chat_log (created_at);
