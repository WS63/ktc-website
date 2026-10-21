import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seiten } from '../src/seiten.js';
import { validateContent } from '../src/archetypes.js';
import { renderPage } from '../src/renderer.js';
import { blocks } from '../src/blocks/index.js';

const alsSeite = (s) => ({
  slug: s.slug, page_type: s.page_type, status: 'published',
  title: s.title, description: s.description,
  content_json: JSON.stringify({ blocks: s.blocks }),
});

test('jede Seite haelt ihren Vertrag ein', () => {
  for (const s of seiten) {
    const r = validateContent(s.page_type, { blocks: s.blocks });
    assert.ok(r.ok, `${s.slug}: ${r.fehler.join(' · ')}`);
  }
});

test('jede Seite hat Titel und Beschreibung', () => {
  for (const s of seiten) {
    assert.ok(s.title?.length > 2, `${s.slug}: Titel fehlt`);
    assert.ok(s.description?.length > 20, `${s.slug}: Beschreibung fehlt oder zu kurz`);
    assert.ok(s.description.length <= 170, `${s.slug}: Beschreibung zu lang für Google`);
  }
});

test('jede Seite rendert ohne unbekannten Baustein', () => {
  for (const s of seiten) {
    const html = renderPage(alsSeite(s));
    assert.ok(html.includes('</html>'), `${s.slug}: unvollstaendig`);
    for (const b of s.blocks) {
      assert.ok(blocks[b.type], `${s.slug}: Baustein '${b.type}' gibt es nicht`);
    }
  }
});

test('P2 · kein Preis und keine Telefonnummer steht direkt im Seitentext', () => {
  // Zahlen gehoeren in facts.json. Hier fallen Rueckfaelle auf, bevor sie live gehen.
  const erlaubt = /^(1|2|3|4|5|6|7|8|9|10|11|12|18|20|22|25|27|30|31|40|50|55|60|66|100|120|263|401|500|812|2015|2025|2026)$/;
  for (const s of seiten) {
    const text = JSON.stringify(s.blocks);
    for (const m of text.matchAll(/(\d[\d.,]*)\s*€/g)) {
      assert.fail(`${s.slug}: Preis '${m[0]}' steht im Text statt in facts.json`);
    }
    for (const m of text.matchAll(/\+49[\s\d]{6,}/g)) {
      assert.fail(`${s.slug}: Telefonnummer '${m[0].trim()}' steht im Text statt in facts.json`);
    }
    void erlaubt;
  }
});

test('P2 · jeder {{facts.…}}-Pfad existiert wirklich', () => {
  const facts = JSON.parse(readFileSync('config/facts.json', 'utf8'));
  const fehlend = new Set();
  for (const s of seiten) {
    for (const m of JSON.stringify(s.blocks).matchAll(/\{\{facts\.([\w.]+)\}\}/g)) {
      const wert = m[1].split('.').reduce((o, k) => (o ?? {})[k], facts);
      if (wert === undefined) fehlend.add(`${s.slug}: ${m[1]}`);
    }
  }
  assert.equal(fehlend.size, 0, [...fehlend].join(' · '));
});

test('die eine Handlung hat genau einen Knopf je Seite', () => {
  for (const s of seiten) {
    const html = renderPage(alsSeite(s));
    const knoepfe = (html.match(/class="knopf"/g) || []).length;
    assert.ok(knoepfe <= 1, `${s.slug}: ${knoepfe} auffällige Knöpfe — erlaubt ist einer`);
  }
});
test('Testdomain wird nicht indiziert', () => {
  // Solange config/site.json suchmaschinen:false traegt, darf KEINE Seite
  // fuer Google freigegeben sein — sonst konkurriert die Testdomain spaeter
  // mit der echten um dieselben Inhalte.
  const site = JSON.parse(readFileSync('config/site.json', 'utf8'));
  if (site.suchmaschinen !== false) return;            // echte Domain: nichts zu pruefen
  for (const s of seiten) {
    const html = renderPage({ ...alsSeite(s), status: 'published' });
    assert.match(html, /name="robots" content="noindex, nofollow"/,
      `${s.slug} wäre auf der Testdomain für Google freigegeben`);
  }
});

test('Sport: der gelbe Knopf steht am Ende (Aufruf), im Aufmacher nur ein leiser Einstieg', async () => {
  const { seiten } = await import('../src/seiten.js');
  const sport = seiten.find((s) => s.slug === 'sport');
  const hero = sport.blocks.find((b) => b.type === 'hero').data;
  assert.equal(hero.ctaLabel, undefined, 'kein gelber Knopf im Aufmacher');
  assert.equal(hero.zweitHref, '#einsteiger');
  assert.ok(sport.blocks.some((b) => b.type === 'richtext' && b.data.anker === 'einsteiger'), 'das Sprungziel gibt es');
  const typen = sport.blocks.map((b) => b.type);
  assert.equal(typen.filter((t) => t === 'aufruf').length, 1);
  assert.ok(typen.indexOf('aufruf') < typen.indexOf('assistent'), 'vor dem Assistenten und der Fußzeile');
  const aufruf = sport.blocks.find((b) => b.type === 'aufruf').data;
  assert.match(aufruf.text, /\{\{facts\.beitraege\.neumitglied_erstes_jahr\}\} €/);
});
