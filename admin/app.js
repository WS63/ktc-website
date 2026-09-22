/* Cockpit. Vanilla JS, kein Framework, kein Build-Schritt.
   Die Formulare je Baustein werden AUS DEM SCHEMA erzeugt, nie von Hand
   geschrieben — ein neues Feld in einem Baustein erscheint dadurch von selbst. */

const $  = (s, w = document) => w.querySelector(s);
const $$ = (s, w = document) => [...w.querySelectorAll(s)];
const el = (tag, attr = {}, ...kinder) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attr)) {
    if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v);
  }
  for (const k of kinder.flat()) if (k) e.append(k);
  return e;
};

let SCHEMA = { bausteine: [], typen: [] };
const bausteinVon = (name) => SCHEMA.bausteine.find((b) => b.name === name);

// ── Hilfen ──────────────────────────────────────────────────────────
let meldeUhr;
function melde(text, art) {
  const m = $('#meldung');
  m.textContent = text;
  m.dataset.art = art || '';
  m.classList.add('auf');
  clearTimeout(meldeUhr);
  meldeUhr = setTimeout(() => m.classList.remove('auf'), art === 'fehler' ? 5200 : 2600);
}

async function api(pfad, opt = {}) {
  const r = await fetch('/api' + pfad, {
    headers: opt.body && !(opt.body instanceof ArrayBuffer) && !(opt.body instanceof Blob)
      ? { 'content-type': 'application/json' } : {},
    ...opt,
  });
  let daten = null;
  try { daten = await r.json(); } catch { /* leer ist in Ordnung */ }
  if (!r.ok) {
    const fehler = new Error(daten?.fehler || `Fehler ${r.status}`);
    fehler.daten = daten; fehler.status = r.status;
    throw fehler;
  }
  return daten;
}

function fenster(inhalt) {
  $('#fenster').replaceChildren(...[inhalt].flat());
  $('#overlay').classList.add('auf');
}
const fensterZu = () => $('#overlay').classList.remove('auf');
$('#overlay').addEventListener('click', (e) => { if (e.target.id === 'overlay') fensterZu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fensterZu(); });

/** Eine Rückfrage, die den Menschen nicht überrumpelt. */
function frage({ titel, text, knopf = 'Ja, machen', gefahr = false, felder = [], dann }) {
  const eingaben = {};
  const form = el('form', { onsubmit: async (e) => {
    e.preventDefault();
    const werte = Object.fromEntries(Object.entries(eingaben).map(([k, i]) => [k, i.value.trim()]));
    try { await dann(werte); fensterZu(); }
    catch (err) { melde(err.message, 'fehler'); }
  }},
    el('h2', { text: titel }),
    text ? el('p', { class: 'hinweis', style: 'margin-bottom:16px', text }) : null,
    ...felder.map((f) => {
      const i = el('input', { value: f.wert || '', placeholder: f.platzhalter || '' });
      eingaben[f.name] = i;
      return el('div', { class: 'feldreihe' }, el('label', { text: f.label }), i,
        f.hinweis ? el('p', { class: 'hinweis', text: f.hinweis }) : null);
    }),
    el('div', { class: 'zeile', style: 'margin-top:18px' },
      el('button', { type: 'button', text: 'Abbrechen', onclick: fensterZu }),
      el('button', { class: gefahr ? 'gefahr' : 'stark', text: knopf })),
  );
  fenster(form);
  setTimeout(() => form.querySelector('input')?.focus(), 30);
}

// ══════════════════════════════════════════════ SEITEN
async function zeigeSeiten() {
  const seiten = await api('/pages');
  const gruppen = {};
  for (const s of seiten) (gruppen[s.page_type] ||= []).push(s);

  $('#buehne').replaceChildren(
    el('div', { class: 'kopfzeile' },
      el('h1', { text: 'Seiten' }),
      el('span', { class: 'hinweis', text: `${seiten.length} insgesamt` }),
      el('div', { class: 'rechts' },
        el('button', { class: 'stark', text: '+ Neue Seite', onclick: neueSeite }))),
    ...Object.entries(gruppen).map(([typ, liste]) => el('div', {},
      el('h2', { style: 'margin:22px 0 10px', text: SCHEMA.typen.find((t) => t.name === typ)?.label || typ }),
      ...liste.map(seitenZeile))),
  );
}

function seitenZeile(s) {
  const pfad = s.page_type === 'beitrag' ? `/aktuelles/${s.slug}/`
             : s.slug === 'start' ? '/' : `/${s.slug}/`;
  return el('div', { class: 'karte' },
    el('div', { class: 'zeile' },
      el('div', {},
        el('h3', { text: s.title || '(ohne Titel)' }),
        el('span', { class: 'pfad', text: pfad })),
      el('span', { class: 'marker ' + s.status, text: statusWort(s.status) }),
      el('div', { class: 'rechts' },
        el('button', { class: 'klein', text: 'Bearbeiten',
          onclick: () => oeffneSeite(s.id) }),
        el('a', { href: s.status === 'published' ? pfad : `/vorschau/${s.id}`, target: '_blank' },
          el('button', { class: 'klein', text: s.status === 'published' ? 'Ansehen ↗' : 'Vorschau ↗' })),
        el('button', { class: 'klein gefahr', text: 'Löschen',
          onclick: () => loescheSeite(s) }))));
}

const statusWort = (s) => ({ draft: 'Entwurf', published: 'Veröffentlicht',
  edited: 'Bearbeitet', generated: 'Erzeugt', approved: 'Freigegeben',
  archived: 'Archiviert' }[s] || s);

