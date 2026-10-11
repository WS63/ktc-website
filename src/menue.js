/**
 * Fehlende Menuepunkte an IHRE Stelle setzen.
 *
 * Vorher wurde ein nachgetragener Punkt ans Ende gehaengt. Auf dem Server
 * fehlte 'Termine', das Seed-Skript trug ihn nach — und er stand hinter
 * 'Kontakt', obwohl die Liste ihn davor haben will. Jetzt kommt ein neuer
 * Punkt direkt hinter den naechsten VORHERIGEN Punkt der Liste, der schon da
 * ist. Alles dahinter rueckt um eins auf; die Reihenfolge der uebrigen
 * Punkte aendert sich nicht, auch nicht, wenn jemand sie im Cockpit
 * umsortiert hat.
 *
 * 'query' ist die Datenbankfunktion von src/db.js — als Parameter, damit sich
 * das ohne Datenbankdatei testen laesst.
 */
export async function einsortieren(query, menue) {
  const ergaenzt = [];
  for (const p of menue) {
    const da = await query('SELECT id FROM navigation WHERE href = $1 AND ort = $2', [p.href, p.ort]);
    if (da.length) continue;

    // Der naechste vorherige Punkt aus der Liste, den es in der Datenbank gibt.
    let sort = null;
    for (const v of menue.slice(0, menue.indexOf(p)).reverse()) {
      if (v.ort !== p.ort) continue;
      const z = await query('SELECT sort FROM navigation WHERE href = $1 AND ort = $2', [v.href, p.ort]);
      if (z.length) { sort = Number(z[0].sort) + 1; break; }
    }
    if (sort === null) {
      // Kein Vorgaenger da: an den Anfang des Bereichs.
      const m = await query('SELECT MIN(sort) AS s FROM navigation WHERE ort = $1', [p.ort]);
      sort = m[0]?.s == null ? 0 : Number(m[0].s);
    }
    await query('UPDATE navigation SET sort = sort + 1 WHERE ort = $1 AND sort >= $2', [p.ort, sort]);
    await query(
      `INSERT INTO navigation (id, parent_id, ort, label, href, sort, visible)
       VALUES ($1, NULL, $2, $3, $4, $5, 1)`,
      [crypto.randomUUID(), p.ort, p.label, p.href, sort]);
    ergaenzt.push(p);
  }
  return ergaenzt;
}
