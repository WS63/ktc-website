import { readFileSync, existsSync } from 'node:fs';
import { blocks } from './blocks/index.js';
import { getType, validateContent } from './archetypes.js';
import { loadFacts } from './config.js';

const MODELL = process.env.GENERATOR_MODELL || 'claude-opus-5';

let clientVersprechen = null;
async function holeClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!clientVersprechen) {
    clientVersprechen = import('@anthropic-ai/sdk').then((m) => new m.default());
  }
  return clientVersprechen;
}

export const istBereit = () => Boolean(process.env.ANTHROPIC_API_KEY);

const lies = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

/** Die Schemata der erlaubten Bausteine — so, wie ein Modell sie lesen kann. */
function bausteinKatalog(typName) {
  const typ = getType(typName);
  const erlaubt = typ?.schema?.allowedBlocks || Object.keys(blocks);
  return erlaubt.map((name) => {
    const b = blocks[name];
    if (!b) return '';
    const felder = Object.entries(b.schema)
      .filter(([, v]) => v.type !== 'auto')     // kommt aus der Datenbank
      .map(([k, v]) => {
        const art = v.type === 'liste' ? 'Liste' : v.type === 'auswahl'
          ? `eines von: ${(v.optionen || []).join(', ')}` : v.type;
        return `    "${k}": ${art}   — ${v.label}`;
      }).join('\n');
    return `  ${name} (${b.label})\n${felder}`;
  }).filter(Boolean).join('\n\n');
}

/** Alle verfügbaren Fakten-Pfade, damit das Modell keinen erfindet. */
function faktenPfade() {
  const raus = [];
  const gehe = (o, pfad = '') => {
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith('_')) continue;
      const p = pfad ? `${pfad}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) gehe(v, p);
      else if (v !== '' && v != null) raus.push(`  {{facts.${p}}} → ${v}`);
    }
  };
  gehe(loadFacts());
  return raus.join('\n');
}

function anweisung(typName) {
  const typ = getType(typName);
  const stimme = lies('inhalte/stimme.md');
  const gold = lies(`page-types/${typName}/golden.html`);
  const prompt = lies(`page-types/${typName}/prompt.md`);

  return `Du baust eine Seite für die Website des Krifteler Tennis-Clubs.

Du lieferst AUSSCHLIESSLICH JSON. Kein Text davor, kein Text danach, keine
Code-Zäune. Das erste Zeichen deiner Antwort ist {, das letzte }.

FORM:

{
  "title": "…",           // der Seitentitel, 2–6 Wörter
  "description": "…",     // für Google und beim Teilen, 120–160 Zeichen
  "blocks": [
    { "type": "…", "data": { … } }
  ]
}

SEITENART: ${typName} — ${typ?.beschreibung || ''}
PFLICHTBAUSTEINE (müssen vorkommen): ${(typ?.schema?.requiredBlocks || []).join(', ') || '—'}

ERLAUBTE BAUSTEINE UND IHRE FELDER:

${bausteinKatalog(typName)}

REGELN, die du nicht brichst:

1. Niemals HTML. Du füllst Felder aus, die jemand vorher definiert hat.
2. Unterscheide zwei Arten von Zahlen:

   a) FAKTEN ÜBER DEN VEREIN — Beiträge, Anschrift, Telefonnummern, Plätze,
      Mitgliederzahl, Öffnungszeiten, Links. Die schreibst du NIE selbst,
      dafür gibt es {{facts.…}}. Die vollständige Liste steht unten.
      Steht ein Wert nicht in der Liste: weglassen und in "hinweise" erwähnen.
      Eine erfundene Beitragshöhe ist kein Stilfehler, sondern ein Rechtsproblem.

   b) ZAHLEN AUS DEM ROHMATERIAL — Spielergebnisse, Satzzahlen, wie viele
      Mannschaften angetreten sind, Tabellenplätze. Die schreibst du normal
      aus, genau so, wie sie im Rohmaterial stehen. Sie gehören zur Geschichte.
      Nichts dazuerfinden und nichts runden.
3. Niemals eine Farbe, eine Schriftgröße oder einen Abstand. Gestaltung ist Code.
4. Niemals eine Liste von Beiträgen tippen. Der Baustein "beitragsliste" holt
   sie sich selbst — er braucht nur einen Titel.
5. Nur Bausteine aus der Liste oben. Nur Felder, die dort stehen.
6. Links nur auf Seiten, die es gibt: / /sport/ /mitglied-werden/ /aktuelles/
   /kontakt/ /faq/ /impressum/ /datenschutz/

${stimme ? `DIE STIMME DES VEREINS:\n\n${stimme}\n` : ''}
VERFÜGBARE FAKTEN:

${faktenPfade()}

