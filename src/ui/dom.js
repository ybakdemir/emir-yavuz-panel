// Tiny DOM helpers — no framework, no build step.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  append(el, children);
  return el;
}

/** Null-safe variadic append: add(el, a, null, [b, c]) */
export function add(el, ...children) { return append(el, children); }

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function svg(inner, { size = 24, viewBox = '0 0 24 24', cls = '' } = {}) {
  const wrap = document.createElement('span');
  wrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}" class="${cls}" aria-hidden="true" focusable="false">${inner}</svg>`;
  return wrap.firstElementChild;
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export const pct = (v) => `${Math.round((v || 0) * 100)}%`;

/** Small confirm helper that returns a Promise<boolean> with our own sheet (no browser alert). */
export function confirmSheet({ title, body, ok = 'Evet', cancel = 'Vazgeç', danger = false }) {
  return new Promise((resolve) => {
    const close = (v) => { overlay.remove(); resolve(v); };
    const overlay = h('div', { class: 'sheet-overlay', onclick: (e) => { if (e.target === overlay) close(false); } },
      h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' },
        h('div', { class: 'sheet-title' }, title),
        body ? h('div', { class: 'sheet-body' }, body) : null,
        h('div', { class: 'sheet-actions' },
          h('button', { class: 'btn btn-ghost', onclick: () => close(false) }, cancel),
          h('button', { class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, onclick: () => close(true) }, ok))));
    document.body.append(overlay);
  });
}

/** Modal sheet with arbitrary content; returns a close() function. */
export function openSheet(content, { cls = '' } = {}) {
  const overlay = h('div', { class: 'sheet-overlay', onclick: (e) => { if (e.target === overlay) overlay.remove(); } },
    h('div', { class: `sheet ${cls}`, role: 'dialog', 'aria-modal': 'true' }, content));
  document.body.append(overlay);
  return () => overlay.remove();
}
