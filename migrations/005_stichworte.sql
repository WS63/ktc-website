-- Was ein Baustein IST, als Suchbegriff. Ein 'personen'-Baustein ist die
-- Ansprechpartner-Liste, auch wenn das Wort nirgends im Text steht.
ALTER TABLE chunks ADD COLUMN stichworte TEXT NOT NULL DEFAULT '';