function neueSeite() {
  const typWahl = el('select', {}, ...SCHEMA.typen.map((t) =>
    el('option', { value: t.name, text: t.label })));
  const titel = el('input', { placeholder: 'Zum Beispiel: Sponsoren' });
  const slug = el('input', { placeholder: 'sponsoren' });
  titel.addEventListener('input', () => {
    if (!slug.dataset.getippt) slug.value = zuSlug(titel.value);
  });
  slug.addEventListener('input', () => { slug.dataset.getippt = '1'; });

  const form = el('form', { onsubmit: async (e) => {
    e.preventDefault();
    try {
      const r = await api('/pages', { method: 'POST', body: JSON.stringify({
        slug: slug.value, page_type: typWahl.value, title: titel.value }) });
      fensterZu();
      melde('Seite angelegt. Sie ist noch ein Entwurf.');
      oeffneSeite(r.id);
    } catch (err) { melde(err.message, 'fehler'); }
  }},
    el('h2', { text: 'Neue Seite' }),
    el('p', { class: 'hinweis', style: 'margin-bottom:18px',
      text: 'Die Seite wird als Entwurf angelegt. Sie ist erst öffentlich, wenn du sie veröffentlichst.' }),
    el('div', { class: 'feldreihe' }, el('label', { text: 'Art der Seite' }), typWahl),
    el('div', { class: 'feldreihe' }, el('label', { text: 'Titel' }), titel),
    el('div', { class: 'feldreihe' }, el('label', { text: 'Adresse' }), slug,
      el('p', { class: 'hinweis', text: 'So lautet später der Link. Kleinbuchstaben und Bindestriche.' })),
    el('div', { class: 'zeile', style: 'margin-top:18px' },
      el('button', { type: 'button', text: 'Abbrechen', onclick: fensterZu }),
      el('button', { class: 'stark', text: 'Anlegen' })));
  fenster(form);
  setTimeout(() => titel.focus(), 30);
}

const zuSlug = (s) => String(s).toLowerCase()
  .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c]))
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function loescheSeite(s) {
  const veroeffentlicht = s.status === 'published';
  frage({
    titel: `„${s.title}" löschen?`,
    text: veroeffentlicht
      ? 'Diese Seite ist öffentlich. Sag, wohin ihre Adresse künftig führen soll — sonst laufen alte Links ins Leere.'
      : 'Die Seite ist ein Entwurf und war nie öffentlich. Sie wird ersatzlos gelöscht.',
    knopf: 'Endgültig löschen', gefahr: true,
    felder: veroeffentlicht
      ? [{ name: 'ziel', label: 'Künftig umleiten nach', wert: '/', platzhalter: '/' }] : [],
    dann: async (w) => {
      const q = veroeffentlicht ? `?ziel=${encodeURIComponent(w.ziel || '/')}` : '';
      await api(`/pages/${s.id}${q}`, { method: 'DELETE' });
      melde(veroeffentlicht ? 'Gelöscht, Umleitung angelegt.' : 'Gelöscht.');
      zeigeSeiten();
    },
  });
}

// ══════════════════════════════════════════════ SEITE BEARBEITEN
let AKTUELL = null;

async function oeffneSeite(id) {
  AKTUELL = await api(`/pages/${id}`);
  const typ = SCHEMA.typen.find((t) => t.name === AKTUELL.page_type) || { allowedBlocks: [] };
  const pfad = AKTUELL.page_type === 'beitrag' ? `/aktuelles/${AKTUELL.slug}/`
             : AKTUELL.slug === 'start' ? '/' : `/${AKTUELL.slug}/`;

  const felder = {
    title: el('input', { value: AKTUELL.title || '' }),
    slug: el('input', { value: AKTUELL.slug || '' }),
    description: el('textarea', { style: 'min-height:62px' }),
    og_image: el('input', { value: AKTUELL.og_image || '', placeholder: '/uploads/…' }),
  };
  felder.description.value = AKTUELL.description || '';

  const blockBereich = el('div', { id: 'bloecke' });
  const zeichnen = () => blockBereich.replaceChildren(
    ...AKTUELL.content_json.blocks.map((b, i) => blockKarte(b, i, zeichnen)));
  zeichnen();

  const sammeln = () => ({
    title: felder.title.value, slug: felder.slug.value,
    description: felder.description.value, og_image: felder.og_image.value,
    content_json: AKTUELL.content_json,
  });

  const speichern = async (status) => {
    try {
      const r = await api(`/pages/${AKTUELL.id}`, { method: 'PUT',
        body: JSON.stringify({ ...sammeln(), status: status || AKTUELL.status }) });
      if (status) AKTUELL.status = status;
      if (r.slug !== AKTUELL.slug) {
        melde('Gespeichert. Die alte Adresse leitet jetzt auf die neue um.');
        AKTUELL.slug = r.slug;
      } else melde(status === 'published' ? 'Veröffentlicht. Sie ist jetzt öffentlich.' : 'Gespeichert.');
      oeffneSeite(AKTUELL.id);
    } catch (err) { melde(err.message, 'fehler'); }
  };

  $('#buehne').replaceChildren(
    el('div', { class: 'kopfzeile' },
      el('button', { text: '← Seiten', onclick: zeigeSeiten }),
      el('h1', { text: AKTUELL.title || '(ohne Titel)' }),
      el('span', { class: 'marker ' + AKTUELL.status, text: statusWort(AKTUELL.status) }),
      el('div', { class: 'rechts' },
        el('a', { href: AKTUELL.status === 'published' ? pfad : `/vorschau/${AKTUELL.id}`, target: '_blank' },
          el('button', { text: 'Vorschau ↗' })),
        el('button', { text: 'Speichern', onclick: () => speichern(
          AKTUELL.status === 'published' ? 'published' : 'edited') }),
        AKTUELL.status === 'published'
          ? el('button', { text: 'Zurückziehen', onclick: () => speichern('draft') })
          : el('button', { class: 'gelb', text: 'Veröffentlichen', onclick: () => speichern('published') }))),

    el('div', { class: 'karte' },
      el('div', { class: 'gitter2' },
        el('div', {}, el('label', { text: 'Titel' }), felder.title),
        el('div', {}, el('label', { text: 'Adresse' }), felder.slug,
          el('p', { class: 'hinweis', text: 'Änderst du sie, legt der Motor automatisch eine Umleitung an.' }))),
      el('div', { style: 'margin-top:14px' },
        el('label', { text: 'Beschreibung für Google und beim Teilen' }), felder.description,
        el('p', { class: 'hinweis', text: 'Rund 150 Zeichen. Was hier steht, liest jemand im Suchergebnis.' })),
      el('div', { style: 'margin-top:14px' },
        el('label', { text: 'Vorschaubild beim Teilen' }),
        el('div', { class: 'zeile' },
          felder.og_image,
          el('button', { type: 'button', class: 'klein', text: 'Aus Medien wählen',
            onclick: () => waehleBild((p) => { felder.og_image.value = p; }) })))),

    el('h2', { style: 'margin:24px 0 10px', text: 'Bausteine' }),
    blockBereich,
    el('div', { class: 'karte' },
      el('div', { class: 'zeile' },
        el('span', { class: 'hinweis', text: 'Baustein hinzufügen:' }),
        ...(typ.allowedBlocks || []).map((name) => el('button', { class: 'klein', text: bausteinVon(name)?.label || name,
          onclick: () => {
            AKTUELL.content_json.blocks.push({ type: name, data: vorgabenVon(name) });
            zeichnen();
          } })))),
  );
}

