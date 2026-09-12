import { h, add } from '../dom.js';
import { icon } from '../icons.js';
import { glyph, masteryBadge } from '../art.js';
import { formatShort } from '../../core/dates.js';
import { skillHistory } from '../../core/skills.js';
import { isCompleted } from '../../core/completion.js';

const GROUPS = [
  { key: 'learning', title: 'Öğreniyorum', sub: 'Yeni başladığım beceriler', icon: 'seed', tone: 'learn' },
  { key: 'practicing', title: 'Çalışıyorum', sub: 'Artık daha az hatırlatmayla', icon: 'bolt', tone: 'practice' },
  { key: 'mastered', title: 'Artık Yapabiliyorum', sub: 'Kendi başıma yapabildiklerim', icon: 'footprint', tone: 'mastered' },
];

export function renderSkills(main, ctx) {
  const { state } = ctx;
  const pool = state.skills.pool.filter((s) => !s.hidden);
  const counts = Object.fromEntries(GROUPS.map((g) => [g.key, pool.filter((s) => s.status === g.key).length]));

  add(main, h('header', { class: 'week-head' }, h('div', {}, h('div', { class: 'kicker' }, 'Yeni beceriler'), h('h1', {}, 'Becerilerim'))));

  // The three-state journey, visible at a glance.
  add(main, h('div', { class: 'skill-path', 'aria-label': 'Beceri yolculuğu' },
    GROUPS.map((g, i) => [
      i ? h('div', { class: 'sp-arrow', 'aria-hidden': 'true' }, icon('chevron', 16)) : null,
      h('div', { class: `sp-step ${g.tone}` }, h('div', { class: 'sp-ic' }, g.key === 'mastered' ? masteryBadge(30) : glyph(g.icon, 22)), h('div', { class: 'sp-t' }, g.title), h('div', { class: 'sp-n' }, counts[g.key])),
    ])));

  for (const g of GROUPS) {
    const list = pool.filter((s) => s.status === g.key).sort((a, b) => (b.masteredAt || '').localeCompare(a.masteredAt || ''));
    add(main, h('div', { class: `section-title st-${g.tone}` }, g.key === 'mastered' ? masteryBadge(20) : glyph(g.icon, 18), g.title, h('span', { class: 'st-sub' }, g.sub)));
    if (!list.length) { add(main, h('div', { class: 'card empty' }, g.key === 'mastered' ? 'İlk "artık yapabiliyorum" için çalışıyoruz.' : 'Şimdilik boş.')); continue; }
    add(main, h('div', { class: 'stack' }, list.map((s) => {
      const active = state.skills.activeId === s.id;
      const hist = skillHistory(state, s.id);
      const done = hist.filter((x) => isCompleted(x.status)).length;
      const ind = hist.filter((x) => x.status === 'independent').length;
      const mastered = g.key === 'mastered';
      return h('div', { class: `card skill-card ${g.tone} ${active ? 'active' : ''}` },
        mastered ? h('div', { class: 'skill-badge' }, masteryBadge(52)) : h('div', { class: `task-icon ${g.tone === 'learn' ? 'forest' : 'gold'}` }, glyph(g.icon, 28)),
        h('div', { class: 'grow' },
          h('div', { class: 't' }, s.title),
          mastered
            ? h('div', { class: 's' }, s.masteredAt ? `Öğrendim: ${formatShort(s.masteredAt)}` : 'Öğrendim', done ? ` · ${done} gün çalıştım` : '', ind ? ` · ${ind} kez kendim yaptım` : '')
            : h('div', { class: 's' }, active ? 'Bu haftanın becerisi' : (s.hint || ''), done ? ` · ${done} gün` : '')),
        active ? h('span', { class: 'pill pill-gold' }, 'Bu hafta') : null,
        mastered ? h('span', { class: 'mastered-mark', 'aria-label': 'Artık yapabiliyorum' }, icon('check', 22)) : null);
    })));
  }
}
