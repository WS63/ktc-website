-- Die Runde einer Begegnung: 'Sommer 2026', 'Winter 2026/27'.
--
-- Die Saison bleibt das Jahr ('2026'): die Winterrunde 2026/27 gehoert zum Jahr 2026, auch wenn
-- ihre Spiele bis in den April 2027 gehen. Die Runde ist ein Marker zur Orientierung; geordnet
-- wird nach dem Datum. Was bis hierher gespeichert wurde, war die Medenrunde im Sommer.
ALTER TABLE spiele ADD COLUMN runde TEXT;
UPDATE spiele SET runde = 'Sommer ' || saison WHERE runde IS NULL OR runde = '';