const vorgabenVon = (name) => Object.fromEntries(
  Object.entries(bausteinVon(name)?.schema || {}).map(([k, v]) => [k, v.default]));

function blockKarte(block, i, neuZeichnen) {
  const def = bausteinVon(block.type);
  const verschieben = (d) => {
    const l = AKTUELL.content_json.blocks;
    const j = i + d;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    neuZeichnen();
  };
  return el('div', { class: 'block' },
    el('div', { class: 'block__kopf' },
      el('span', { class: 'name', text: def?.label || block.type }),
      el('span', { class: 'typ', text: block.type }),
      el('div', { class: 'rechts' },
        el('button', { class: 'klein', text: '↑', title: 'nach oben', onclick: () => verschieben(-1) }),
        el('button', { class: 'klein', text: '↓', title: 'nach unten', onclick: () => verschieben(1) }),
        el('button', { class: 'klein gefahr', text: 'Entfernen', onclick: () => {
          AKTUELL.content_json.blocks.splice(i, 1); neuZeichnen();
        } }))),
    el('div', { class: 'block__leib' },
      ...(def ? Object.entries(def.schema) : []).map(([feld, art]) =>
        feldBauen(block, feld, art))));
}

/** Das Formular kommt aus dem Schema. Neues Feld im Baustein → erscheint hier von selbst. */
function feldBauen(block, feld, art) {
  const wert = block.data?.[feld] ?? art.default;
  const setze = (v) => { (block.data ||= {})[feld] = v; };

  if (art.type === 'auto') {
    return el('div', { class: 'feldreihe' },
      el('label', { text: art.label }),
      el('p', { class: 'hinweis', text: 'Kommt aus der Datenbank und wird hier nicht gepflegt.' }));
  }

  if (art.type === 'liste') return listenFeld(block, feld, art, wert);

  if (art.type === 'image') {
    const i = el('input', { value: wert || '', oninput: (e) => setze(e.target.value) });
    return el('div', { class: 'feldreihe' }, el('label', { text: art.label }),
      el('div', { class: 'zeile' }, i,
        el('button', { type: 'button', class: 'klein', text: 'Bild wählen',
          onclick: () => waehleBild((p) => { i.value = p; setze(p); }) })));
  }

  if (art.type === 'auswahl') {
    const s = el('select', { onchange: (e) => setze(e.target.value) },
      ...(art.optionen || []).map((o) => el('option', { value: o, text: o, selected: o === wert })));
    return el('div', { class: 'feldreihe' }, el('label', { text: art.label }), s);
  }

  const steuer = art.type === 'longtext'
    ? el('textarea', { oninput: (e) => setze(e.target.value) })
    : el('input', { value: wert ?? '', oninput: (e) => setze(e.target.value) });
  if (art.type === 'longtext') steuer.value = wert ?? '';
  return el('div', { class: 'feldreihe' }, el('label', { text: art.label }), steuer);
}

/** Listen: Absätze als Zeilen, Objekte mit eigenen Unterfeldern. */
function listenFeld(block, feld, art, wert) {
  const liste = Array.isArray(wert) ? [...wert] : [];
  (block.data ||= {})[feld] = liste;
  const bereich = el('div', {});

  const zeichnen = () => bereich.replaceChildren(...liste.map((eintrag, i) => {
    const entfernen = el('button', { type: 'button', class: 'klein gefahr', text: 'Entfernen',
      onclick: () => { liste.splice(i, 1); zeichnen(); } });
    const hoch = el('button', { type: 'button', class: 'klein', text: '↑', onclick: () => {
      if (i === 0) return; [liste[i - 1], liste[i]] = [liste[i], liste[i - 1]]; zeichnen();
    } });

    if (typeof eintrag === 'string' || Array.isArray(eintrag)) {
      const t = el('textarea', { style: 'min-height:70px',
        oninput: (e) => { liste[i] = e.target.value; } });
      t.value = Array.isArray(eintrag) ? eintrag.join(' · ') : eintrag;
      return el('div', { class: 'unterliste' }, t,
        el('div', { class: 'zeile', style: 'margin-top:8px' }, hoch, entfernen));
    }

    const schluessel = [...new Set([...Object.keys(eintrag),
      ...vorlageSchluessel(block.type, feld)])];
    return el('div', { class: 'unterliste' },
      ...schluessel.map((k) => {
        const i2 = el('input', { value: eintrag[k] ?? '',
          oninput: (e) => { liste[i][k] = e.target.value; } });
        return el('div', { class: 'feldreihe' }, el('label', { text: k }), i2);
      }),
      el('div', { class: 'zeile' }, hoch, entfernen));
  }));
  zeichnen();

  return el('div', { class: 'feldreihe' },
    el('label', { text: art.label }),
    bereich,
    el('div', { class: 'zeile' },
      el('button', { type: 'button', class: 'klein', text: '+ Eintrag', onclick: () => {
        const v = vorlageSchluessel(block.type, feld);
        liste.push(v.length ? Object.fromEntries(v.map((k) => [k, ''])) : '');
        zeichnen();
      } })));
}

/** Welche Unterfelder ein Listen-Eintrag hat — aus dem Label im Schema gelesen. */
function vorlageSchluessel(blockTyp, feld) {
  const label = bausteinVon(blockTyp)?.schema?.[feld]?.label || '';
  const m = label.match(/:\s*(.+)$/);
  if (!m) return [];
  return m[1].split(',').map((s) => s.trim()).filter((s) => /^[a-zA-Z]+$/.test(s));
}

