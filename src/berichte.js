/**
 * Aus den Ergebnissen eines Spielwochenendes einen Beitragsentwurf machen.
 *
 * Von zwei Stellen aufgerufen: vom Skript (npm run spielbericht) und vom Knopf
 * im Redaktionsbereich. Beide sollen dasselbe tun, deshalb steht es hier.
 *
 * Die Arbeitsteilung steht in src/spielbericht.js: der Code rechnet, das Modell
 * schreibt den Text. Der Entwurf bekommt den Status 'generated' (P5) — nie
 * 'published'. Eine Redakteurin liest, aendert und veroeffentlicht.
 */
import { query, queryOne } from './db.js';
import { validateContent } from './archetypes.js';
import { seitenBausteine } from './seiten-teile.js';
import {
  rohmaterial, anweisung, unbelegteErgebnisse, ergebnisTabelle, spielwochenende,
} from './spielbericht.js';

/** Ein Fehler, den man dem Menschen so zeigen kann: Meldung und HTTP-Status. */
export class BerichtFehler extends Error {
  constructor(meldung, status = 422) { super(meldung); this.status = status; }
}

/**
 * @param spiele  der Spielstand (alle Begegnungen)
 * @param stand   Text fuer die Tabelle: 'Stand: 10. Oktober 2026', oder leer
 * @returns { id, slug, titel, beschreibung, hinweise, verbrauch }
 */
export async function erzeugeEntwurf({ von, bis, spiele, stand = '' }) {
  const { generiere, istBereit } = await import('./generator.js');
  if (!istBereit()) throw new BerichtFehler('Der Text-Assistent ist nicht eingerichtet (ANTHROPIC_API_KEY fehlt).', 503);

  const liste = spielwochenende({ begegnungen: spiele }, von, bis);
  if (!liste.length) throw new BerichtFehler(`Für ${von} bis ${bis} gibt es noch keine gemeldeten Ergebnisse.`, 404);

  const slug = `spielwochenende-${von}`;
  if (await queryOne('SELECT id FROM pages WHERE slug = $1', [slug])) {
    throw new BerichtFehler(`Zu diesem Wochenende gibt es schon einen Beitrag (/${slug}/). Nichts überschrieben — öffne ihn unter Seiten.`, 409);
  }

  const roh = rohmaterial(liste, von, bis);
  const r = await generiere({ quelle: roh, typ: 'beitrag', anmerkung: anweisung(von, bis) });

  // Nur der TEXT zaehlt; Kopf, Tabelle und Fuss baut der Code.
  const absaetze = r.content_json.blocks.filter((x) => x.type === 'richtext')
    .flatMap((x) => x.data?.absaetze || []).filter((a) => String(a).trim());
  if (!absaetze.length) throw new BerichtFehler('Der Assistent hat keinen Text geliefert. Nichts gespeichert.');

  const blocks = seitenBausteine.beitrag({ datum: bis, titel: r.title, absaetze });
  blocks.splice(blocks.findIndex((x) => x.type === 'richtext') + 1, 0,
    { type: 'tabelle', data: ergebnisTabelle(liste, stand) });
  const pruefung = validateContent('beitrag', { blocks });
  if (!pruefung.ok) throw new BerichtFehler(`Vertrag verletzt: ${pruefung.fehler.join(' · ')}`);

  const hinweise = [...r.hinweise];
  const unbelegt = unbelegteErgebnisse(`${r.title} ${absaetze.join(' ')}`, roh);
  if (unbelegt.length) {
    hinweise.unshift(`ACHTUNG: Im Text stehen Ergebnisse, die es im Rohmaterial nicht gibt: ${unbelegt.join(', ')}. `
      + 'Vor dem Veröffentlichen prüfen oder streichen.');
  }

  const id = crypto.randomUUID();
  const jetzt = new Date().toISOString();
  // created_at = letzter Spieltag, damit der Beitrag dort einsortiert wird, wo er hingehoert.
  await query(
    `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, created_at, updated_at, art)
     VALUES ($1, $2, 'beitrag', 'generated', $3, $4, $5, $6, $7, $8)`,
    [id, slug, r.title, r.description, JSON.stringify({ blocks }), `${bis}T12:00:00.000Z`, jetzt, 'spiel']);

  return { id, slug, titel: r.title, beschreibung: r.description, hinweise, verbrauch: r.verbrauch, absaetze };
}
