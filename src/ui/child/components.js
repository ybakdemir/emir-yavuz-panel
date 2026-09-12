import { h, svg } from '../dom.js';
import { icon, footprintStamp } from '../icons.js';
import { STATUS, STATUS_LABEL } from '../../content/defaults.js';

export const ICON_TONE = { morning: '', homework: 'amber', explorer: 'sky', reading: 'fossil', quran: '', prayer: '', physical: 'amber', skill: '', presentation: 'sky', evening: '' };

export function ring(done, total, size = 66) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, ratio = total ? done / total : 0;
  return h('div', { class: 'ring', role: 'img', 'aria-label': `${done} / ${total}` },
    svg(`<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(31,42,36,.10)" stroke-width="7"/>
         <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--jungle)" stroke-width="7" stroke-linecap="round"
           stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - ratio)}" style="transition:stroke-dashoffset .5s var(--ease)"/>`, { size, viewBox: `0 0 ${size} ${size}` }),
    h('div', { class: 'lbl' }, `${done}/${total}`));
}

/** "How did it go?" chips shown after completion. Fast: one tap, default = independent. */
export function howChips(status, onPick, { open = true, onToggle = null } = {}) {
  const opts = [
    [STATUS.INDEPENDENT, '', 'Kendim yaptım'],
    [STATUS.REMINDER, 'warm', 'Hatırlatılınca yaptım'],
    [STATUS.ASSISTED, 'sky', 'Birlikte yaptık'],
  ];
  if (!open) {
    const cur = opts.find((o) => o[0] === status) || opts[0];
    return h('div', { class: 'how compact' },
      h('button', { class: `chip ${cur[1]} on`, 'aria-expanded': 'false', onclick: (e) => { e.stopPropagation(); onToggle && onToggle(); } }, icon('check', 16), STATUS_LABEL[status] || cur[2], icon('chevronDown', 16)));
  }
  return h('div', { class: 'how' },
    opts.map(([val, tone, label]) => h('button', {
      class: `chip ${tone} ${status === val ? 'on' : ''}`, 'aria-pressed': status === val ? 'true' : 'false',
      onclick: (e) => { e.stopPropagation(); onPick(val); },
    }, status === val ? icon('check', 16) : null, label)));
}

export function taskIcon(name, tone = '') {
  return h('div', { class: `task-icon ${tone}` }, icon(name, 26));
}

export function checkCircle(done, onClick) {
  return h('button', { class: 'task-check', 'aria-label': done ? 'Geri al' : 'Tamamla', onclick: (e) => { e.stopPropagation(); onClick(); } }, icon('check', 26));
}

export function stamp() { return h('div', { class: 'task-stamp' }, footprintStamp(34)); }

export { STATUS_LABEL };
