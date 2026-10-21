-- Die Satzung steht nicht mehr in der Fusszeile, sondern am Ende der Seite 'Mitglied werden'
-- (wer die Satzung sucht, ist ohnehin dabei, Mitglied zu werden). Versteckt statt geloescht:
-- im Cockpit laesst sich der Punkt jederzeit wieder einblenden.
UPDATE navigation SET visible = 0 WHERE ort = 'fuss' AND href = '/satzung-und-ordnungen/';
