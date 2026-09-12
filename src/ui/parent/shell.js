import { h, add } from '../dom.js';
import { icon, footprintStamp } from '../icons.js';
import { renderDashboard } from './dashboard.js';
import { renderRoutines } from './routines.js';
import { renderSkillsAdmin } from './skills.js';
import { renderPresentations } from './presentations.js';
import { renderRewards } from './rewards.js';
import { renderProgress } from './progress.js';
import { renderSettings } from './settings.js';

const TABS = [
  ['dashboard', 'Panel', 'chart', renderDashboard],
  ['routines', 'Rutinler', 'list', renderRoutines],
  ['skills', 'Beceriler', 'seed', renderSkillsAdmin],
  ['presentations', 'Sunumlar', 'mic', renderPresentations],
  ['rewards', 'Ödüller', 'gift', renderRewards],
  ['progress', 'İlerleme', 'calendar', renderProgress],
  ['settings', 'Ayarlar', 'gear', renderSettings],
];

const SESSION_KEY = 'ey_parent_ok';

export function renderParentShell(root, ctx, parts) {
  const tab = TABS.find((t) => t[0] === parts[0]) || TABS[0];
  const pin = ctx.state.config.settings.parentPin;
  const wrap = h('main', { class: 'parent' });
  const name = ctx.state.config.settings.childName || 'Emir';
  add(wrap, h('div', { class: 'parent-top' },
    h('div', { class: 'brand' }, footprintStamp(22), h('div', {}, h('div', { class: 'brand-t' }, 'Ebeveyn Paneli'), h('div', { class: 'brand-s' }, `${name} · Kişisel Gelişim`))),
    h('div', { class: 'grow' }),
    h('span', { class: `pill ${ctx.syncStatus === 'ok' ? 'pill-green' : ctx.syncStatus === 'err' ? 'pill-clay' : 'pill-sand'}` }, ctx.syncStatus === 'ok' ? 'Senkron' : ctx.syncStatus === 'err' ? 'Çevrimdışı' : 'Yerel'),
    h('a', { class: 'btn btn-soft btn-sm', href: '#/today' }, icon('back', 18), 'Çocuk modu')));

  let ok = true;
  try { ok = !pin || sessionStorage.getItem(SESSION_KEY) === pin; } catch { ok = !pin; }
  if (!ok) { add(wrap, renderPinGate(ctx, pin)); add(root, wrap); return; }

  add(wrap, h('nav', { class: 'parent-tabs' }, TABS.map(([k, label, ic]) => h('a', { href: '#/parent/' + k, class: k === tab[0] ? 'on' : '' }, icon(ic, 18), label))));
  const body = h('div', { class: 'parent-body' });
  add(body, h('h2', { class: 'parent-h2' }, tab[1]));
  tab[3](body, ctx, parts.slice(1));
  add(wrap, body);
  add(root, wrap);
}

function renderPinGate(ctx, pin) {
  const input = h('input', { class: 'input', type: 'password', inputmode: 'numeric', maxlength: '6', autocomplete: 'off', 'aria-label': 'PIN' });
  const msg = h('div', { class: 'small muted', style: { marginTop: '8px', minHeight: '20px' } });
  const submit = () => {
    if (input.value === pin) { try { sessionStorage.setItem(SESSION_KEY, pin); } catch { /* ignore */ } ctx.store.update(() => {}); }
    else { msg.textContent = 'PIN doğru değil.'; input.value = ''; }
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  setTimeout(() => input.focus(), 50);
  return h('div', { class: 'pin-box card card-pad' },
    h('h2', { style: { marginBottom: '12px' } }, 'Ebeveyn PIN'),
    input, msg,
    h('button', { class: 'btn btn-primary btn-block', style: { marginTop: '12px' }, onclick: submit }, 'Giriş'));
}
