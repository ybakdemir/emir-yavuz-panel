import { createStore } from './core/store.js';
import { createFirebaseAdapter } from './core/sync.js';
import { todayKey } from './core/dates.js';
import { syncDiscoveries } from './core/expedition.js';
import { autoAdvance } from './core/skills.js';
import { h, clear } from './ui/dom.js';
import { renderChildShell } from './ui/child/shell.js';
import { renderParentShell } from './ui/parent/shell.js';
import { renderPrint } from './ui/print.js';

const store = createStore({ storage: globalThis.localStorage });
store.init();

const root = document.getElementById('app');
let syncStatus = 'local';
let pendingDiscoveries = [];

const ctx = {
  store,
  get state() { return store.state; },
  get today() { return todayKey(); },
  get syncStatus() { return syncStatus; },
  navigate(hash) { location.hash = hash; },
  toast(msg, ms = 2200) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = h('div', { class: 'toast', role: 'status' }, msg);
    document.body.append(t);
    setTimeout(() => t.remove(), ms);
  },
  /** All writes go through here so day-level side effects run once. */
  update(mutator) {
    store.update((s) => {
      mutator(s);
      const adv = autoAdvance(s, todayKey());
      if (adv?.type === 'mastered') ctx.toast('Yeni bir beceri: artık yapabiliyorsun!');
      const fresh = syncDiscoveries(s, todayKey());
      if (fresh.length) pendingDiscoveries = fresh;
    });
  },
  takeDiscoveries() { const d = pendingDiscoveries; pendingDiscoveries = []; return d; },
  peekDiscoveries() { return pendingDiscoveries; },
};

function route() {
  const hash = location.hash || '#/today';
  const parts = hash.replace(/^#\/?/, '').split('/');
  clear(root);
  document.querySelectorAll('.sheet-overlay').forEach((el) => el.remove());
  document.body.classList.toggle('is-parent', parts[0] === 'parent');
  if (parts[0] === 'parent') return renderParentShell(root, ctx, parts.slice(1));
  if (parts[0] === 'print') return renderPrint(root, ctx, parts[1]);
  return renderChildShell(root, ctx, parts[0] || 'today');
}

window.addEventListener('hashchange', () => { window.scrollTo(0, 0); route(); });
store.subscribe(() => {
  const y = window.scrollY;
  route();
  window.scrollTo(0, y);
});
route();

// Firebase mirrors localStorage; the UI never waits for it.
createFirebaseAdapter()
  .then((adapter) => store.attachRemote(adapter, (s) => { syncStatus = s; route(); }))
  .catch(() => { syncStatus = 'err'; route(); });

// Re-render at midnight so "today" rolls over without a reload.
setInterval(() => { if (document.body.dataset.day && document.body.dataset.day !== todayKey()) route(); }, 60_000);
