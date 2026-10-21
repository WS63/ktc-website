-- Die Platzordnung steht in eBuSy und wird dort gepflegt. Die eigene Seite entfaellt: sie waere
-- eine zweite Fassung, die bei jeder Aenderung auseinanderliefe. Archiviert statt geloescht, die
-- alte Adresse leitet auf die Seite 'Satzung und Platzordnung' um, die auf eBuSy verweist, und
-- der Suchindex des Assistenten verliert die alten Stuecke (sonst antwortet er aus der Fassung von gestern).
UPDATE pages SET status = 'archived' WHERE slug = 'platzordnung';
INSERT INTO redirects (from_path, to_path, code, created_at)
  SELECT '/platzordnung/', '/satzung-und-ordnungen/', 301, '2026-10-21T00:00:00.000Z'
  WHERE NOT EXISTS (SELECT 1 FROM redirects WHERE from_path = '/platzordnung/');
DELETE FROM chunks WHERE page_slug = 'platzordnung';
