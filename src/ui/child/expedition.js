import { h, add, openSheet } from '../dom.js';
import { icon } from '../icons.js';
import { dino } from '../dinos.js';
import { expeditionView, expeditionSteps } from '../../core/expedition.js';
import { formatShort } from '../../core/dates.js';

const TYPE_ICON = { location: 'flag', fossil: 'fossil', fact: 'info', card: null };

export function renderExpedition(main, ctx) {
  const { state, today } = ctx;
  const view = expeditionView(state);
  const steps = expeditionSteps(state, today);
  const per = state.config.expedition.daysPerDiscovery || 1;
  const toNext = view.next ? per - (steps.total % per || (steps.total ? per : 0)) : 0;
  const fresh = new Set(ctx.takeDiscoveries());

  const panel = h('section', { class: 'cinematic' },
    h('h1', {}, 'Keşif Haritası'),
    h('div', { class: 'sub' }, `${view.discoveredCount} / ${view.total} keşif`),
    h('div', { class: 'exp-progress' }, h('i', { style: { width: `${(view.discoveredCount / view.total) * 100}%` } })),
    view.next
      ? h('div', { class: 'exp-next' }, toNext === per ? `Bir sonraki keşif için ${per} iyi gün.` : `Bir sonraki keşfe ${toNext} iyi gün kaldı.`)
      : h('div', { class: 'exp-next' }, 'Haritanın tamamını keşfettin.'));

  for (const region of view.regions) {
    const sec = h('div', { class: `region ${region.state}` },
      h('div', { class: 'region-hd' },
        h('div', { class: 'region-badge' }, icon(region.state === 'complete' ? 'check' : region.state === 'locked' ? 'map' : 'flag', 22)),
        h('div', { class: 'grow' }, h('div', { class: 'n' }, region.name), h('div', { class: 'tg' }, region.tagline)),
        h('div', { class: 'pill', style: { background: 'rgba(255,255,255,.1)', color: 'var(--ivory)' } }, `${region.found}/${region.total}`)),
      h('div', { class: 'finds' }, region.items.map((it) => {
        const on = !!it.discoveredAt;
        const isNext = view.next?.id === it.id;
        const el = h('div', { class: `find ${on ? 'on' : 'off'} ${isNext ? 'next' : ''} ${fresh.has(it.id) ? 'fresh' : ''}`, role: on ? 'button' : null, tabindex: on ? '0' : null,
          onclick: () => { if (on) openFind(it); } },
          it.type === 'card' ? dino(it.dino, { size: 72 }) : h('div', {}, on ? icon(TYPE_ICON[it.type] || 'info', 34) : h('div', { class: 'q' }, '?')),
          h('div', { class: 't' }, on ? it.title : (isNext ? 'Sıradaki' : '· · ·')));
        return el;
      })));
    add(panel, sec);
  }
  add(main, panel);
  // Reveal the newest discovery once, not one sheet per item.
  const newest = [...fresh].map((id) => state.config.expedition.items.find((it) => it.id === id)).filter(Boolean).pop();
  if (newest) setTimeout(() => openFind(newest), 350);
}

function openFind(it) {
  const close = openSheet([
    h('div', { class: 'lbl' }, it.type === 'card' ? 'Dinozor Kartı' : it.type === 'fossil' ? 'Fosil' : it.type === 'location' ? 'Harita Noktası' : 'Biliyor muydun?'),
    h('div', { class: 'sheet-title', style: { fontSize: '24px' } }, it.title),
    it.type === 'card' ? dino(it.dino, { size: 280 }) : h('div', { style: { color: 'var(--gold)', textAlign: 'center', padding: '10px 0' } }, icon(TYPE_ICON[it.type] || 'info', 64)),
    h('div', { class: 'fact' }, it.fact),
    it.discoveredAt ? h('div', { class: 'small', style: { marginTop: '10px', color: 'var(--ivory-2)' } }, `Keşif tarihi: ${formatShort(it.discoveredAt)}`) : null,
    h('div', { class: 'sheet-actions' }, h('button', { class: 'btn btn-primary', onclick: () => close() }, 'Harika')),
  ], { cls: 'cine' });
}