${prompt ? `BESONDERES ZU DIESER SEITENART:\n\n${prompt}\n` : ''}
${gold ? `EIN BEISPIEL, das gut ist — bau etwas Vergleichbares, kopier es nicht:\n\n${gold.slice(0, 6000)}\n` : ''}
Gib am Ende im Feld "hinweise" (Array aus Sätzen) an, was dir gefehlt hat:
fehlende Fakten, unklare Angaben, Dinge, die ein Mensch prüfen sollte.`;
}

/**
 * JSON aus einer Modellantwort holen.
 *
 * Modelle liefern gelegentlich Text um das JSON herum, Code-Zäune oder eine
 * abgeschnittene Antwort. Eine Kette von Versuchen, vom einfachsten zum
 * aufwendigsten — ein Generator, der an einem Komma scheitert, wird nicht
 * benutzt.
 */
export function holeJson(roh) {
  const text = String(roh || '').trim();

  // 1. Direkt
  try { return JSON.parse(text); } catch { /* weiter */ }

  // 2. Code-Zäune entfernen
  const ohneZaun = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(ohneZaun); } catch { /* weiter */ }

  // 3. Aus dem Text herausschneiden: von der ersten { bis zur passenden }
  const start = ohneZaun.indexOf('{');
  if (start >= 0) {
    let tiefe = 0, inText = false, entwertet = false;
    for (let i = start; i < ohneZaun.length; i++) {
      const c = ohneZaun[i];
      if (entwertet) { entwertet = false; continue; }
      if (c === '\\') { entwertet = true; continue; }
      if (c === '"') { inText = !inText; continue; }
      if (inText) continue;
      if (c === '{') tiefe++;
      else if (c === '}') {
        tiefe--;
        if (tiefe === 0) {
          try { return JSON.parse(ohneZaun.slice(start, i + 1)); } catch { break; }
        }
      }
    }
  }

  // 4. Häufige Kleinigkeiten reparieren: Komma vor schliessender Klammer
  try {
    return JSON.parse(ohneZaun.replace(/,(\s*[}\]])/g, '$1'));
  } catch { /* aufgeben */ }

  throw new Error('Die Antwort enthält kein brauchbares JSON.');
}

/**
 * Eine Seite erzeugen.
 *
 * Drei Regeln, hart durchgesetzt:
 *   1. Der Vertrag — validateContent, sonst Abbruch.
 *   2. Die Fakten — der Prompt verbietet Zahlen, das Tor im Renderer fängt den Rest.
 *   3. Der Status — 'generated', NICHT 'published'. Ein Mensch entscheidet.
 */
export async function generiere({ quelle, typ = 'standard', anmerkung = '' }) {
  const client = await holeClient();
  if (!client) throw new Error('ANTHROPIC_API_KEY fehlt.');
  if (!getType(typ)) throw new Error(`Seitenart '${typ}' gibt es nicht.`);
  if (!String(quelle || '').trim()) throw new Error('Kein Rohmaterial übergeben.');

  const strom = client.messages.stream({
    model: MODELL,
    max_tokens: 8000,
    output_config: { effort: 'high' },
    system: [{ type: 'text', text: anweisung(typ), cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content:
      `ROHMATERIAL:\n\n${String(quelle).slice(0, 40000)}`
      + (anmerkung ? `\n\nZUSÄTZLICHE ANWEISUNG:\n${anmerkung}` : '') }],
  });

  const antwort = await strom.finalMessage();
  if (antwort.stop_reason === 'refusal') {
    throw new Error('Das Modell hat die Anfrage abgelehnt.');
  }
  if (antwort.stop_reason === 'max_tokens') {
    throw new Error('Die Antwort wurde abgeschnitten. Kürzeres Rohmaterial versuchen.');
  }

  const text = antwort.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const ergebnis = holeJson(text);

  const inhalt = { blocks: ergebnis.blocks || [] };
  const pruefung = validateContent(typ, inhalt);
  if (!pruefung.ok) {
    const fehler = new Error(`Der Vertrag ist verletzt: ${pruefung.fehler.join(' · ')}`);
    fehler.inhalt = inhalt;
    throw fehler;
  }

  // Eine zweite Prüfung, die der Vertrag nicht leistet: erfundene Felder.
  const unbekannt = [];
  for (const b of inhalt.blocks) {
    const schema = blocks[b.type]?.schema || {};
    for (const feld of Object.keys(b.data || {})) {
      if (!schema[feld]) unbekannt.push(`${b.type}.${feld}`);
    }
  }

  return {
    title: String(ergebnis.title || '').slice(0, 120),
    description: String(ergebnis.description || '').slice(0, 200),
    content_json: inhalt,
    hinweise: Array.isArray(ergebnis.hinweise) ? ergebnis.hinweise : [],
    unbekannteFelder: unbekannt,
    verbrauch: {
      hinein: antwort.usage.input_tokens,
      heraus: antwort.usage.output_tokens,
      ausCache: antwort.usage.cache_read_input_tokens || 0,
    },
  };
}
