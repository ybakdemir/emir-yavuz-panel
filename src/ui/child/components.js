import { h, svg } from '../dom.js';
import { icon, footprintStamp } from '../icons.js';
import { glyph, GLYPH_NAMES } from '../art.js';
import { STATUS, STATUS_LABEL } from '../../content/defaults.js';

/** Category tone per item — drives the glyph tile colour and the card accent. */
export const ICON_TONE = { morning: 'dawn', homework: 'sky', explorer: 'sky', reading: 'fossil', quran: 'forest', prayer: 'forest', physical: 'clay', skill: 'gold', presentation: 'sky', evening: 'night' };

/**
 * Progress ring. `tone: 'hero'` draws ivory-on-forest with a gold arc for the
 * Today hero; the default is green-on-cream for light surfaces.
 */
export function ring(done, total, size = 66, tone = '') {
  const r = (size - 10) / 2, c = 2 * Math.PI * r, ratio = total ? done / total : 0;
  const track = tone === 'hero' ? 'rgba(246,240,228,.18)' : 'rgba(23,63,53,.10)';
  const arc = tone === 'hero' ? 'var(--gold)' : 'var(--green)';
  return h('div', { class: `ring ${tone ? 'ring-' + tone : ''}`, role: 'img', 'aria-label': `${done} / ${total} görev tamamlandı` },
    svg(`<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="8"/>
         <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${arc}" stroke-width="8" stroke-linecap="round"
           stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - ratio)}" style="transition:stroke-dashoffset .6s var(--ease)"/>`, { size, viewBox: `0 0 ${size} ${size}` }),
    h('div', { class: 'lbl' }, h('b', {}, done), h('small', {}, `/${total}`)));
}

/** Footprint trail: one print per core task, filled as they complete. */
export function trail(done, total) {
  return h('div', { class: 'trail', 'aria-hidden': 'true' },
    Array.from({ length: total }, (_, i) => h('span', { class: `tp ${i < done ? 'on' : ''}` }, footprintStamp(18))));
}

/**
 * Optional "How did it go?" chips shown after completion. The tap itself only
 * records "Yaptım" (unspecified); nothing is selected until Emir picks one.
 * Nothing here is mandatory — moving on leaves the task completed-unspecified.
 */
export function howChips(status, onPick, { open = true, onToggle = null } = {}) {
  const opts = [
    [STATUS.INDEPENDENT, '', 'Kendim yaptım'],
    [STATUS.REMINDER, 'warm', 'Hatırlatılınca yaptım'],
    [STATUS.ASSISTED, 'sky', 'Birlikte yaptık'],
  ];
  const cur = opts.find((o) => o[0] === status) || null;
  if (!open) {
    return h('div', { class: 'how compact' },
      h('button', { class: `chip ${cur ? cur[1] : 'muted'} on`, 'aria-expanded': 'false', onclick: (e) => { e.stopPropagation(); onToggle && onToggle(); } },
        icon('check', 16), cur ? cur[2] : STATUS_LABEL[status] || 'Yaptım', icon('chevronDown', 16)));
  }
  return h('div', { class: 'how' },
    cur ? null : h('div', { class: 'lbl' }, 'Nasıl yaptın?'),
    opts.map(([val, tone, label]) => h('button', {
      class: `chip ${tone} ${status === val ? 'on' : ''}`, 'aria-pressed': status === val ? 'true' : 'false',
      onclick: (e) => { e.stopPropagation(); onPick(status === val ? STATUS.COMPLETED_UNSPECIFIED : val); },
    }, status === val ? icon('check', 16) : null, label)));
}

/** Category tile: duotone glyph when we have one, line icon otherwise. */
export function taskIcon(name, tone = '') {
  return h('div', { class: `task-icon ${tone}` }, GLYPH_NAMES.includes(name) ? glyph(name, 28) : icon(name, 26));
}

export function checkCircle(done, onClick) {
  return h('button', { class: 'task-check', 'aria-label': done ? 'Geri al' : 'Tamamla', 'aria-pressed': done ? 'true' : 'false', onclick: (e) => { e.stopPropagation(); onClick(); } }, icon('check', 26));
}

export function stamp() { return h('div', { class: 'task-stamp' }, footprintStamp(34)); }

export { STATUS_LABEL };