// ══════════════════════════════════════════════ NAVIGATION
async function zeigeNavigation() {
  const [punkte, seiten, pruefung] = await Promise.all([
    api('/navigation'), api('/pages'), api('/navigation/pruefung')]);
  const arbeit = punkte.length ? punkte.map((p) => ({ ...p })) : [];

  const liste = el('div', {});
  const zeichnen = () => liste.replaceChildren(...['kopf', 'fuss'].map((ort) => el('div', {},
    el('h2', { style: 'margin:18px 0 8px',
      text: ort === 'kopf' ? 'Im Menü oben' : 'In der Fußzeile' }),
    ...arbeit.filter((p) => p.ort === ort).map((p) => navZeile(p, arbeit, zeichnen)),
    arbeit.some((p) => p.ort === ort) ? null
      : el('p', { class: 'hinweis', text: 'Noch nichts. Zieh unten eine Seite herein.' }))));
  zeichnen();

  $('#buehne').replaceChildren(
    el('div', { class: 'kopfzeile' },
      el('h1', { text: 'Navigation' }),
      el('div', { class: 'rechts' },
        el('button', { class: 'stark', text: 'Menü speichern', onclick: async () => {
          try {
            await api('/navigation', { method: 'PUT', body: JSON.stringify({ punkte: arbeit }) });
            melde('Menü gespeichert.'); zeigeNavigation();
          } catch (err) { melde(err.message, 'fehler'); }
        } }))),
    el('p', { class: 'hinweis', style: 'margin-bottom:14px',
      text: 'Die Reihenfolge ist Redaktion, keine Technik. Sortiere so, wie jemand suchen würde.' }),
    ...(pruefung.warnungen.length ? [el('div', { class: 'warnbox' },
      el('strong', { text: 'Menüpunkte, die ins Leere zeigen: ' }),
      el('span', { text: pruefung.warnungen.map((w) => `„${w.label}" → ${w.href}`).join(' · ') }),
      el('p', { style: 'margin-top:6px',
        text: 'Sie werden auf der Website versteckt, bis das Ziel wieder da ist.' }))] : []),
    liste,
    el('div', { class: 'karte', style: 'margin-top:20px' },
      el('h3', { text: 'Hinzufügen' }),
      el('p', { class: 'hinweis', style: 'margin-bottom:10px',
        text: 'Veröffentlichte Seiten — klick eine an, um sie ins Menü zu hängen.' }),
      el('div', { class: 'zeile' },
        ...seiten.filter((s) => s.status === 'published' && s.page_type !== 'beitrag')
          .map((s) => el('button', { class: 'klein', text: s.title, onclick: () => {
            arbeit.push({ id: crypto.randomUUID(), ort: 'kopf', label: s.title,
              href: s.slug === 'start' ? '/' : `/${s.slug}/`, visible: true });
            zeichnen();
          } })),
        el('button', { class: 'klein', text: '+ Eigener Link', onclick: () => {
          frage({ titel: 'Eigener Menüpunkt', knopf: 'Hinzufügen',
            felder: [{ name: 'label', label: 'Beschriftung' },
                     { name: 'href', label: 'Ziel', platzhalter: 'https://… oder /seite/' }],
            dann: async (w) => {
              if (!w.label || !w.href) throw new Error('Beschriftung und Ziel brauchen beide etwas.');
              arbeit.push({ id: crypto.randomUUID(), ort: 'kopf', label: w.label,
                href: w.href, visible: true });
              zeichnen();
            } });
        } }))));
}

function navZeile(p, arbeit, zeichnen) {
  const tauschen = (d) => {
    const i = arbeit.indexOf(p);
    const gleiche = arbeit.filter((x) => x.ort === p.ort);
    const j = gleiche.indexOf(p) + d;
    if (j < 0 || j >= gleiche.length) return;
    const k = arbeit.indexOf(gleiche[j]);
    [arbeit[i], arbeit[k]] = [arbeit[k], arbeit[i]];
    zeichnen();
  };
  return el('div', { class: 'karte' }, el('div', { class: 'zeile' },
    el('div', { style: 'min-width:190px' },
      el('input', { value: p.label, oninput: (e) => { p.label = e.target.value; } })),
    el('span', { class: 'pfad', text: p.href }),
    el('div', { class: 'rechts' },
      el('button', { class: 'klein', text: '↑', onclick: () => tauschen(-1) }),
      el('button', { class: 'klein', text: '↓', onclick: () => tauschen(1) }),
      el('button', { class: 'klein', text: p.ort === 'kopf' ? 'in die Fußzeile' : 'ins Menü',
        onclick: () => { p.ort = p.ort === 'kopf' ? 'fuss' : 'kopf'; zeichnen(); } }),
      el('button', { class: 'klein gefahr', text: 'Entfernen',
        onclick: () => { arbeit.splice(arbeit.indexOf(p), 1); zeichnen(); } }))));
}

// ══════════════════════════════════════════════ MEDIEN
async function zeigeMedien() {
  const medien = await api('/media');
  const datei = el('input', { type: 'file', accept: '.webp,.jpg,.jpeg,.png,.svg,.gif',
    style: 'max-width:340px', onchange: async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        await api(`/media?name=${encodeURIComponent(f.name)}`,
          { method: 'POST', body: await f.arrayBuffer() });
        melde('Hochgeladen. Trag jetzt den Alt-Text ein.');
        zeigeMedien();
      } catch (err) { melde(err.message, 'fehler'); }
    } });

  $('#buehne').replaceChildren(
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Medien' }),
      el('div', { class: 'rechts' }, datei)),
    el('p', { class: 'hinweis', style: 'margin-bottom:16px',
      text: 'Der Alt-Text beschreibt, was auf dem Bild zu sehen ist. Ohne ihn ist das Bild für einen Vorleser nicht vorhanden.' }),
    medien.length
      ? el('div', { class: 'medien' }, ...medien.map(medienKachel))
      : el('p', { class: 'leer', text: 'Noch keine Bilder.' }));
}

function medienKachel(m) {
  const alt = el('input', { value: m.alt || '', placeholder: 'Alt-Text …',
    onchange: async (e) => {
      await api(`/media/${m.id}`, { method: 'PUT', body: JSON.stringify({ alt: e.target.value }) });
      melde('Alt-Text gespeichert.');
    } });
  return el('div', { class: 'medium' },
    el('img', { src: m.file_path, alt: m.alt || '' }),
    el('div', { class: 'u' }, alt,
      el('div', { class: 'zeile', style: 'margin-top:7px' },
        el('span', { class: 'hinweis', text: `${Math.round((m.bytes || 0) / 1024)} KB` }),
        el('div', { class: 'rechts' },
          el('button', { class: 'klein', text: 'Pfad kopieren', onclick: () => {
            navigator.clipboard?.writeText(m.file_path); melde('Pfad kopiert.');
          } }),
          el('button', { class: 'klein gefahr', text: '×', title: 'Löschen', onclick: async () => {
            try { await api(`/media/${m.id}`, { method: 'DELETE' }); melde('Gelöscht.'); zeigeMedien(); }
            catch (err) { melde(err.message, 'fehler'); }
          } })))));
}

