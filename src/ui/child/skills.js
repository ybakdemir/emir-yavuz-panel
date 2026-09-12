import { h, add } from '../dom.js';
import { icon } from '../icons.js';
import { formatShort } from '../../core/dates.js';
import { skillHistory } from '../../core/skills.js';
import { isCompleted } from '../../core/completion.js';
import { taskIcon } from './components.js';

export function renderSkills(main, ctx) {
  const { state } = ctx;
  const pool = state.skills.pool.filter((s) => !s.hidden);
  const groups = [
    { key: 'learning', title: 'Öğreniyorum', sub: 'Yeni başladığım beceriler', icon: 'seed' },
    { key: 'practicing', title: 'Çalışıyorum', sub: 'Artık daha az hatırlatmayla', icon: 'bolt' },
    { key: 'mastered', title: 'Artık Yapabiliyorum', sub: 'Kendi başıma yapabildiklerim', icon: 'check' },
  ];
  add(main, h('header', { class: 'week-head' }, h('h1', {}, 'Becerilerim')));
  add(main, h('p', { class: 'muted', style: { fontWeight: 700 } }, 'Önce öğreniyorum, sonra çalışıyorum, sonra kendim yapabiliyorum.'));

  for (const g of groups) {
    const list = pool.filter((s) => s.status === g.key).sort((a, b) => (b.masteredAt || '').localeCompare(a.masteredAt || ''));
    add(main, h('div', { class: 'section-title' }, g.title));
    if (!list.length) { add(main, h('div', { class: 'card empty' }, g.key === 'mastered' ? 'İlk "artık yapabiliyorum" için çalışıyoruz.' : 'Şimdilik boş.')); continue; }
    add(main, h('div', { class: 'stack' }, list.map((s) => {
      const active = state.skills.activeId === s.id;
      const hist = skillHistory(state, s.id);
      const done = hist.filter((x) => isCompleted(x.status)).length;
      const ind = hist.filter((x) => x.status === 'independent').length;
      return h('div', { class: `card skill-card ${active ? 'active' : ''} ${g.key === 'mastered' ? 'mastered' : ''}` },
        taskIcon(g.icon),
        h('div', { class: 'grow' },
          h('div', { class: 't' }, s.title),
          h('div', { class: 's' }, g.key === 'mastered'
            ? `${s.masteredAt ? formatShort(s.masteredAt) + ' · ' : ''}${done} gün çalıştım, ${ind} kez kendim yaptım`
            : (active ? 'Bu haftanın becerisi' : s.hint || '') + (done ? ` · ${done} gün` : ''))),
        active ? h('span', { class: 'pill pill-green' }, 'Bu hafta') : null,
        g.key === 'mastered' ? h('span', { style: { color: 'var(--jungle)' } }, icon('check', 24)) : null);
    })));
  }
}
