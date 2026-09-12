import { h, add } from '../dom.js';
import { icon } from '../icons.js';
import { weekKey, monthKey, formatShort, weekLabel, monthName } from '../../core/dates.js';
import { weeklyStatus, monthlyStatus, chooseWeekly, chooseMonthly } from '../../core/rewards.js';
import { pcard, field, textInput, numberInput, checkbox, stringList } from './common.js';

export function renderRewards(body, ctx) {
  const { state, today } = ctx;
  const r = state.config.rewards;
  const wk = weekKey(today), mk = monthKey(today);
  const w = weeklyStatus(state, wk), m = monthlyStatus(state, mk);
  const set = (fn) => ctx.update((s) => fn(s.config.rewards));

  add(body, h('p', { class: 'small muted', style: { marginBottom: '12px' } }, 'Ödüller gelişimi kutlar; sorumluluğu satın almaz. Günlük: küçük geri bildirim. Haftalık: bir seçim hakkı. Aylık: anlamlı bir kutlama.'));
  const grid = h('div', { class: 'grid grid-2' });

  add(grid, pcard('Bu hafta', 'gift',
    h('div', { class: 'kv' }, h('span', {}, weekLabel(wk)), h('span', {}, w.unlocked ? 'Açıldı' : 'Henüz değil')),
    h('div', { class: 'kv' }, h('span', {}, 'İyi gün'), h('span', {}, `${w.goodDays} / ${w.needed}`)),
    r.requirePresentation ? h('div', { class: 'kv' }, h('span', {}, 'Sunum'), h('span', {}, w.presentationDone ? 'Tamam' : 'Bekliyor')) : null,
    h('div', { class: 'kv' }, h('span', {}, 'Seçim'), h('span', {}, w.chosen || '—')),
    h('div', { class: 'row wrap', style: { marginTop: '10px' } },
      r.weekly.options.map((o) => h('button', { class: `chip ${w.chosen === o ? 'on' : ''}`, onclick: () => ctx.update((s) => chooseWeekly(s, wk, o, today)) }, o)),
      w.chosen ? h('button', { class: 'chip muted', onclick: () => ctx.update((s) => { delete s.weeks[wk].weeklyChoice; }) }, 'Temizle') : null)));

  add(grid, pcard('Bu ay', 'flag',
    h('div', { class: 'kv' }, h('span', {}, monthName(mk)), h('span', {}, m.unlocked ? 'Açıldı' : 'Henüz değil')),
    h('div', { class: 'kv' }, h('span', {}, 'Açılan hafta'), h('span', {}, `${m.unlockedWeeks} / ${m.needed}`)),
    h('div', { class: 'kv' }, h('span', {}, 'Kutlama'), h('span', {}, m.chosen || '—')),
    h('div', { class: 'row wrap', style: { marginTop: '10px' } },
      r.monthly.options.map((o) => h('button', { class: `chip warm ${m.chosen === o ? 'on' : ''}`, onclick: () => ctx.update((s) => chooseMonthly(s, mk, o, today)) }, o)),
      m.chosen ? h('button', { class: 'chip muted', onclick: () => ctx.update((s) => { delete s.months[mk].celebration; }) }, 'Temizle') : null)));

  add(grid, pcard('Haftalık ölçütler', 'gear',
    field('Başlık', textInput(r.weekly.title, (v) => set((x) => { x.weekly.title = v; }))),
    h('div', { class: 'kv' }, h('span', {}, 'Gereken iyi gün'), numberInput(r.weekly.minGoodDays, (v) => set((x) => { x.weekly.minGoodDays = v; }), { min: 1, max: 7 })),
    h('div', { class: 'kv' }, h('span', {}, '"İyi gün" eşiği (%)'), numberInput(Math.round(r.goodDayRatio * 100), (v) => set((x) => { x.goodDayRatio = v / 100; }), { min: 10, max: 100 })),
    checkbox('Haftanın sunumu da gerekli', r.weekly.requirePresentation, (v) => set((x) => { x.weekly.requirePresentation = v; })),
    h('div', { class: 'section-title' }, 'Seçenekler'),
    stringList(r.weekly.options, (next) => set((x) => { x.weekly.options = next; }))));

  add(grid, pcard('Aylık ölçütler', 'gear',
    field('Başlık', textInput(r.monthly.title, (v) => set((x) => { x.monthly.title = v; }))),
    h('div', { class: 'kv' }, h('span', {}, 'Gereken açılmış hafta'), numberInput(r.monthly.minWeeklyUnlocks, (v) => set((x) => { x.monthly.minWeeklyUnlocks = v; }), { min: 1, max: 5 })),
    h('div', { class: 'section-title' }, 'Seçenekler'),
    stringList(r.monthly.options, (next) => set((x) => { x.monthly.options = next; }))));

  add(body, grid);

  // history of choices
  const hist = Object.entries(state.weeks || {}).filter(([, w2]) => w2?.weeklyChoice?.chosen).sort((a, b) => b[0].localeCompare(a[0]));
  if (hist.length) {
    add(body, h('div', { class: 'section-title' }, 'Geçmiş seçimler'));
    add(body, h('div', { class: 'pcard' }, hist.map(([k, w2]) => h('div', { class: 'ach' }, icon('gift', 16), w2.weeklyChoice.chosen, h('span', { class: 'd' }, formatShort(w2.weeklyChoice.chosenAt || k))))));
  }
}
