import { h, add } from './dom.js';
import { icon } from './icons.js';
import { weekKey, weekDays, weekLabel, dayNameShort, fromKey, isWeekend } from '../core/dates.js';
import { itemsForDay } from '../core/schedule.js';
import { activeSkill } from '../core/skills.js';
import { targetsFor } from '../core/physical.js';

/** Paper mode — a printable week the child can tick without the app. */
export function renderPrint(root, ctx, wkArg) {
  const { state, today } = ctx;
  const wk = wkArg && /^\d{4}-\d{2}-\d{2}$/.test(wkArg) ? weekKey(wkArg) : weekKey(today);
  const days = weekDays(wk);
  const name = state.config.settings.childName || 'Emir';
  const skill = state.skills.pool.find((s) => s.id === state.weeks?.[wk]?.skillId) || activeSkill(state);
  const pres = state.weeks?.[wk]?.presentation || {};

  // Union of items across the week (weekday + weekend), in config order.
  const ids = new Set();
  days.forEach((k) => itemsForDay(state.config, k, { homework: 'exists', skillId: skill?.id || null, items: {} }).forEach((it) => ids.add(it.id)));
  const rows = state.config.items.filter((it) => ids.has(it.id));

  const page = h('div', { class: 'print-page' },
    h('div', { class: 'print-actions' },
      h('a', { class: 'btn btn-ghost btn-sm', href: '#/week' }, icon('back', 18), 'Geri'),
      h('button', { class: 'btn btn-primary btn-sm', onclick: () => window.print() }, icon('printer', 18), 'Yazdır')),
    h('h1', {}, `${name} — Haftam`),
    h('div', { class: 'sub' }, weekLabel(wk)),
    h('table', { class: 'print-grid' },
      h('thead', {}, h('tr', {}, h('th', { style: { width: '26%' } }, 'Görev'), days.map((k) => h('th', {}, `${dayNameShort(k)} ${fromKey(k).getDate()}`)))),
      h('tbody', {}, rows.map((it) => h('tr', {},
        h('td', { class: 'item' }, it.kind === 'skill' ? (skill ? `Beceri: ${skill.title}` : 'Haftanın becerisi') : it.title,
          it.kind === 'homework' ? h('span', { class: 'tiny', style: { textAlign: 'left' } }, 'Ödev yoksa boş bırak') : null,
          it.kind === 'physical' ? h('span', { class: 'tiny', style: { textAlign: 'left' } }, state.config.physical.exercises.map((e) => e.name.split(' ')[0]).join(' · ')) : null),
        days.map((k) => {
          const applies = it.days === 'all' || (it.days === 'weekend') === isWeekend(k);
          if (!applies) return h('td', { style: { background: '#f7f7f7' } });
          const extra = it.kind === 'physical' ? targetsFor(state.config.physical, k).map((t) => t.target).join('·') : null;
          return h('td', {}, h('span', { class: 'box' }), extra ? h('span', { class: 'tiny' }, extra) : null);
        }))))),
    h('div', { class: 'print-side' },
      h('div', { class: 'print-box' }, h('b', {}, 'Haftanın becerisi'), skill ? skill.title : '________________', skill?.hint ? h('div', { class: 'tiny', style: { textAlign: 'left' } }, skill.hint) : null),
      h('div', { class: 'print-box' }, h('b', {}, 'Haftanın sunumu'), `Konu: ${pres.topic || '________________'}`, h('div', { style: { marginTop: '6px' } }, '☐ Hazırlandım   ☐ Sundum')),
      h('div', { class: 'print-box' }, h('b', {}, 'Nasıl gitti?'), 'K = Kendim yaptım · H = Hatırlatılınca · B = Birlikte'),
      h('div', { class: 'print-box' }, h('b', {}, 'Haftanın seçimi'), '______________________________')),
    h('div', { class: 'print-foot' }, 'Kâğıtta takip etmek de olur. Önemli olan hatırlamak ve yapmak.'));
  add(root, page);
}
