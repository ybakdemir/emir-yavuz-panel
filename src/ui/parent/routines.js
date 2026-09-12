import { h, add } from '../dom.js';
import { icon } from '../icons.js';
import { ROUTINE_STAGE_LABEL } from '../../content/defaults.js';
import { pcard, field, textInput, segmented, checkbox } from './common.js';

export function renderRoutines(body, ctx) {
  const { state } = ctx;
  add(body, h('p', { class: 'small muted', style: { marginBottom: '12px' } }, 'Rutinler kalıcıdır; ayrıntılı adım listeleri geçicidir. Aşama ilerledikçe daha az adım görünür, "Artık yapabiliyorum" tek dokunuş olur.'));
  const grid = h('div', { class: 'grid grid-2' });
  for (const id of Object.keys(state.config.routines)) add(grid, routineCard(ctx, id));
  add(body, grid);
}

function routineCard(ctx, id) {
  const r = ctx.state.config.routines[id];
  const set = (fn) => ctx.update((s) => fn(s.config.routines[id]));
  const card = pcard(r.title, r.icon === 'sun' ? 'sun' : 'moon',
    field('Aşama', segmented(Object.entries(ROUTINE_STAGE_LABEL), r.stage, (v) => set((x) => { x.stage = v; }))),
    h('div', { style: { height: '10px' } }),
    field('Başlık', textInput(r.title, (v) => set((x) => { x.title = v; }))),
    h('div', { style: { height: '10px' } }),
    field('Tamamlanınca görünen başlık', textInput(r.doneTitle, (v) => set((x) => { x.doneTitle = v; }))),
    h('div', { class: 'section-title' }, 'Adımlar'),
    h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Adım'), h('th', {}, 'Öğrenme'), h('th', {}, 'Çalışma'), h('th', {}))),
      h('tbody', {}, r.steps.map((st, i) => h('tr', {},
        h('td', {}, textInput(st.label, (v) => set((x) => { x.steps[i].label = v; }))),
        h('td', {}, checkbox('', st.stages.includes('learn'), (on) => set((x) => { x.steps[i].stages = toggleStage(x.steps[i].stages, 'learn', on); }))),
        h('td', {}, checkbox('', st.stages.includes('practice'), (on) => set((x) => { x.steps[i].stages = toggleStage(x.steps[i].stages, 'practice', on); }))),
        h('td', {}, h('button', { class: 'icon-btn', 'aria-label': 'Sil', onclick: () => set((x) => { x.steps.splice(i, 1); }) }, icon('trash', 18)))))))));
  const addInput = h('input', { class: 'input', placeholder: 'Yeni adım…' });
  add(card, h('div', { class: 'row', style: { marginTop: '10px' } }, addInput,
    h('button', { class: 'btn btn-soft btn-sm', onclick: () => { if (!addInput.value.trim()) return; const label = addInput.value.trim(); set((x) => { x.steps.push({ id: 's' + Date.now().toString(36), label, stages: ['learn', 'practice'] }); }); } }, icon('plus', 18), 'Ekle')));
  return card;
}

function toggleStage(stages, stage, on) {
  const set = new Set(stages);
  if (on) set.add(stage); else set.delete(stage);
  return [...set];
}
