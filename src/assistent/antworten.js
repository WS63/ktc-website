import { finde } from './suchen.js';
import { loadSite, loadFacts } from '../config.js';
import { lokal, assistentAktiv } from './bereit.js';

// Haiku 5.5 statt Sonnet oder Opus: die eigentliche Arbeit steckt in der Suche, nicht im
// Formulieren. Das Modell liest fuenf Absaetze und antwortet in drei Saetzen. Haiku ist dafuer
// schnell genug, kostet einen Bruchteil und unterstuetzt 'effort' und Streaming wie die groesseren.
// Umstellen ist eine Zeile in .env — CHAT_MODELL=claude-sonnet-5-5 (oder claude-opus-5-5)
const MODELL = process.env.CHAT_MODELL || (lokal() ? 'gemma4:12b' : 'claude-haiku-5-5');

/**
 * Lokaler Anbieter (CHAT_ANBIETER=lokal): ein Modell auf dem eigenen Rechner, erreichbar ueber die
 * OpenAI-kompatible Schnittstelle (Ollama: http://localhost:11434/v1). Liefert nur die Textstuecke;
 * alles andere (Suche, Anweisung, Quellen, Verlauf) bleibt wie beim Anthropic-Zweig.
 */
async function* lokalerStrom(system, nachrichten) {
  const basis = (process.env.LOKAL_URL || 'http://localhost:11434/v1').replace(/\/+$/, '');
  const antwort = await fetch(`${basis}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal: AbortSignal.timeout(180_000),   // die erste Frage laedt das Modell in den Speicher
    body: JSON.stringify({
      model: MODELL, stream: true, max_tokens: 1024, temperature: 0.2,
      reasoning_effort: 'none',             // kurze Auskunft, keine Gedankenkette; unbekanntes wird ignoriert
      messages: [{ role: 'system', content: system }, ...nachrichten],
    }),
  });
  if (!antwort.ok) throw new Error(`Lokales Modell: HTTP ${antwort.status}`);

  const dekoder = new TextDecoder();
  let rest = '';
  let denkt = false;                        // innerhalb eines <think>-Blocks wird nichts angezeigt
  for await (const stueck of antwort.body) {
    rest += dekoder.decode(stueck, { stream: true });
    const zeilen = rest.split('\n');
    rest = zeilen.pop();
    for (const zeile of zeilen) {
      if (!zeile.startsWith('data:')) continue;
      const daten = zeile.slice(5).trim();
      if (!daten || daten === '[DONE]') continue;
      let text = '';
      try { text = JSON.parse(daten).choices?.[0]?.delta?.content || ''; } catch { continue; }
      if (text.includes('<think>')) denkt = true;
      if (!denkt && text) yield text;
      if (text.includes('</think>')) denkt = false;
    }
  }
}

let clientVersprechen = null;
async function holeClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!clientVersprechen) {
    clientVersprechen = import('@anthropic-ai/sdk').then((m) => new m.default());
  }
  return clientVersprechen;
}

export const istBereit = assistentAktiv;

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
  const name = loadFacts().assistent?.name || 'der Assistent';
  const auszuege = stuecke.map((s, i) =>
    `[${i + 1}] Seite: ${s.page_titel} (${s.pfad})\n`
    + (s.ueberschrift ? `Abschnitt: ${s.ueberschrift}\n` : '')
    + s.text).join('\n\n---\n\n');

  return `Du bist ${name}, die KI-Assistentin des ${site.name}. Du beantwortest Fragen zur Website AUSSCHLIESSLICH aus den folgenden Auszügen.

REGELN, die du nicht brichst:
- Steht die Antwort nicht in den Auszügen, sage das offen und nenne den nächstbesten Weg
  (E-Mail an den Verein, die passende Seite, oder einfach vorbeikommen).
- Nenne NIE einen Preis, einen Termin, eine Telefonnummer oder eine Zahl, die nicht
  wörtlich in einem Auszug steht. Lieber "das weiß ich nicht" als eine erfundene Zahl.
- Erfinde keine Seiten und keine Links. Verlinke nur Pfade, die in den Auszügen stehen.
- Du bist nicht der Vorstand. Sag nichts zu, entscheide nichts, versprich nichts.
- Du bist eine KI, kein Mensch. Fragt jemand danach, sage es offen, in einem Satz.

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
  const start = Date.now();
  const stuecke = await finde(frage, 6);

  if (!stuecke.length) {
    const site = loadSite();
    yield { art: 'text', text: NICHTS_GEFUNDEN.replace('{{email}}',
      (await import('../config.js')).loadFacts().verein?.email || 'den Verein') };
    yield { art: 'fertig', quellen: [], gefunden: 0 };
    return;
  }

  const client = lokal() ? null : await holeClient();
  if (!client && !lokal()) {
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

    let ganz = '';

    if (lokal()) {
      for await (const text of lokalerStrom(anweisung(stuecke), nachrichten)) {
        ganz += text;
        yield { art: 'text', text };
      }
    } else {
      const strom = client.messages.stream({
        model: MODELL,
        max_tokens: 1024,
        // Kurze, klare Auskunft — dafuer braucht es kein tiefes Nachdenken,
        // und der Mensch wartet vor einem Chatfenster.
        output_config: { effort: 'low' },
        system: [{ type: 'text', text: anweisung(stuecke) }],
        messages: nachrichten,
      });

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
    }
    // Welcher Weg genommen wurde, steht im Server-Log: so bleibt nicht zu raten, ob die Antwort
    // von Anthropic oder vom lokalen Modell kam.
    console.log(`[Assistent] ${lokal() ? 'lokal' : 'Anthropic'} · ${MODELL} · ${((Date.now() - start) / 1000).toFixed(1)} s`);
    yield { art: 'fertig', quellen: quellen.slice(0, 3), gefunden: stuecke.length, ganz };
  } catch (err) {
    console.error('[Assistent] [FEHLER]', err.message);
    yield { art: 'fehler',
      text: 'Da ist gerade etwas schiefgegangen. Versuch es noch einmal, oder schreib uns direkt.' };
  }
}
