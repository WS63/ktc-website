-- Was der Seed zuletzt geschrieben hat (Pruefsumme von Titel, Beschreibung und Inhalt).
-- Weicht der Inhalt einer Seite davon ab, hat jemand sie im Cockpit geaendert, und der
-- naechste Seed laesst sie in Ruhe (P5). Leer = noch nie vom Seed geschrieben bzw. aus der
-- Zeit vor dieser Spalte: dann gilt wie bisher der Seed, und er merkt sich den Stand.
ALTER TABLE pages ADD COLUMN seed_hash TEXT;
