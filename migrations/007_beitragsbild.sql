-- Ein Vorschaubild je Beitrag, fuer die Uebersicht unter /aktuelles/.
--
-- Als eigene Spalte und nicht aus content_json gelesen: die Uebersicht holt
-- wenige Felder vieler Zeilen. Jedes content_json zu entpacken, nur um darin
-- ein Bild zu suchen, waere eine Volltextsuche je Seitenaufruf.
--
-- ADD COLUMN ohne IF NOT EXISTS ist hier gefahrlos: src/db.js fuehrt jede
-- Migration genau einmal aus und merkt sich das in schema_migrations.
ALTER TABLE pages ADD COLUMN bild TEXT;
ALTER TABLE pages ADD COLUMN bild_alt TEXT;