/** Auswahlfenster, damit niemand Pfade tippt. */
async function waehleBild(dann) {
  const medien = await api('/media');
  fenster([
    el('h2', { text: 'Bild wählen' }),
    medien.length
      ? el('div', { class: 'medien', style: 'margin-top:14px' }, ...medien.map((m) =>
          el('div', { class: 'medium', style: 'cursor:pointer',
            onclick: () => { dann(m.file_path); fensterZu(); melde('Bild eingesetzt.'); } },
            el('img', { src: m.file_path, alt: m.alt || '' }),
            el('div', { class: 'u' }, el('span', { class: 'hinweis',
              text: m.alt || '⚠ kein Alt-Text' })))))
      : el('p', { class: 'leer', text: 'Noch keine Bilder. Lade zuerst welche unter „Medien" hoch.' }),
    el('div', { class: 'zeile', style: 'margin-top:16px' },
      el('button', { text: 'Abbrechen', onclick: fensterZu }))]);
}

// ══════════════════════════════════════════════ ANFRAGEN
async function zeigeAnfragen() {
  const liste = await api('/submissions');
  $('#buehne').replaceChildren(
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Anfragen' }),
      el('span', { class: 'hinweis', text: `${liste.filter((a) => !a.gelesen).length} ungelesen` })),
    liste.length ? el('div', {}, ...liste.map(anfrageKarte))
      : el('p', { class: 'leer', text: 'Noch keine Anfragen.' }));
  zaehlerFrischen();
}

function anfrageKarte(a) {
  return el('div', { class: 'karte', style: a.gelesen ? 'opacity:.62' : '' },
    el('div', { class: 'zeile' },
      el('div', {},
        el('h3', { text: a.form }),
        el('span', { class: 'hinweis',
          text: new Date(a.created_at).toLocaleString('de-DE') + (a.page_slug ? ` · von ${a.page_slug}` : '') })),
      el('div', { class: 'rechts' },
        el('button', { class: 'klein', text: a.gelesen ? 'Als ungelesen' : 'Als gelesen',
          onclick: async () => {
            await api(`/submissions/${a.id}`, { method: 'PUT',
              body: JSON.stringify({ gelesen: !a.gelesen }) });
            zeigeAnfragen();
          } }))),
    el('table', { style: 'margin-top:10px' }, ...Object.entries(a.daten)
      .filter(([k]) => k !== '_seite')
      .map(([k, v]) => el('tr', {}, el('th', { style: 'width:150px', text: k }),
        el('td', { text: String(v) })))));
}

// ══════════════════════════════════════════════ UMLEITUNGEN
async function zeigeUmleitungen() {
  const liste = await api('/redirects');
  $('#buehne').replaceChildren(
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Umleitungen' }),
      el('div', { class: 'rechts' },
        el('button', { class: 'stark', text: '+ Neue Umleitung', onclick: () => frage({
          titel: 'Neue Umleitung', knopf: 'Anlegen',
          text: 'Wer die alte Adresse aufruft, landet künftig auf der neuen.',
          felder: [{ name: 'from_path', label: 'Alte Adresse', platzhalter: '/alte-seite/' },
                   { name: 'to_path', label: 'Neue Adresse', platzhalter: '/neue-seite/' }],
          dann: async (w) => {
            await api('/redirects', { method: 'POST', body: JSON.stringify(w) });
            melde('Angelegt.'); zeigeUmleitungen();
          } }) }))),
    el('p', { class: 'hinweis', style: 'margin-bottom:14px',
      text: 'Benennst du eine veröffentlichte Seite um oder löschst sie, legt der Motor den Eintrag hier von selbst an.' }),
    liste.length ? el('div', { class: 'karte' }, el('table', {},
      el('tr', {}, el('th', { text: 'Von' }), el('th', { text: 'Nach' }),
        el('th', { text: 'Art' }), el('th', {})),
      ...liste.map((r) => el('tr', {},
        el('td', {}, el('span', { class: 'pfad', text: r.from_path }),
          r.ueberschattet ? el('p', { class: 'hinweis', style: 'color:var(--warnung)',
            text: 'Greift nicht — unter dieser Adresse liegt inzwischen eine echte Seite.' }) : null),
        el('td', {}, el('span', { class: 'pfad', text: r.to_path })),
        el('td', { text: r.code === 302 ? 'vorübergehend' : 'dauerhaft' }),
        el('td', {}, el('button', { class: 'klein gefahr', text: 'Löschen', onclick: async () => {
          await api('/redirects', { method: 'DELETE', body: JSON.stringify({ from_path: r.from_path }) });
          melde('Gelöscht.'); zeigeUmleitungen();
        } }))))))
      : el('p', { class: 'leer', text: 'Noch keine Umleitungen.' }));
}

// ══════════════════════════════════════════════ FAKTEN
async function zeigeFakten() {
  const { datei, override } = await api('/config/facts');
  const arbeit = JSON.parse(JSON.stringify(override || {}));

  const wertSetzen = (pfad, v) => {
    const teile = pfad.split('.');
    let o = arbeit;
    for (const t of teile.slice(0, -1)) o = (o[t] ||= {});
    o[teile.at(-1)] = v;
  };
  const wertLesen = (pfad) => pfad.split('.').reduce((o, k) => (o ?? {})[k], arbeit);

  const gruppen = Object.entries(datei).filter(([k]) => !k.startsWith('_'));

  $('#buehne').replaceChildren(
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Fakten' }),
      el('div', { class: 'rechts' },
        el('button', { class: 'stark', text: 'Speichern', onclick: async () => {
          try {
            await api('/config/facts', { method: 'PUT', body: JSON.stringify({ override: arbeit }) });
            melde('Gespeichert. Die Website zeigt die neuen Werte sofort.');
            zeigeFakten();
          } catch (err) { melde(err.message, 'fehler'); }
        } }))),
    el('div', { class: 'gutbox' },
      el('strong', { text: 'Hier änderst du Zahlen ohne Entwickler. ' }),
      el('span', { text: 'Was du hier einträgst, erscheint überall auf der Website, wo die Zahl steht — ' }),
      el('span', { text: 'auf allen Seiten gleichzeitig. Leer lassen heißt: der Grundwert aus der Datei gilt.' })),
    ...gruppen.map(([gruppe, werte]) => faktenGruppe(gruppe, werte, '', wertLesen, wertSetzen)));
}

