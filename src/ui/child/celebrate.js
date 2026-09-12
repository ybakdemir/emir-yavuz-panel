import { h, openSheet } from '../dom.js';
import { glyph } from '../art.js';
import { dino } from '../dinos.js';
import { celebrationFor, LEVEL, DISCOVERY_REASON } from '../../core/celebration.js';

// How each celebration level looks. STANDARD is the card's own stamp/pop
// animation (styles/child.css) and needs nothing here.

/** MEANINGFUL → a warmer toast with a glyph; MILESTONE → a short cinematic sheet. */
export function celebrate(ctx, event, opts = {}) {
  const c = celebrationFor(event);
  if (c.level === LEVEL.STANDARD) return;
  // Parent Mode gets a plain confirmation; the celebration is for Emir's screen.
  if (document.body.classList.contains('is-parent')) { ctx.toast(opts.message || c.message); return; }
  if (c.level === LEVEL.MEANINGFUL) { meaningfulToast(opts.message || c.message, opts.glyph || 'footprint'); return; }
  milestoneSheet({ title: opts.title || c.title, message: opts.message || c.message, dinoKind: opts.dinoKind || 'triceratops', kicker: opts.kicker || 'Gelişme' });
}

function meaningfulToast(message, g, ms = 3000) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = h('div', { class: 'toast toast-meaningful', role: 'status' }, glyph(g, 22), h('span', {}, message));
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

export function milestoneSheet({ title, message, dinoKind, kicker }) {
  const close = openSheet([
    h('div', { class: 'lbl' }, kicker),
    h('div', { class: 'sheet-title' }, title),
    h('div', { class: 'cine-art' }, dino(dinoKind, { size: 260, silhouette: true })),
    h('div', { class: 'fact' }, message),
    h('div', { class: 'sheet-actions' }, h('button', { class: 'btn btn-primary', onclick: () => close() }, 'Harika')),
  ], { cls: 'cine' });
  return close;
}

/** Copy for a fresh discovery: name + why it opened. */
export function discoveryCopy(state, id) {
  const item = state.config.expedition.items.find((it) => it.id === id);
  const reason = DISCOVERY_REASON[state.expedition?.reasons?.[id]] || '';
  return { item, title: item ? `${item.title} keşfedildi` : 'Yeni bir keşif', reason };
}

