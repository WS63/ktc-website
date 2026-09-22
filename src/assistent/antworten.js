import { finde } from './suchen.js';
import { loadSite } from '../config.js';

// Sonnet 5 statt Opus: die eigentliche Arbeit steckt in der Suche, nicht im
// Formulieren. Das Modell liest fuenf Absaetze und antwortet in drei Saetzen.
// Umstellen ist eine Zeile in .env — CHAT_MODELL=claude-opus-5
const MODELL = process.env.CHAT_MODELL || 'claude-sonnet-5';

let clientVersprechen = null;
async function holeClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!clientVersprechen) {
    clientVersprechen = import('@anthropic-ai/sdk').then((m) => new m.default());
  }
  return clientVersprechen;
}

export const istBereit = () => Boolean(process.env.ANTHROPIC_API_KEY);

/**
 * Die Anweisung. Dieselbe Strenge wie beim Fakten-Tor (P2): die Fakten kommen
 * aus dem Bestand, nicht aus dem Modell.
 *
 * Der Chat ist die Stelle, an der ein Modell am leichtesten etwas erfindet —
 * und die, an der es am meisten schadet, weil die Antwort aussieht, als
 * kaeme sie vom Verein.
 */
function anweisung(stuecke) {
  const site = loadSite();
  const auszuege = stuecke.map((s, i) =>
    `[${i + 1}] Seite: ${s.page_titel} (${s.pfad})\n`
    + (s.ueberschrift ? `Abschnitt: ${s.ueberschrift}\n` : '')
    + s.text).join('\n\n---\n\n');

  return `Du beantwortest Fragen zur Website des ${site.name} AUSSCHLIESSLICH aus den folgenden Auszügen.

REGELN, die du nicht brichst:
- Steht die Antwort nicht in den Auszügen, sage das offen und nenne den nächstbesten Weg
  (E-Mail an den Verein, die passende Seite, oder einfach vorbeikommen).
- Nenne NIE einen Preis, einen Termin, eine Telefonnummer oder eine Zahl, die nicht
  wörtlich in einem Auszug steht. Lieber "das weiß ich nicht" als eine erfundene Zahl.
- Erfinde keine Seiten und keine Links. Verlinke nur Pfade, die in den Auszügen stehen.
- Du bist nicht der Vorstand. Sag nichts zu, entscheide nichts, versprich nichts.

TON:
- Duze durchgehend. Der Verein duzt.
- Kurz. Zwei bis vier Sätze reichen fast immer. Keine Aufzählung, wenn ein Satz genügt.
- Sportlich, herzlich, familiär — so beschreibt sich der Verein selbst.
- Keine Floskeln wie "gerne" oder "selbstverständlich". Keine Emojis.

FORM:
- Antworte in Markdown, sparsam: **fett** für Zahlen, [Text](/pfad/) für Links.
- Nenne am Ende KEINE Quellenliste — die zeigt die Oberfläche selbst an.

AUSZÜGE:

${auszuege}`;
}

const NICHTS_GEFUNDEN = 'Dazu finde ich auf der Website nichts. '
  + 'Schreib am besten direkt an {{email}} — da wird dir geholfen.';

/**
 * Eine Frage beantworten. Liefert einen Strom von Textstuecken.
 *
 * P6: schlaegt etwas davon fehl, bekommt der Mensch eine ehrliche Meldung,
 * und die Website bleibt vollstaendig bedienbar. Ein Chat, der eine Seite
 * lahmlegt, ist schlimmer als kein Chat.
 */
export async function* antworte(frage, verlauf = []) {
  const stuecke = await finde(frage, 6);

  if (!stuecke.length) {
    const site = loadSite();
    yield { art: 'text', text: NICHTS_GEFUNDEN.replace('{{email}}',
      (await import('../config.js')).loadFacts().verein?.email || 'den Verein') };
    yield { art: 'fertig', quellen: [], gefunden: 0 };
    return;
  }

  const client = await holeClient();
  if (!client) {
    yield { art: 'fehler',
      text: 'Der Assistent ist gerade nicht erreichbar. Schau solange direkt auf der Seite nach.' };
    return;
  }

  // Quellen: je Seite eine, nicht je Stueck — sonst steht dieselbe Seite dreimal da.
  const quellen = [];
  for (const s of stuecke) {
    if (!quellen.some((q) => q.pfad === s.pfad)) {
      quellen.push({ pfad: s.pfad, titel: s.page_titel });
    }
  }

  try {
    const nachrichten = [
      ...verlauf.slice(-6).map((n) => ({
        role: n.rolle === 'ich' ? 'user' : 'assistant',
        content: String(n.text).slice(0, 2000),
      })),
      { role: 'user', content: frage },
    ];

    const strom = client.messages.stream({
      model: MODELL,
      max_tokens: 1024,
      // Kurze, klare Auskunft — dafuer braucht es kein tiefes Nachdenken,
      // und der Mensch wartet vor einem Chatfenster.
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: anweisung(stuecke) }],
      messages: nachrichten,
    });

    let ganz = '';
    for await (const teil of strom) {
      if (teil.type === 'content_block_delta' && teil.delta?.type === 'text_delta') {
        ganz += teil.delta.text;
        yield { art: 'text', text: teil.delta.text };
      }
    }

    const fertig = await strom.finalMessage();
    if (fertig.stop_reason === 'refusal') {
      yield { art: 'text',
        text: '\n\nDazu kann ich nichts sagen. Wende dich bitte direkt an den Verein.' };
    }
    yield { art: 'fertig', quellen: quellen.slice(0, 3), gefunden: stuecke.length, ganz };
  } catch (err) {
    console.error('[Assistent] [FEHLER]', err.message);
    yield { art: 'fehler',
      text: 'Da ist gerade etwas schiefgegangen. Versuch es noch einmal, oder schreib uns direkt.' };
  }
}
