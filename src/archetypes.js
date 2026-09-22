import { readFileSync, readdirSync, existsSync } from 'node:fs';

const typen = Object.fromEntries(
  readdirSync('page-types', { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => [d.name, {
      name: d.name,
      ...JSON.parse(readFileSync(`page-types/${d.name}/type.json`, 'utf8')),
      schema: existsSync(`page-types/${d.name}/schema.json`)
        ? JSON.parse(readFileSync(`page-types/${d.name}/schema.json`, 'utf8')) : {},
    }]));

export const getType = (name) => typen[name] || null;
export const alleTypen = () => Object.values(typen);

/** Der Vertrag. Hier scheitert ein Modell-Ergebnis, nicht auf der Seite. */
export function validateContent(typName, inhalt) {
  const fehler = [];
  const typ = getType(typName);
  if (!typ) return { ok: false, fehler: [`Unbekannter Seitentyp: ${typName}`] };
  if (!Array.isArray(inhalt?.blocks)) return { ok: false, fehler: ['blocks muss ein Array sein'] };

  const erlaubt = new Set(typ.schema.allowedBlocks || []);
  const vorhanden = new Set(inhalt.blocks.map((b) => b?.type).filter(Boolean));
  if (erlaubt.size) {
    for (const b of inhalt.blocks) {
      if (!b?.type) fehler.push('Baustein ohne type');
      else if (!erlaubt.has(b.type)) fehler.push(`Baustein nicht erlaubt für ${typName}: ${b.type}`);
    }
  }
  for (const pflicht of typ.schema.requiredBlocks || []) {
    if (!vorhanden.has(pflicht)) fehler.push(`Pflicht-Baustein fehlt: ${pflicht}`);
  }
  return { ok: fehler.length === 0, fehler };
}
