-- 'FAQ' heisst in der Fusszeile jetzt 'Häufige Fragen': nicht jeder weiss, wofuer die Abkuerzung steht.
--
-- Umbenannt wird nur, wo noch der alte Vorgabename steht. Hat jemand den Punkt im Cockpit selbst benannt,
-- bleibt sein Name. Die Adresse /faq/ bleibt, damit kein Link bricht.
UPDATE navigation SET label = 'Häufige Fragen' WHERE href = '/faq/' AND label = 'FAQ';
