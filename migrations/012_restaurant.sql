-- 'Clubhaus' heisst in der Fusszeile jetzt 'Restaurant': das ist, was die Seite zeigt.
--
-- Umbenannt wird nur, wo noch der alte Vorgabename steht. Hat jemand den Punkt im Cockpit
-- selbst benannt, bleibt sein Name. Die Adresse /clubhaus/ bleibt, damit kein Link bricht.
UPDATE navigation SET label = 'Restaurant' WHERE href = '/clubhaus/' AND label = 'Clubhaus';
