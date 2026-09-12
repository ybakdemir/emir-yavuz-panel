import { h, add } from '../dom.js';
import { icon } from '../icons.js';
import { weekKey, weekLabel, addDays } from '../../core/dates.js';
import { pcard, field, textInput, checkbox, stringList } from './common.js';

export function renderPresentations(body, ctx) {
  const { state, today } = ctx;
  const wk = weekKey(today);
  const grid = h('div', { class: 'grid grid-2' });
  add(grid, weekEditor(ctx, wk, 'Bu haftanın sunumu'));
  add(grid, pcard('Konu havuzu', 'list',
    stringList(state.config.presentation.topics, (next) => ctx.update((s) => { s.config.presentation.topics = next; }), 'Yeni konu…'),
    h('div', { style: { height: '10px' } }),
    field('Hedef süre (dk)', textInput(state.config.presentation.targetMinutes, (v) => ctx.update((s) => { s.config.presentation.targetMinutes = v; })))));
  add(body, grid);

  // history
  const weeks = Object.keys(state.weeks || {}).filter((k) => state.weeks[k]?.presentation && k !== wk).sort().reverse();
  add(body, h('div', { class: 'section-title' }, 'Sunum geçmişi'));
  if (!weeks.length) { add(body, h('div', { class: 'pcard muted small' }, 'Henüz geçmiş sunum yok.')); return; }
  add(body, h('div', { class: 'grid grid-2' }, weeks.map((k) => weekEditor(ctx, k, weekLabel(k)))));
  add(body, h('div', { class: 'row', style: { marginTop: '12px' } },
    h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => { const prev = addDays(wk, -7); s.weeks[prev] ||= {}; s.weeks[prev].presentation ||= { topic: '' }; }) }, icon('plus', 16), 'Geçen haftayı ekle')));
}

function weekEditor(ctx, wk, title) {
  const { state } = ctx;
  const p = state.weeks?.[wk]?.presentation || {};
  const set = (patch) => ctx.update((s) => { s.weeks[wk] ||= {}; s.weeks[wk].presentation = { ...(s.weeks[wk].presentation || {}), ...patch }; });
  const ind = state.config.presentation.indicators;
  return pcard(title, 'mic',
    h('div', { class: 'small muted', style: { marginBottom: '8px' } }, weekLabel(wk), p.legacy ? ' · eski kayıt' : ''),
    field('Konu', textInput(p.topic || '', (v) => set({ topic: v }), { list: 'topics' })),
    h('datalist', { id: 'topics' }, state.config.presentation.topics.map((t) => h('option', { value: t }))),
    h('div', { class: 'row wrap', style: { marginTop: '8px' } },
      checkbox('Hazırlandı', p.prepared, (v) => set({ prepared: v })),
      checkbox('Sunuldu', p.presented, (v) => set(v ? { presented: true, prepared: true, presentedOn: p.presentedOn || ctx.today } : { presented: false, presentedOn: null }))),
    h('div', { class: 'section-title', style: { marginTop: '10px' } }, 'Gelişim göstergeleri'),
    h('div', { class: 'row wrap' }, ind.map((i) => h('button', { class: `chip ${p.indicators?.[i.id] ? 'on' : ''}`, onclick: () => set({ indicators: { ...(p.indicators || {}), [i.id]: !p.indicators?.[i.id] } }) }, p.indicators?.[i.id] ? icon('check', 14) : null, i.label))),
    h('div', { style: { height: '10px' } }),
    field('Not', h('textarea', { class: 'input', onchange: (e) => set({ note: e.target.value }) }, p.note || '')),
    field('Emir\'in yansıması', h('textarea', { class: 'input', placeholder: 'En çok neyi sevdin? Bir dahaki sefere?', onchange: (e) => set({ reflection: e.target.value }) }, p.reflection || '')));
}
