-- Die Art einer Seite, vor allem von Beitraegen: spiel, club oder info (siehe
-- config/arten.json). Aus der Art ergibt sich das Symbol, das in der Uebersicht
-- steht. Leer = keine Art, die Zeile steht trotzdem da.
ALTER TABLE pages ADD COLUMN art TEXT;
