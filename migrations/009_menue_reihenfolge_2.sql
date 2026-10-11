-- Termine vor Kontakt, zweiter Anlauf.
--
-- Die Migration 008 lief auf dem Server, BEVOR es dort einen Menuepunkt
-- 'Termine' gab — sie hatte nichts zu tauschen. Danach trug 'npm run struktur'
-- ihn nach, ans Ende, also hinter 'Kontakt'. Dieselbe Pruefung noch einmal:
-- getauscht wird nur, wenn Kontakt noch VOR Termine steht. Wo 008 schon
-- getauscht hat (lokale Datenbank), tut diese Migration nichts.
--
-- Warum sechs Anweisungen statt einer: SQLite wertet eine Unterabfrage im
-- UPDATE fuer jede Zeile NEU aus. Ein einzelnes 'tausche A mit B' sieht beim
-- zweiten Punkt schon den neuen Wert des ersten und setzt beide gleich —
-- gemessen, nicht vermutet. Postgres wuerde es richtig machen; die Migration
-- muss auf beiden laufen. Deshalb Tausch ueber die Summe, mit +1000 als
-- Markierung, damit die Bedingung nach dem ersten Schritt nicht mehr greift.

-- 1. nur wenn Kontakt noch VOR Termine steht: Kontakt markieren
UPDATE navigation SET sort = sort + 1000
 WHERE ort = 'kopf' AND href = '/kontakt/'
   AND sort < (SELECT sort FROM navigation WHERE ort = 'kopf' AND href = '/kalender/');
-- 2. Termine markieren, aber nur wenn Schritt 1 gegriffen hat
UPDATE navigation SET sort = sort + 1000
 WHERE ort = 'kopf' AND href = '/kalender/' AND sort < 1000
   AND (SELECT sort FROM navigation WHERE ort = 'kopf' AND href = '/kontakt/') >= 1000;
-- 3.-5. Tausch ueber die Summe: K := K+T, T := K-T, K := K-T
UPDATE navigation SET sort = sort + (SELECT sort FROM navigation WHERE ort = 'kopf' AND href = '/kalender/')
 WHERE ort = 'kopf' AND href = '/kontakt/' AND sort >= 1000
   AND (SELECT sort FROM navigation WHERE ort = 'kopf' AND href = '/kalender/') >= 1000;
UPDATE navigation SET sort = (SELECT sort FROM navigation WHERE ort = 'kopf' AND href = '/kontakt/') - sort
 WHERE ort = 'kopf' AND href = '/kalender/' AND sort >= 1000
   AND (SELECT sort FROM navigation WHERE ort = 'kopf' AND href = '/kontakt/') >= 2000;
UPDATE navigation SET sort = sort - (SELECT sort FROM navigation WHERE ort = 'kopf' AND href = '/kalender/')
 WHERE ort = 'kopf' AND href = '/kontakt/' AND sort >= 2000
   AND (SELECT sort FROM navigation WHERE ort = 'kopf' AND href = '/kalender/') >= 1000;
-- 6. Markierung wieder abziehen
UPDATE navigation SET sort = sort - 1000
 WHERE ort = 'kopf' AND href IN ('/kontakt/', '/kalender/') AND sort >= 1000;

-- Clubhaus vor FAQ in der Fusszeile (lokal so, auf dem Server hinten angehaengt).
UPDATE navigation SET sort = -1
 WHERE ort = 'fuss' AND href = '/clubhaus/'
   AND sort > (SELECT sort FROM navigation WHERE ort = 'fuss' AND href = '/faq/');
