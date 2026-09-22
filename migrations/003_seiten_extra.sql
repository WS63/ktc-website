-- og:image je Seite (P6: fehlt es, erscheint die Seite trotzdem)
ALTER TABLE pages ADD COLUMN og_image TEXT;
-- Reihenfolge in Uebersichten, vom Menschen bestimmt
ALTER TABLE pages ADD COLUMN sort INTEGER NOT NULL DEFAULT 0;
