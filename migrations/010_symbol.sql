-- Ein Symbol (Emoji) je Seite, vor allem fuer Beitraege: es steht in der
-- Uebersicht an der Stelle, an der vorher ein Vorschaubild stand. Bilder
-- gehoeren jetzt in die Detailansicht. Leer = kein Symbol, die Zeile steht
-- trotzdem da.
ALTER TABLE pages ADD COLUMN symbol TEXT;
