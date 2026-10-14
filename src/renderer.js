import { blocks } from './blocks/index.js';
import { themeCss } from './blocks/_theme.js';
import { loadSite, loadFacts } from './config.js';
import { escapeHtml } from './blocks/_util.js';

/**
 * Fakten einstempeln: {{facts.verein.email}} → Wert, fehlend → sichtbares […] (P2)
 *
 * @param roh  true  = Wert unveraendert (fuer Baustein-DATEN, der Baustein escaped selbst)
 *             false = Wert escaped (fuer das fertige HTML, dort escaped niemand mehr)
 */
function fakten(text, { roh = false } = {}) {
  const facts = loadFacts();
  return String(text).replace(/\{\{facts\.([\w.]+)\}\}/g, (_, pfad) => {
    const wert = pfad.split('.').reduce((o, k) => (o ?? {})[k], facts);
    if (wert == null || wert === '') {
      console.warn(`[Motor] [WARN] Fakt fehlt: ${pfad}`);
      return '[…]';
    }
    // Telefonnummern bleiben in einem Stueck: geschuetzte Leerzeichen statt Umbruch nach '+49'.
    const text = /(^|\.)telefon\w*$/.test(pfad) ? String(wert).replace(/ /g, '\u00a0') : String(wert);
    return roh ? text : escapeHtml(text);
  });
}

/**
 * Fakten ZUERST in den Daten aufloesen, dann rendern.
 *
 * Warum nicht erst am Ende: ein Baustein prueft seine Werte (ziel() laesst nur
 * sichere Links durch). Steht dort noch ein Platzhalter statt einer URL, faellt
 * der Link stumm weg und niemand merkt es. Deshalb hier, vor dem Rendern.
 */
function faktenInDaten(wert) {
  if (typeof wert === 'string') return fakten(wert, { roh: true });
  if (Array.isArray(wert)) return wert.map(faktenInDaten);
  if (wert && typeof wert === 'object') {
    return Object.fromEntries(Object.entries(wert).map(([k, v]) => [k, faktenInDaten(v)]));
  }
  return wert;
}

/** Reine Funktion: gleiche Daten, gleiches HTML, immer. (P1) */
export function renderPage(page, { dynamicData = {} } = {}) {
  const site = loadSite();
  const inhalt = typeof page.content_json === 'string'
    ? JSON.parse(page.content_json) : page.content_json;
  const liste = inhalt.blocks || [];

  const benutzt = [...new Set(liste.map((b) => b.type))];
  const css = benutzt.map((t) => blocks[t]?.css || '').join('\n');

  const koerper = liste.map((eintrag) => {
    const block = blocks[eintrag.type];
    if (!block) {
      // Laut sein: ein unbekannter Baustein verschwindet sonst stumm und
      // die Seite bleibt 200, aber leer. Das ist die fieseste Fehlerart.
      console.warn(`[Motor] [WARN] Unbekannter Baustein: ${eintrag.type}`);
      return '';
    }
    const vorgaben = Object.fromEntries(
      Object.entries(block.schema).map(([k, v]) => [k, v.default]));
    const daten = faktenInDaten({ ...vorgaben, ...eintrag.data, ...(dynamicData[eintrag.type] || {}) });
    const out = block.render(daten);
    return out?.__raw ? out.value : String(out);
  }).join('\n');

  return fakten(`<!doctype html>
<html lang="${site.locale || 'de'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(page.title || site.name)}${escapeHtml(site.titleSuffix || '')}</title>
<meta name="description" content="${escapeHtml(page.description || '')}">
<link rel="canonical" href="${escapeHtml((site.domain || '') + (page.slug === 'start' ? '/' : `/${page.slug}/`))}">
<meta property="og:title" content="${escapeHtml(page.title || site.name)}">
<meta property="og:description" content="${escapeHtml(page.description || '')}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHtml((site.domain || '') + (page.slug === 'start' ? '/' : `/${page.slug}/`))}">
<meta property="og:site_name" content="${escapeHtml(site.name)}">
<meta name="twitter:card" content="summary_large_image">
${(page.og_image || site.ogBild) ? `<meta property="og:image" content="${escapeHtml(site.domain + (page.og_image || site.ogBild))}">` : ''}
${(page.status === 'published' && site.suchmaschinen !== false && !page.suche)
  ? '' : '<meta name="robots" content="noindex, nofollow">'}
<style>${themeCss()}${css}</style>
</head>
<body>${koerper}</body>
</html>`);
}
