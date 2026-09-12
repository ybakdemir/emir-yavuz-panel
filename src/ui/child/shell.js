import { h, add } from '../dom.js';
import { icon } from '../icons.js';
import { worldDecor } from '../art.js';
import { renderToday } from './today.js';
import { renderWeek } from './week.js';
import { renderExpedition } from './expedition.js';
import { renderSkills } from './skills.js';
import { renderArchive } from './archive.js';

const PAGES = {
  today: { label: 'Bugün', icon: 'today', render: renderToday },
  week: { label: 'Haftam', icon: 'calendar', render: renderWeek },
  expedition: { label: 'Keşif', icon: 'map', render: renderExpedition },
  skills: { label: 'Becerilerim', icon: 'seed', render: renderSkills },
  archive: { label: 'Arşivim', icon: 'archive', render: renderArchive },
};

/** `parts` = hash segments after the page (Arşivim has sub-pages: books, memory, presentations). */
export function renderChildShell(root, ctx, page, parts = []) {
  const p = PAGES[page] || PAGES.today;
  document.body.dataset.day = ctx.today;
  document.body.dataset.page = page;
  const main = h('main', { class: 'child', id: 'page-' + page });
  p.render(main, ctx, parts);
  add(root,
    // Desktop-only scenery behind the action column (hidden on phones via CSS).
    h('div', { class: 'world', 'aria-hidden': 'true' }, worldDecor()),
    main,
    h('nav', { class: 'nav', 'aria-label': 'Ana menü' },
      h('div', { class: 'nav-inner' },
        Object.entries(PAGES).map(([k, v]) => h('a', { href: '#/' + k, class: k === page ? 'on' : '', 'aria-current': k === page ? 'page' : null },
          h('span', { class: 'nav-ic' }, icon(v.icon, 24)), h('span', {}, v.label))))));
}
