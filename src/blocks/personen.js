import { html, raw, escapeAttr, ziel } from './_util.js';

export default {
  name: 'personen',
  label: 'Ansprechpartner',
  schema: {
    titel:    { type: 'text',  default: '', label: 'Überschrift' },
    vorspann: { type: 'longtext', default: '', label: 'Zeile darunter' },
    anker:    { type: 'text', default: '', label: 'Sprungmarke, z. B. vorstand' },
    grund:    { type: 'auswahl', default: 'weiss', label: 'Hintergrund', optionen: ['weiss', 'ruhig'] },
    leute:    { type: 'liste', default: [], label: 'Personen: rolle, name, telefon, email' },
  },
  css: `
    .personen__titel { font-size: clamp(24px, 3vw, 32px); margin-bottom: 6px; }
    .personen__vorspann { color: var(--text-leise); margin-bottom: var(--raum-3); }
    .personen__gitter { display: grid; gap: var(--raum-2);
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
    .person { border: 1px solid var(--linie); border-radius: var(--radius); padding: 20px; }
    .section--ruhig .person { background: var(--grund); }
    .person__rolle { font-size: 13px; text-transform: uppercase; letter-spacing: .07em;
      color: var(--signal); margin-bottom: 4px; }
    /* 'Vorname NAME': der Nachname in Grossbuchstaben (per CSS — im Text steht er normal, ein
       Vorleser buchstabiert ihn nicht), fett und dunkler, der Vorname leiser. */
    /* Jeder Name in EINER Zeile: die Karte ist ein Container, die Schrift richtet sich nach
       ihrer Breite (7,9 % davon, zwischen 13 und 20 px; gemessen: der laengste Name braucht
       12,3 x Schriftgroesse). 'Markus MESSERSCHMITT' bricht sonst um. */
    .person { container-type: inline-size; }
    .person__name { font-size: clamp(13px, 7.9cqw, 20px); margin-bottom: 10px; white-space: nowrap; }
    .person__vorname { font-weight: 400; color: var(--text-leise); }
    .person__nachname { font-weight: 700; color: var(--text); text-transform: uppercase; letter-spacing: .02em; }
    /* Wie beim Namen: die laengste Adresse (30 Zeichen, gemessen 16,7 x Schriftgroesse) soll mit
       Reserve in die Karte passen. 5,9 % der Kartenbreite, hoechstens 15 px. Alle Karten sind gleich breit,
       also bekommen alle Zeilen dieselbe Groesse. */
    .person__kontakt { font-size: clamp(12px, 5.9cqw, 15px); }
    .person__kontakt a { color: var(--signal); text-decoration: none; display: block; }
    .person__kontakt a:hover { text-decoration: underline; }
  `,
  render(data) {
    // Der letzte Teil des Namens ist der Nachname; steht nur ein Wort da, bleibt es, wie es ist.
    const name = (n) => {
      const t = String(n || '').trim();
      const i = t.lastIndexOf(' ');
      return i < 0 ? t
        : html`<span class="person__vorname">${t.slice(0, i)}</span> <span class="person__nachname">${t.slice(i + 1)}</span>`;
    };
    const leute = (data.leute || []).map((p) => {
      const tel = ziel(`tel:${String(p.telefon || '').replace(/\s/g, '')}`);
      const mail = ziel(`mailto:${p.email || ''}`);
      return html`<article class="person">
        ${p.rolle ? html`<p class="person__rolle">${p.rolle}</p>` : ''}
        <p class="person__name">${name(p.name)}</p>
        <div class="person__kontakt">
          ${p.telefon ? html`<a href="${raw(escapeAttr(tel))}">${p.telefon}</a>` : ''}
          ${p.email ? html`<a href="${raw(escapeAttr(mail))}">${p.email}</a>` : ''}
        </div>
      </article>`;
    });
    return html`
      <section class="section${raw(data.grund === 'ruhig' ? ' section--ruhig' : '')}"${data.anker ? raw(` id="${escapeAttr(String(data.anker).toLowerCase().replace(/[^a-z0-9-]/g, ''))}"`) : ''}><div class="container">
        ${data.titel ? html`<h2 class="personen__titel">${data.titel}</h2>` : ''}
        ${data.vorspann ? html`<p class="personen__vorspann">${data.vorspann}</p>` : ''}
        <div class="personen__gitter">${leute}</div>
      </div></section>`;
  },
};
