import { h, add } from '../dom.js';
import { icon } from '../icons.js';
import { STATUS, STATUS_LABEL } from '../../content/defaults.js';
import { addDays, formatLong, weekKey, weekDays, dayNameShort, fromKey } from '../../core/dates.js';
import { itemsForDay, dayType } from '../../core/schedule.js';
import { ensureDay, setStatus, getStatus, effectiveSkillId } from '../../core/completion.js';
import { independenceStats, itemTrend } from '../../core/analytics.js';
import { dayCompletion } from '../../core/rewards.js';
import { pcard, segmented, fmtPct } from './common.js';

let cursor = null;

export function renderProgress(body, ctx, parts) {
  const { state, today } = ctx;
  if (parts[0] && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) cursor = parts[0];
  cursor ||= today;
  const key = cursor;
  const day = state.days[key];
  const virtual = { homework: 'unknown', items: {}, steps: {}, physical: {}, skillId: state.skills.activeId };
  const view = day ? { ...day, skillId: key === today ? effectiveSkillId(state, day) : day.skillId } : virtual;
  const items = itemsForDay(state.config, key, view).filter((it) => it.kind !== 'presentation');
  const go = (k) => { cursor = k; ctx.navigate('#/parent/progress/' + k); };

  // ── week strip navigator
  const wk = weekKey(key);
  add(body, h('div', { class: 'day-nav' },
    h('button', { class: 'icon-btn', onclick: () => go(addDays(key, -7)), 'aria-label': 'Önceki hafta' }, icon('back', 18)),
    h('div', { class: 'week-strip grow' }, weekDays(wk).map((k) => {
      const c = dayCompletion(state, k);
      const cls = !state.days[k] || !c.total ? 'none' : c.ratio === 1 ? 'full' : c.ratio >= state.config.rewards.goodDayRatio ? 'good' : 'some';
      return h('div', { class: `wday ${k === key ? 'today' : ''} ${k > today ? 'future' : ''}`, style: { minHeight: '70px' }, onclick: () => { if (k <= today) go(k); } },
        h('div', { class: 'dn' }, dayNameShort(k)), h('div', { class: 'dd' }, fromKey(k).getDate()), h('div', { class: `dot ${cls}` }, cls === 'none' ? null : cls === 'some' ? h('span', { style: { fontSize: '11px', fontWeight: 900 } }, c.done) : icon('check', 14)));
    })),
    h('button', { class: 'icon-btn', onclick: () => go(addDays(key, 7)), 'aria-label': 'Sonraki hafta' }, icon('chevron', 18))));

  const grid = h('div', { class: 'grid grid-2' });

  // ── day editor
  const editor = pcard(formatLong(key), 'calendar',
    h('div', { class: 'row wrap', style: { marginBottom: '10px' } },
      segmented([['weekday', 'Hafta içi'], ['weekend', 'Hafta sonu']], dayType(key, view), (v) => ctx.update((s) => { ensureDay(s, key).dayType = v; })),
      segmented([['unknown', 'Ödev ?'], ['exists', 'Ödev var'], ['none', 'Ödev yok']], view.homework, (v) => ctx.update((s) => { ensureDay(s, key).homework = v; }))),
    !day ? h('div', { class: 'small muted', style: { marginBottom: '8px' } }, 'Bu gün için kayıt yok — işaretleme yapınca oluşur.') : null,
    h('div', { class: 'stack' }, items.map((it) => {
      const st = getStatus(view, it.id);
      const title = it.kind === 'skill' ? (state.skills.pool.find((s) => s.id === view.skillId)?.title || it.title) : it.title;
      return h('div', { class: 'list-row', style: { flexWrap: 'wrap' } },
        h('div', { class: 'grow', style: { fontWeight: 800, minWidth: '140px' } }, title, it.kind === 'homework' && view.homework !== 'exists' ? h('span', { class: 'small muted' }, ' (sayılmaz)') : null),
        h('div', { class: 'status-seg' },
          [[STATUS.INDEPENDENT, 'ind', 'Kendi'], [STATUS.REMINDER, 'rem', 'Hatırlatma'], [STATUS.ASSISTED, 'ass', 'Birlikte'], [STATUS.COMPLETED_UNSPECIFIED, 'unk', 'Yaptı (?)'], [STATUS.NOT_DONE, 'no', 'Yapılmadı']].map(([v, cls, label]) =>
            h('button', { class: `${cls} ${st === v ? 'on' : ''}`, title: v === STATUS.COMPLETED_UNSPECIFIED ? 'Tamamlandı, nasıl yapıldığı belirtilmedi' : null, onclick: () => ctx.update((s) => { const d = ensureDay(s, key); setStatus(d, it.id, st === v ? null : v); if (it.kind === 'homework' && v !== STATUS.NOT_DONE && st !== v) d.homework = 'exists'; }) }, label))));
    })),
    day?.legacy ? h('div', { class: 'small muted', style: { marginTop: '10px' } }, `v1 arşivi: ${day.legacy.stars ?? '—'} yıldız, ${Object.values(day.legacy.tikler || {}).filter(Boolean).length} işaret${day.legacy.unsaved ? ' (kaydedilmemiş gün)' : ''}`) : null);
  add(grid, editor);

  // ── per-item independence, last 30 days
  const from = addDays(today, -29);
  const rows = state.config.items.filter((it) => it.kind !== 'presentation').map((it) => ({ it, s: independenceStats(state, from, today, it.id) })).filter((x) => x.s.applicable);
  add(grid, pcard('Görev bazında — son 30 gün', 'chart',
    rows.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Görev'), h('th', {}, 'Tamamlama'), h('th', {}, 'Kendi'), h('th', {}, 'Hatırlatma'), h('th', {}, 'Birlikte'))),
      h('tbody', {}, rows.map(({ it, s }) => h('tr', {}, h('td', { style: { fontWeight: 800 } }, it.title), h('td', {}, fmtPct(s.completionRate)), h('td', {}, fmtPct(s.rate)), h('td', {}, s.reminder), h('td', {}, s.assisted)))))) : h('div', { class: 'muted small' }, 'Henüz veri yok.'),
    h('div', { class: 'small muted', style: { marginTop: '8px' } }, 'Tamamlama = tamamlanan / uygulanabilir görev ("Yaptı (?)" dahil). Kendi = "Kendim yaptım" / sınıflandırılmış tamamlama (Kendi + Hatırlatma + Birlikte); "Yaptı (?)" bu orana girmez, "–" = henüz sınıflandırılmış yok.')));

  // ── independence trend 8 weeks (all items)
  const trend = itemTrend(state, null, today, 8);
  add(grid, pcard('Bağımsızlık eğilimi — 8 hafta', 'compass',
    h('div', { class: 'small muted', style: { marginBottom: '6px' } }, 'Haftalık: "Kendim yaptım" / sınıflandırılmış tamamlama. Boş çubuk = o hafta sınıflandırılmış tamamlama yok.'),
    h('div', { class: 'bars' }, trend.map((w) => h('div', { class: 'b', title: `${w.wk}: ${fmtPct(w.rate)}` }, h('i', { class: w.classified ? '' : 'none', style: { height: `${Math.max(4, (w.rate || 0) * 100)}%` } }), h('span', {}, fromKey(w.wk).getDate()))))));

  add(body, grid);
  add(body, h('div', { class: 'row', style: { marginTop: '14px' } }, h('a', { class: 'btn btn-ghost btn-sm', href: `#/print/${wk}` }, icon('printer', 16), 'Bu haftayı yazdır')));
}
