import { h, add } from '../dom.js';
import { weekLabel, weekKey, formatShort } from '../../core/dates.js';
import { REFLECTION_PROMPTS } from '../../content/defaults.js';
import { reflectionHistory, reflectionFor, saveReflection, hasAnswers } from '../../core/reflections.js';
import { pcard } from './common.js';

// Yansımalar — "Haftamı Düşünüyorum" history. Read-only by intent; parents may
// fix a typo in place. Skipped weeks are shown as skipped, never as a gap to fill.

export function renderReflections(body, ctx) {
  const { state, today } = ctx;
  const list = reflectionHistory(state);
  const wk = weekKey(today);
  const cur = reflectionFor(state, wk);

  add(body, h('p', { class: 'small muted', style: { marginBottom: '12px' } },
    'Hafta sonu Haftam ekranında en fazla üç kısa soru sorulur; cevaplamak isteğe bağlıdır ve atlamak bir sonuç doğurmaz.'));

  add(body, pcard('Bu hafta', 'leaf',
    h('div', { class: 'kv' }, h('span', {}, weekLabel(wk)), h('span', {}, !cur ? 'Henüz yazılmadı' : cur.skipped && !hasAnswers(cur) ? 'Atlandı' : `Yazıldı (${formatShort(cur.savedOn || wk)})`))));

  add(body, h('div', { class: 'section-title' }, `Geçmiş (${list.length})`));
  if (!list.length) { add(body, h('div', { class: 'pcard muted small' }, 'Henüz yansıma yok.')); return; }
  add(body, h('div', { class: 'grid grid-2' }, list.map((r) => {
    const skipped = r.skipped && !hasAnswers(r);
    const set = (id, v) => ctx.update((s) => saveReflection(s, r.wk, { ...(r.answers || {}), [id]: v }, ctx.today));
    return pcard(weekLabel(r.wk), 'calendar',
      h('div', { class: 'small muted', style: { marginBottom: '8px' } }, skipped ? `Atlandı${r.skippedOn ? ' · ' + formatShort(r.skippedOn) : ''}` : `Yazıldı: ${formatShort(r.savedOn || r.wk)}${r.updatedAt && r.updatedAt !== r.savedOn ? ' · düzenlendi ' + formatShort(r.updatedAt) : ''}`),
      skipped ? null : REFLECTION_PROMPTS.map((p) => h('div', { class: 'reflect-row' },
        h('div', { class: 'q' }, p.q),
        h('textarea', { class: 'input', rows: '2', onchange: (e) => set(p.id, e.target.value) }, r.answers?.[p.id] || ''))));
  })));
}
