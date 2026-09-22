export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export const escapeAttr = escapeHtml;

/** Markiert Zeichenketten, die schon sicher sind. */
export const raw = (v) => ({ __raw: true, value: v ?? '' });

/** html`…` escaped alles Eingesetzte, ausser es ist raw(). */
export function html(teile, ...werte) {
  let out = '';
  teile.forEach((t, i) => {
    out += t;
    const v = werte[i];
    if (v == null) return;
    if (Array.isArray(v)) {
      out += v.map((x) => (x && typeof x === 'object' && x.__raw ? x.value : escapeHtml(x))).join('');
      return;
    }
    out += v && typeof v === 'object' && v.__raw ? v.value : escapeHtml(v);
  });
  return raw(out);
}

/** Ziele: nur site-relativ, https, mailto, tel oder Anker. Nie javascript: oder data:. */
export const ziel = (href) => {
  const s = String(href || '').trim();
  return /^(\/(?!\/)|https:\/\/|mailto:|tel:|#)/.test(s) ? s : '';
};

/** Extern? Dann bekommt der Link ein Pfeilchen und rel="noopener". */
export const istExtern = (href) => /^https:\/\//.test(String(href || '').trim());

/** Sparsames Inline-Markdown: **fett**, *kursiv*, [text](ziel). Sonst nichts. */
export function markdownInline(text) {
  let s = escapeHtml(text);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
    const z = ziel(href);
    if (!z) return label;
    const extern = istExtern(z) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeAttr(z)}"${extern}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  return raw(s);
}
