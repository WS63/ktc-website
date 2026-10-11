-- Termine vor Kontakt im Kopfmenue.
--
-- Die Menuepunkte stehen in der Datenbank, nicht im Quelltext, und das
-- Seed-Skript laesst Bestehendes bewusst in Ruhe. Eine neue Reihenfolge kam
-- deshalb auf einem laufenden Server nie an. Diese Migration laeuft GENAU
-- EINMAL (schema_migrations merkt sich das) und tauscht die beiden Punkte nur
-- dann, wenn sie noch in der alten Reihenfolge stehen. Wer sie spaeter im
-- Cockpit umsortiert, wird nicht wieder zurueckgesetzt.
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