function faktenGruppe(name, werte, prefix, lesen, setzen) {
  const pfad = prefix ? `${prefix}.${name}` : name;
  if (typeof werte !== 'object' || werte === null) return null;

  const einfach = Object.entries(werte).filter(([k, v]) =>
    !k.startsWith('_') && (typeof v !== 'object' || v === null));
  const tiefer = Object.entries(werte).filter(([k, v]) =>
    !k.startsWith('_') && typeof v === 'object' && v !== null);

  return el('div', { class: 'karte' },
    el('h2', { text: huebsch(name) }),
    einfach.length ? el('div', { class: 'gitter2', style: 'margin-top:12px' },
      ...einfach.map(([k, grundwert]) => {
        const p = `${pfad}.${k}`;
        const i = el('input', { value: lesen(p) ?? '', placeholder: grundwert || '(leer)',
          oninput: (e) => setzen(p, e.target.value) });
        return el('div', {}, el('label', { text: huebsch(k) }), i,
          grundwert ? el('p', { class: 'hinweis', text: `Grundwert: ${grundwert}` })
                    : el('p', { class: 'hinweis', style: 'color:var(--warnung)',
                        text: 'Fehlt — erscheint als […] auf der Seite' }));
      })) : null,
    ...tiefer.map(([k, v]) => el('div', { style: 'margin-top:14px' },
      faktenGruppe(k, v, pfad, lesen, setzen))));
}

const huebsch = (s) => String(s).replace(/_/g, ' ')
  .replace(/^./, (c) => c.toUpperCase());

// ══════════════════════════════════════════════ GENERATOR
async function zeigeGenerator() {
  const stand = await api('/generator');

  const typWahl = el('select', {}, ...stand.typen
    .filter((t) => t.name !== 'aktuelles')
    .map((t) => el('option', { value: t.name, text: t.label })));
  typWahl.value = 'beitrag';

  const quelle = el('textarea', { style: 'min-height:220px',
    placeholder: 'Notizen, Stichworte, ein Protokoll, drei Sätze nach dem Spieltag …\n\n'
      + 'Je konkreter, desto besser. Namen, Ergebnisse, was besonders war.' });
  const anmerkung = el('input', { placeholder: 'Optional: „kurz halten" oder „mehr über die Jugend"' });
  const ergebnisBereich = el('div', {});

  const knopf = el('button', { class: 'stark', text: 'Entwurf erzeugen', onclick: async () => {
    if (quelle.value.trim().length < 30) {
      return melde('Zu wenig Rohmaterial. Ein paar Sätze mindestens.', 'fehler');
    }
    knopf.disabled = true;
    knopf.textContent = 'Schreibt …';
    ergebnisBereich.replaceChildren(el('p', { class: 'hinweis',
      text: 'Das dauert zwanzig bis vierzig Sekunden.' }));
    try {
      const r = await api('/generator', { method: 'POST', body: JSON.stringify({
        quelle: quelle.value, typ: typWahl.value, anmerkung: anmerkung.value }) });
      zeigeErgebnis(r, typWahl.value, ergebnisBereich);
    } catch (err) {
      ergebnisBereich.replaceChildren(el('div', { class: 'warnbox' },
        el('strong', { text: 'Hat nicht geklappt: ' }), el('span', { text: err.message })));
    } finally {
      knopf.disabled = false;
      knopf.textContent = 'Entwurf erzeugen';
    }
  } });

  $('#buehne').replaceChildren(
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Generator' })),

    stand.bereit
      ? el('div', { class: 'gutbox' },
          el('strong', { text: 'Aus Notizen wird ein Entwurf. ' }),
          el('span', { text: 'Das Ergebnis ist nie sofort öffentlich — es landet als Entwurf, '
            + 'den du liest, änderst und dann selbst veröffentlichst.' }))
      : el('div', { class: 'warnbox' },
          el('strong', { text: 'Nicht eingerichtet. ' }),
          el('span', { text: 'In der Datei .env fehlt ANTHROPIC_API_KEY.' })),

    el('div', { class: 'karte' },
      el('div', { class: 'feldreihe' }, el('label', { text: 'Was soll entstehen?' }), typWahl),
      el('div', { class: 'feldreihe' }, el('label', { text: 'Rohmaterial' }), quelle,
        el('p', { class: 'hinweis',
          text: 'Zahlen über den Verein — Beiträge, Telefonnummern, Adressen — musst du nicht '
              + 'nennen. Die holt sich der Generator aus den Fakten.' })),
      el('div', { class: 'feldreihe' }, el('label', { text: 'Zusätzliche Anweisung' }), anmerkung),
      el('div', { class: 'zeile' }, knopf)),

    ergebnisBereich);
}

