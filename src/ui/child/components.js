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

export function taskIcon(name, tone = '') {
  return h('div', { class: `task-icon ${tone}` }, icon(name, 26));
}

export function checkCircle(done, onClick) {
  return h('button', { class: 'task-check', 'aria-label': done ? 'Geri al' : 'Tamamla', onclick: (e) => { e.stopPropagation(); onClick(); } }, icon('check', 26));
}

export function stamp() { return h('div', { class: 'task-stamp' }, footprintStamp(34)); }

export { STATUS_LABEL };
