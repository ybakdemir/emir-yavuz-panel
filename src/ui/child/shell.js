import { h, add } from '../dom.js';
import { icon } from '../icons.js';
import { worldDecor } from '../art.js';
import { renderToday } from './today.js';
import { renderWeek } from './week.js';
import { renderExpedition } from './expedition.js';
import { renderSkills } from './skills.js';

const PAGES = {
  today: { label: 'Bugün', icon: 'today', render: renderToday },
  week: { label: 'Haftam', icon: 'calendar', render: renderWeek },
  expedition: { label: 'Keşif', icon: 'map', render: renderExpedition },
  skills: { label: 'Becerilerim', icon: 'seed', render: renderSkills },
};

export function renderChildShell(root, ctx, page) {
  const p = PAGES[page] || PAGES.today;
  document.body.dataset.day = ctx.today;
  document.body.dataset.page = page;
  const main = h('main', { class: 'child', id: 'page-' + page });
  p.render(main, ctx);
  add(root,
    // Desktop-only scenery behind the action column (hidden on phones via CSS).
    h('div', { class: 'world', 'aria-hidden': 'true' }, worldDecor()),
    main,
    h('nav', { class: 'nav', 'aria-label': 'Ana menü' },
      h('div', { class: 'nav-inner' },
        Object.entries(PAGES).map(([k, v]) => h('a', { href: '#/' + k, class: k === page ? 'on' : '', 'aria-current': k === page ? 'page' : null },
          h('span', { class: 'nav-ic' }, icon(v.icon, 24)), h('span', {}, v.label))))));
}
