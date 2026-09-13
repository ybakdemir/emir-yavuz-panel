import { h, add } from '../dom.js';
import { icon } from '../icons.js';
import { glyph, masteryBadge } from '../art.js';
import { formatShort } from '../../core/dates.js';
import { skillHistory } from '../../core/skills.js';
import { isCompleted } from '../../core/completion.js';
import { pageHero, sectionHead, countPill, badgeArt, companion } from './components.js';

const GROUPS = [
  { key: 'learning', title: 'Öğreniyorum', sub: 'Yeni başladığım beceriler', kicker: '1. adım', icon: 'seed', tone: 'learn' },
  { key: 'practicing', title: 'Çalışıyorum', sub: 'Artık daha az hatırlatmayla', kicker: '2. adım', icon: 'bolt', tone: 'practice' },
  { key: 'mastered', title: 'Artık Yapabiliyorum', sub: 'Kendi başıma yapabildiklerim', kicker: '3. adım', icon: 'footprint', tone: 'mastered' },
];

export function renderSkills(main, ctx) {
  const { state } = ctx;
  const pool = state.skills.pool.filter((s) => !s.hidden);
  const counts = Object.fromEntries(GROUPS.map((g) => [g.key, pool.filter((s) => s.status === g.key).length]));

  // Compact editorial header on the secondary artwork — same world, progress-focused.
  add(main, pageHero({
    variant: 'compact', hero: 'secondary', label: 'Becerilerim', kicker: 'Yeni beceriler', title: 'Becerilerim', sub: 'Öğreniyorum, çalışıyorum, artık yapabiliyorum.',
    aside: counts.mastered ? h('span', { class: 'count-pill' }, masteryBadge(16), `${counts.mastered}`) : null,
  }));

  // The three-state journey, visible at a glance.
  add(main, h('div', { class: 'skill-path', 'aria-label': 'Beceri yolculuğu' },
    GROUPS.map((g, i) => [
      i ? h('div', { class: 'sp-arrow', 'aria-hidden': 'true' }, icon('chevron', 16)) : null,
      h('div', { class: `sp-step ${g.tone}` }, h('div', { class: 'sp-ic' }, g.key === 'mastered' ? masteryBadge(30) : glyph(g.icon, 22)), h('div', { class: 'sp-t' }, g.title), h('div', { class: 'sp-n' }, counts[g.key])),
    ])));

  for (const g of GROUPS) {
    const list = pool.filter((s) => s.status === g.key).sort((a, b) => (b.masteredAt || '').localeCompare(a.masteredAt || ''));
    add(main, sectionHead(g.kicker, g.title, { sub: g.sub, count: list.length ? countPill(list.length, pool.length, { soft: true }) : null, cls: `st-${g.tone}` }));
    if (!list.length) {
      // The companion keeps the empty "mastered" shelf encouraging — the one character slot on this screen.
      add(main, g.key === 'mastered'
        ? h('div', { class: 'card empty with-companion' }, h('div', { class: 'ec-art', 'aria-hidden': 'true' }, companion(64)), h('div', { class: 'grow' }, 'İlk "artık yapabiliyorum" için çalışıyoruz.'))
        : h('div', { class: 'card empty' }, 'Şimdilik boş.'));
      continue;
    }
    add(main, h('div', { class: 'stack' }, list.map((s) => {
      const active = state.skills.activeId === s.id;
      const hist = skillHistory(state, s.id);
      const done = hist.filter((x) => isCompleted(x.status)).length;
      const ind = hist.filter((x) => x.status === 'independent').length;
      const mastered = g.key === 'mastered';
      return h('div', { class: `card skill-card ${g.tone} ${active ? 'active' : ''}` },
        mastered ? h('div', { class: 'skill-badge' }, badgeArt(64)) : h('div', { class: `task-icon ${g.tone === 'learn' ? 'forest' : 'gold'}` }, glyph(g.icon, 28)),
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