function zeigeErgebnis(r, typ, bereich) {
  const slug = el('input', { value: zuSlug(r.title) });
  const titel = el('input', { value: r.title });
  const beschreibung = el('textarea', { style: 'min-height:56px' });
  beschreibung.value = r.description;

  const vorschau = (b) => {
    const d = b.data || {};
    const text = [d.titel, d.sub, ...(d.absaetze || [])].filter(Boolean).join('\n\n');
    return el('div', { class: 'block' },
      el('div', { class: 'block__kopf' },
        el('span', { class: 'name', text: bausteinVon(b.type)?.label || b.type }),
        el('span', { class: 'typ', text: b.type })),
      text ? el('div', { class: 'block__leib' },
        ...text.split('\n\n').map((a) => el('p', { style: 'margin-bottom:9px', text: a })))
           : null);
  };

  bereich.replaceChildren(
    el('h2', { style: 'margin:24px 0 10px', text: 'Der Entwurf' }),

    r.hinweise.length ? el('div', { class: 'warnbox' },
      el('strong', { text: 'Was du prüfen solltest:' }),
      el('ul', { style: 'margin:6px 0 0;padding-left:18px' },
        ...r.hinweise.map((h) => el('li', { text: h })))) : null,

    r.unbekannteFelder.length ? el('div', { class: 'warnbox' },
      el('strong', { text: 'Erfundene Felder, werden verworfen: ' }),
      el('span', { text: r.unbekannteFelder.join(', ') })) : null,

    el('div', { class: 'karte' },
      el('div', { class: 'gitter2' },
        el('div', {}, el('label', { text: 'Titel' }), titel),
        el('div', {}, el('label', { text: 'Adresse' }), slug)),
      el('div', { style: 'margin-top:14px' },
        el('label', { text: 'Beschreibung' }), beschreibung)),

    ...r.content_json.blocks.map(vorschau),

    el('div', { class: 'karte' }, el('div', { class: 'zeile' },
      el('button', { class: 'stark', text: 'Als Entwurf übernehmen', onclick: async () => {
        try {
          const neu = await api('/generator/uebernehmen', { method: 'POST',
            body: JSON.stringify({ slug: slug.value, page_type: typ, title: titel.value,
              description: beschreibung.value, content_json: r.content_json }) });
          melde('Übernommen. Du kannst sie jetzt bearbeiten und veröffentlichen.');
          location.hash = '#seiten';
          setTimeout(() => oeffneSeite(neu.id), 120);
        } catch (err) { melde(err.message, 'fehler'); }
      } }),
      el('span', { class: 'hinweis',
        text: 'Landet als Entwurf. Öffentlich wird sie erst, wenn du sie veröffentlichst.' }))));
}

// ══════════════════════════════════════════════ ASSISTENT
async function zeigeAssistent() {
  const [stand, fragen, seiten] = await Promise.all([
    api('/assistent'), api('/assistent/fragen'), api('/pages')]);

  const ohneTreffer = fragen.filter((f) => !f.gefunden);

  $('#buehne').replaceChildren(
    el('div', { class: 'kopfzeile' },
      el('h1', { text: 'Assistent' }),
      el('div', { class: 'rechts' },
        el('button', { text: 'Index neu bauen', onclick: async () => {
          const r = await api('/assistent/neu-indizieren', { method: 'POST' });
          melde(`${r.stuecke} Stücke aus ${r.seiten} Seiten.`);
          zeigeAssistent();
        } }))),

    stand.bereit
      ? el('div', { class: 'gutbox' },
          el('strong', { text: 'Der Assistent läuft. ' }),
          el('span', { text: `${stand.stuecke} durchsuchbare Stücke aus ${stand.seiten} Seiten. ` }),
          el('span', { text: 'Er antwortet ausschließlich aus dem, was auf der Website steht.' }))
      : el('div', { class: 'warnbox' },
          el('strong', { text: 'Noch nicht eingerichtet. ' }),
          el('span', { text: 'In der Datei .env fehlt ANTHROPIC_API_KEY. ' }),
          el('span', { text: 'Bis dahin erscheint auf der Website kein Chatfenster — sonst nichts.' })),

    el('h2', { style: 'margin:24px 0 8px', text: 'Was gefragt wurde' }),
    el('p', { class: 'hinweis', style: 'margin-bottom:12px',
      text: 'Der nützlichste Teil: du siehst, was Leute wissen wollen. '
          + 'Fragen ohne Treffer sind Lücken auf der Website.' }),

    ...(ohneTreffer.length ? [el('div', { class: 'warnbox' },
      el('strong', { text: `${ohneTreffer.length} Fragen ohne Treffer: ` }),
      el('span', { text: ohneTreffer.slice(0, 6).map((f) => `„${f.frage}"`).join(' · ') }),
      el('p', { style: 'margin-top:6px',
        text: 'Steht die Antwort wirklich nirgends? Dann fehlt sie auf der Website.' }))] : []),

    fragen.length
      ? el('div', { class: 'karte' }, el('table', {},
          el('tr', {}, el('th', { style: 'width:34%', text: 'Frage' }),
            el('th', { text: 'Antwort' }), el('th', { style: 'width:70px', text: 'Quellen' })),
          ...fragen.slice(0, 60).map((f) => el('tr', {},
            el('td', {}, el('div', { text: f.frage }),
              el('span', { class: 'hinweis',
                text: new Date(f.created_at).toLocaleString('de-DE') })),
            el('td', { class: 'hinweis', text: (f.antwort || '').slice(0, 220) }),
            el('td', {}, f.gefunden
              ? el('span', { text: String(f.gefunden) })
              : el('span', { class: 'marker', style: 'background:#fdeeea;color:var(--warnung)',
                  text: 'keine' }))))))
      : el('p', { class: 'leer', text: 'Noch keine Fragen.' }),

    el('h2', { style: 'margin:24px 0 8px', text: 'Seiten aus dem Index nehmen' }),
    el('p', { class: 'hinweis', style: 'margin-bottom:12px',
      text: 'Impressum, Datenschutz und ähnliche Seiten verwässern jede Antwort. '
          + 'Vorgabe: alles ist drin, du nimmst heraus.' }),
    el('div', { class: 'karte' }, el('table', {},
      ...seiten.filter((p) => p.status === 'published').map((p) => {
        const aus = stand.ausgenommen.some((a) => a.slug === p.slug);
        return el('tr', {},
          el('td', { text: p.title }),
          el('td', { style: 'width:150px' }, el('button', { class: 'klein',
            text: aus ? 'Wieder aufnehmen' : 'Herausnehmen',
            onclick: async () => {
              await api(`/assistent/ausnehmen/${p.id}`, { method: 'PUT',
                body: JSON.stringify({ ausnehmen: !aus }) });
              melde(aus ? 'Wieder im Index.' : 'Aus dem Index genommen.');
              zeigeAssistent();
            } })));
      }))));
}

