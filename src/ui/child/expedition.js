import { h, add, openSheet } from '../dom.js';
import { icon } from '../icons.js';
import { dino } from '../dinos.js';
import { glyph, zoneScene } from '../art.js';
import { expeditionView, expeditionSteps } from '../../core/expedition.js';
import { formatShort } from '../../core/dates.js';
import { DISCOVERY_REASON } from '../../core/celebration.js';

const TYPE_GLYPH = { location: 'flag', fossil: 'fossil', fact: 'footprint', card: null };
const TYPE_LABEL = { card: 'Dinozor Kartı', fossil: 'Fosil', location: 'Harita Noktası', fact: 'Biliyor muydun?' };
const TYPE_SHORT = { card: 'Dinozor', fossil: 'Fosil', location: 'Nokta', fact: 'Bilgi' };

export function renderExpedition(main, ctx) {
  const { state, today } = ctx;
  const view = expeditionView(state);
  const steps = expeditionSteps(state, today);
  const per = state.config.expedition.daysPerDiscovery || 1;
  const toNext = view.next ? per - (steps.total % per || (steps.total ? per : 0)) : 0;
  const fresh = new Set(ctx.takeDiscoveries());
  const name = state.config.settings.childName || 'Emir';
  const pctDone = view.total ? (view.discoveredCount / view.total) * 100 : 0;

  const panel = h('section', { class: 'cinematic map', 'aria-label': 'Keşif haritası' },
    h('div', { class: 'map-stars', 'aria-hidden': 'true' }),
    h('header', { class: 'map-head' },
      h('div', { class: 'kicker' }, `${name}'in keşif yolculuğu`),
      h('h1', {}, 'Keşif Haritası'),
      h('div', { class: 'map-stats' },
        h('div', { class: 'stat' }, h('b', {}, view.discoveredCount), h('span', {}, `/ ${view.total} keşif`)),
        h('div', { class: 'stat' }, h('b', {}, steps.goodDays), h('span', {}, 'iyi gün')),
        h('div', { class: 'stat' }, h('b', {}, view.regions.filter((r) => r.state === 'complete').length), h('span', {}, `/ ${view.regions.length} bölge`))),
      h('div', { class: 'exp-progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(view.total), 'aria-valuenow': String(view.discoveredCount) },
        h('i', { style: { width: `${pctDone}%` } })),
      view.next
        ? h('div', { class: 'exp-next' }, glyph('footprint', 18), toNext === per ? `Bir sonraki keşif için ${per} iyi gün.` : `Bir sonraki keşfe ${toNext} iyi gün kaldı.`)
        : h('div', { class: 'exp-next' }, glyph('flag', 18), 'Haritanın tamamını keşfettin.')));

  const trailEl = h('div', { class: 'map-trail' });
  view.regions.forEach((region, idx) => {
    const reached = region.state !== 'locked';
    const zone = h('section', { class: `zone ${region.state} tone-${region.tone}`, 'aria-label': region.name },
      h('div', { class: 'zone-scene-wrap' }, zoneScene(region.tone), h('div', { class: 'zone-mist' })),
      h('div', { class: 'zone-hd' },
        h('div', { class: 'grow' },
          h('div', { class: 'zone-state' }, region.state === 'complete' ? 'Keşfedildi' : region.state === 'active' ? 'Şu an buradasın' : 'Keşfedilecek'),
          h('div', { class: 'n' }, region.name),
          h('div', { class: 'tg' }, region.tagline)),
        h('div', { class: 'zone-count' }, `${region.found}/${region.total}`)),
      h('div', { class: 'finds' }, region.items.map((it) => {
        const on = !!it.discoveredAt;
        const isNext = view.next?.id === it.id;
        const art = it.type === 'card' ? dino(it.dino, { size: 72 }) : glyph(TYPE_GLYPH[it.type] || 'flag', 36);
        return h('div', { class: `find ${on ? 'on' : 'off'} ${isNext ? 'next' : ''} ${fresh.has(it.id) ? 'fresh' : ''}`,
          role: on ? 'button' : null, tabindex: on ? '0' : null, 'aria-label': on ? it.title : isNext ? 'Sıradaki keşif' : 'Henüz keşfedilmedi',
          onclick: () => { if (on) openFind(it, state); }, onkeydown: (e) => { if (on && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openFind(it, state); } } },
          h('div', { class: 'find-art' }, art),
          h('div', { class: 't' }, on ? it.title : (isNext ? 'Sıradaki' : TYPE_SHORT[it.type])));
      })));
    if (!reached) zone.setAttribute('aria-disabled', 'true');
    add(trailEl, h('div', { class: `zone-wrap ${region.state}` },
      h('div', { class: 'zone-node', 'aria-hidden': 'true' }, region.state === 'complete' ? icon('check', 18) : h('span', {}, idx + 1)), zone));
  });
  add(panel, trailEl,
    h('div', { class: 'map-foot' }, glyph('footprint', 20), 'Her iyi gün bir adım. Keşfedilen hiçbir şey geri alınmaz.'));
  add(main, panel);
  // Reveal the newest discovery once, not one sheet per item.
  const newest = [...fresh].map((id) => state.config.expedition.items.find((it) => it.id === id)).filter(Boolean).pop();
  if (newest) setTimeout(() => openFind(newest, state, true), 350);
}

/** Reveal sheet. A fresh discovery also says why it opened (milestone or good days). */
function openFind(it, state, fresh = false) {
  const reason = state?.expedition?.reasons?.[it.id];
  const why = reason && reason !== 'steps' ? DISCOVERY_REASON[reason] : fresh ? DISCOVERY_REASON.steps : null;
  const close = openSheet([
    h('div', { class: 'lbl' }, fresh ? 'Yeni keşif!' : TYPE_LABEL[it.type] || 'Keşif'),
    h('div', { class: 'sheet-title' }, fresh ? `${it.title} keşfedildi` : it.title),
    h('div', { class: 'cine-art' }, it.type === 'card' ? dino(it.dino, { size: 280 }) : h('div', { class: 'cine-glyph' }, glyph(TYPE_GLYPH[it.type] || 'flag', 72))),
    h('div', { class: 'fact' }, it.fact),
    why ? h('div', { class: 'cine-why' }, glyph('footprint', 16), why) : null,
    it.discoveredAt ? h('div', { class: 'cine-date' }, icon('flag', 16), `Keşif tarihi: ${formatShort(it.discoveredAt)}`) : null,
    h('div', { class: 'sheet-actions' }, h('button', { class: 'btn btn-primary', onclick: () => close() }, 'Harika')),
  ], { cls: 'cine' });
}