// ══════════════════════════════════════════════ AUFRUFE
async function zeigeAufrufe() {
  const { seiten, tage } = await api('/aufrufe');
  const gesamt = seiten.reduce((s, z) => s + z.anzahl, 0);
  const hoechster = Math.max(1, ...tage.map((t) => t.anzahl));

  $('#buehne').replaceChildren(
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Aufrufe' }),
      el('span', { class: 'hinweis', text: 'letzte 30 Tage' })),
    el('div', { class: 'gutbox' },
      el('strong', { text: 'Ohne Cookies, ohne IP, ohne fremden Dienst. ' }),
      el('span', { text: 'Gespeichert wird nur: welche Seite, an welchem Tag, wie oft. '
        + 'Deshalb braucht es kein Einwilligungsbanner.' })),

    el('div', { class: 'karte' },
      el('h2', { text: `${gesamt.toLocaleString('de-DE')} Aufrufe` }),
      tage.length
        ? el('div', { style: 'display:flex;gap:2px;align-items:flex-end;height:90px;margin-top:14px' },
            ...tage.map((t) => el('div', {
              title: `${t.tag}: ${t.anzahl}`,
              style: `flex:1;min-width:3px;background:var(--signal);border-radius:2px 2px 0 0;`
                   + `height:${Math.max(3, Math.round((t.anzahl / hoechster) * 90))}px` })))
        : el('p', { class: 'hinweis', text: 'Noch nichts gezählt.' })),

    el('h2', { style: 'margin:22px 0 10px', text: 'Meistgelesen' }),
    seiten.length
      ? el('div', { class: 'karte' }, el('table', {},
          el('tr', {}, el('th', { text: 'Seite' }), el('th', { style: 'width:90px;text-align:right', text: 'Aufrufe' })),
          ...seiten.map((z) => el('tr', {},
            el('td', {}, el('a', { href: z.pfad, target: '_blank' },
              el('span', { class: 'pfad', text: z.pfad }))),
            el('td', { style: 'text-align:right;font-variant-numeric:tabular-nums',
              text: z.anzahl.toLocaleString('de-DE') })))))
      : el('p', { class: 'leer', text: 'Noch keine Aufrufe.' }));
}

// ══════════════════════════════════════════════ HANDBUCH
function zeigeHandbuch() {
  $('#buehne').replaceChildren(
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Handbuch' })),
    el('p', { class: 'hinweis', style: 'margin-bottom:18px',
      text: 'Jeder Ablauf, den du von Hand machst — Schritt für Schritt, mit den Fallstricken.' }),
    ...HANDBUCH.map((a) => el('div', { class: 'karte' },
      el('h2', { text: a.titel }),
      el('p', { class: 'hinweis', style: 'margin-bottom:12px', text: a.wann }),
      el('ol', { style: 'margin:0;padding-left:20px;line-height:1.8' },
        ...a.schritte.map((s) => el('li', { html: s }))),
      a.motor ? el('div', { class: 'gutbox', style: 'margin-top:14px' },
        el('strong', { text: 'Das macht der Motor von allein: ' }),
        el('span', { text: a.motor })) : null,
      a.fallstricke?.length ? el('div', { class: 'warnbox', style: 'margin-top:10px' },
        el('strong', { text: 'Fallstricke: ' }),
        el('ul', { style: 'margin:6px 0 0;padding-left:18px' },
          ...a.fallstricke.map((f) => el('li', { html: f })))) : null)));
}

// ══════════════════════════════════════════════ GERÜST
const SEITEN = {
  seiten: zeigeSeiten, navigation: zeigeNavigation, medien: zeigeMedien,
  anfragen: zeigeAnfragen, umleitungen: zeigeUmleitungen,
  fakten: zeigeFakten, generator: zeigeGenerator,
  assistent: zeigeAssistent, aufrufe: zeigeAufrufe,
  handbuch: zeigeHandbuch,
};

async function gehe() {
  const ziel = (location.hash.slice(1) || 'seiten').split('/')[0];
  $$('nav a[data-ziel]').forEach((a) =>
    a.classList.toggle('aktiv', a.dataset.ziel === ziel));
  try { await (SEITEN[ziel] || zeigeSeiten)(); }
  catch (err) {
    if (err.status === 401) return zeigeAnmeldung();
    $('#buehne').replaceChildren(el('div', { class: 'warnbox', text: err.message }));
  }
}
window.addEventListener('hashchange', gehe);

async function zaehlerFrischen() {
  try {
    const { offen } = await api('/submissions/offen');
    const z = $('#anfragen-zahl');
    z.textContent = offen; z.hidden = !offen;
    const { warnungen } = await api('/navigation/pruefung');
    const w = $('#nav-warn');
    w.textContent = warnungen.length; w.hidden = !warnungen.length;
  } catch { /* nicht angemeldet */ }
}

function zeigeAnmeldung() {
  $('#anmeldung').style.display = 'grid';
  $('#cockpit').style.display = 'none';
}

async function start() {
  try {
    SCHEMA = await api('/schema');
  } catch (err) {
    if (err.status === 401) return zeigeAnmeldung();
    throw err;
  }
  $('#anmeldung').style.display = 'none';
  $('#cockpit').style.display = 'grid';
  $('#marke-zeichen').innerHTML = await (await fetch('/assets/ktc-zeichen.svg')).text();
  await gehe();
  zaehlerFrischen();
}

let fehlversuche = 0;

// „anzeigen" schaltet die Verdeckung um — damit ein Mensch sehen kann,
// WAS im Feld steht, statt zu raten, warum es nicht passt.
$('#pw-zeigen').addEventListener('click', () => {
  const feld = $('#ktc-zugang');
  const verdeckt = feld.dataset.verdeckt === '1';
  feld.dataset.verdeckt = verdeckt ? '0' : '1';
  $('#pw-zeigen').textContent = verdeckt ? 'verbergen' : 'anzeigen';
  feld.focus();
});
$('#anmeldeform').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#anmeldefehler').textContent = '';
  try {
    await api('/login', { method: 'POST', body: JSON.stringify({ passwort: $('#ktc-zugang').value }) });
    $('#ktc-zugang').value = '';
    start();
  } catch (err) {
    $('#anmeldefehler').textContent = err.message;
    // Nach dem zweiten Fehlversuch den haeufigsten Grund nennen, statt den
    // Menschen weiter raten zu lassen: ein Passwortmanager, der das Feld fuellt.
    fehlversuche += 1;
    if (fehlversuche >= 2) {
      const t = $('#anmeldetipp');
      t.textContent = 'Steht im Feld etwas, das du nicht getippt hast? Klick auf „anzeigen"'
        + ' und prüf es. Das Feld wehrt sich jetzt gegen Passwortmanager — wenn trotzdem'
        + ' etwas drinsteht, lösch es mit Cmd + A und tipp von Hand.';
      t.hidden = false;
    }
    $('#ktc-zugang').select();
  }
});

$('#abmelden').addEventListener('click', async (e) => {
  e.preventDefault();
  await api('/logout', { method: 'POST' });
  location.reload();
});

start();
