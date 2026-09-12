import { h, add } from '../dom.js';
import { icon } from '../icons.js';
import { addDays, weekKey, weekDays, formatShort, dayNameShort, fromKey } from '../../core/dates.js';
import { independenceStats, dailySeries, itemTrend, recentAchievements, explorerStats } from '../../core/analytics.js';
import { bookStats, activeBook } from '../../core/library.js';
import { dueItems, memoByStatus } from '../../core/memorization.js';
import { dailyReviewSet } from '../../core/dailyReview.js';
import { REVIEW_RESULT_LABEL } from '../../content/defaults.js';
import { activeProject } from '../../core/projects.js';
import { activeSkill, evaluateGraduation, graduateSkill } from '../../core/skills.js';
import { weeklyStatus } from '../../core/rewards.js';
import { pcard, fmtPct } from './common.js';
import { SKILL_STATUS_LABEL } from '../../content/defaults.js';

export function renderDashboard(body, ctx) {
  const { state, today } = ctx;
  const s7 = independenceStats(state, addDays(today, -6), today);
  const s30 = independenceStats(state, addDays(today, -29), today);
  const grid = h('div', { class: 'grid grid-2 grid-wide' });

  // ── North star: independent / classified (unspecified completions are outside the ratio)
  add(grid, pcard('Bağımsız Tamamlama Oranı', 'compass',
    h('div', { class: 'row', style: { alignItems: 'flex-end', gap: '22px' } },
      h('div', {}, h('div', { class: 'big' }, fmtPct(s7.rate)), h('div', { class: 'small muted' }, `son 7 gün · ${s7.independent}/${s7.classified} sınıflandırılmış`)),
      h('div', {}, h('div', { class: 'big', style: { fontSize: '28px', color: 'var(--ink-2)' } }, fmtPct(s30.rate)), h('div', { class: 'small muted' }, `son 30 gün · ${s30.independent}/${s30.classified}`))),
    stackBar(s7),
    h('div', { class: 'small muted', style: { marginTop: '8px' } }, s7.days ? `${s7.days} kayıtlı gün · ${s7.applicable} görev` : 'Bu hafta henüz kayıt yok.'),
    h('div', { class: 'small muted', style: { marginTop: '4px' } },
      'Bağımsız oran = "Kendim yaptım" / sınıflandırılmış tamamlamalar (Kendi + Hatırlatma + Birlikte). "Belirtilmedi" bu orana girmez.'),
    h('div', { class: 'small muted', style: { marginTop: '4px' } },
      `Sınıflandırma kapsamı: ${fmtPct(s7.classifiedRate)} (7 gün) · ${fmtPct(s30.classifiedRate)} (30 gün) — tamamlanan görevlerin nasıl yapıldığı belirtilen payı.`),
    s7.unspecified ? h('div', { class: 'small muted', style: { marginTop: '4px' } },
      `${s7.unspecified} tamamlanan görevin nasıl yapıldığı belirtilmedi. `,
      h('a', { href: '#/parent/progress', style: { fontWeight: 800 } }, 'İlerleme\'de işaretle →')) : null));

  // ── Completion overview (14 days)
  const keys = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const series = dailySeries(state, keys);
  add(grid, pcard('Tamamlama — son 14 gün', 'chart',
    h('div', { class: 'bars' }, series.map((d) => h('div', { class: 'b', title: `${formatShort(d.key)}: ${d.done}/${d.total}` },
      h('i', { class: !d.recorded || !d.total ? 'none' : d.ratio < state.config.rewards.goodDayRatio ? 'low' : '', style: { height: `${Math.max(4, d.ratio * 100)}%` } }),
      h('span', {}, dayNameShort(d.key)[0])))),
    h('div', { class: 'small muted', style: { marginTop: '6px' } }, `Tamamlama oranı = tamamlanan / uygulanabilir görev (Belirtilmedi dahil): ${fmtPct(s7.completionRate)} (7 gün) · ${fmtPct(s30.completionRate)} (30 gün)`)));

  // ── Routine trends
  const trendCard = pcard('Rutin eğilimi — 4 hafta', 'list');
  for (const id of ['morning', 'evening']) {
    const t = itemTrend(state, id, today, 4);
    add(trendCard, h('div', { style: { fontWeight: 800, fontSize: '14px', margin: '8px 0 6px' } }, state.config.routines[id].title),
      h('div', { class: 'trend' }, t.map((w) => h('div', { class: 'w' },
        h('div', { class: 'v' }, w.applicable ? fmtPct(w.completionRate) : '–'),
        h('div', { class: 'l' }, !w.applicable ? formatShort(w.wk) : w.classified ? `${fmtPct(w.rate)} kendi` : 'belirtilmedi')))));
  }
  add(grid, trendCard);

  // ── Current skill
  const skill = activeSkill(state);
  const skillCard = pcard('Haftanın becerisi', 'seed');
  if (skill) {
    const ev = evaluateGraduation(state, skill.id, today);
    const g = state.skills.graduation;
    add(skillCard, 
      h('div', { style: { fontSize: '18px', fontWeight: 800 } }, skill.title),
      h('div', { class: 'small muted' }, SKILL_STATUS_LABEL[skill.status]),
      h('div', { class: 'check-list' },
        checkRow(ev.checks.observed, `Gözlem: ${ev.observed} gün (en az ${g.minDaysObserved})`),
        checkRow(ev.checks.completion, `Tamamlama ${fmtPct(ev.completion)} (hedef ${fmtPct(g.minCompletion)})`),
        checkRow(ev.checks.independence, `Bağımsız ${fmtPct(ev.independence)} (hedef ${fmtPct(g.minIndependent)})`),
        checkRow(ev.checks.lastN, `Son ${g.lastN} uygulamanın ${ev.lastN.independent}'i hatırlatmasız (en az ${g.minNoReminder})`)),
      ev.eligible ? h('button', { class: 'btn btn-primary btn-sm', style: { marginTop: '12px' }, onclick: () => ctx.update((s) => graduateSkill(s, skill.id, today)) }, icon('check', 18), 'Mezun et — artık yapabiliyor') : null,
      h('a', { class: 'small', href: '#/parent/skills', style: { display: 'block', marginTop: '10px', fontWeight: 800 } }, 'Becerileri yönet →'));
  } else {
    add(skillCard, h('div', { class: 'muted' }, 'Aktif beceri yok.'), h('a', { class: 'btn btn-soft btn-sm', href: '#/parent/skills', style: { marginTop: '10px' } }, 'Beceri seç'));
  }
  add(grid, skillCard);

  // ── Presentation + weekly choice
  const wk = weekKey(today);
  const pres = state.weeks?.[wk]?.presentation || {};
  const w = weeklyStatus(state, wk);
  add(grid, pcard('Bu hafta', 'calendar',
    h('div', { class: 'kv' }, h('span', {}, 'Sunum konusu'), h('span', {}, pres.topic || '—')),
    h('div', { class: 'kv' }, h('span', {}, 'Hazırlık'), h('span', {}, pres.prepared ? 'Tamam' : 'Bekliyor')),
    h('div', { class: 'kv' }, h('span', {}, 'Sunum'), h('span', {}, pres.presented ? `Yapıldı (${formatShort(pres.presentedOn || wk)})` : 'Bekliyor')),
    h('div', { class: 'kv' }, h('span', {}, 'İyi gün'), h('span', {}, `${w.goodDays} / ${w.needed}`)),
    h('div', { class: 'kv' }, h('span', {}, state.config.rewards.weekly.title), h('span', {}, w.chosen ? w.chosen : w.unlocked ? 'Açıldı — seçim bekliyor' : 'Henüz açılmadı'))));

  // ── Little Explorer — derived from the daily records; descriptive, never a streak
  const ex = explorerStats(state, today);
  add(grid, pcard('Little Explorer', 'compass',
    h('div', { class: 'row', style: { alignItems: 'flex-end', gap: '22px' } },
      h('div', {}, h('div', { class: 'big' }, String(ex.thisWeek)), h('div', { class: 'small muted' }, 'çalışma günü · bu hafta')),
      h('div', {}, h('div', { class: 'big', style: { fontSize: '28px', color: 'var(--ink-2)' } }, String(ex.thisMonth)), h('div', { class: 'small muted' }, 'bu ay'))),
    h('div', { class: 'small muted', style: { margin: '10px 0 4px', fontWeight: 800 } }, 'Son 14 gün'),
    h('div', { class: 'study-dots', 'aria-label': 'Son 14 günün çalışma günleri' }, ex.last14.map((d) => h('span', { class: d.studied ? 'on' : '', title: `${formatShort(d.key)}: ${d.studied ? 'çalıştı' : 'kayıt yok'}` }))),
    h('div', { class: 'trend', style: { marginTop: '10px' } }, ex.weeks.map((w) => h('div', { class: 'w' }, h('div', { class: 'v' }, String(w.days)), h('div', { class: 'l' }, formatShort(w.wk))))),
    h('div', { class: 'small muted', style: { marginTop: '8px' } }, ex.lastStudied ? `Son çalışma: ${formatShort(ex.lastStudied)}. ` : '', 'Bugün ekranında elle işaretlenen "Little Explorer" günlerinden türetilir; işaretlenmeyen gün çalışma sayılmaz.')));

  // ── Learning memory — lifetime records, not thresholds
  const bs = bookStats(state);
  const book = activeBook(state);
  const memo = memoByStatus(state);
  const due = dueItems(state, today);
  const project = activeProject(state);
  const set = dailyReviewSet(state, today);
  add(grid, pcard('Öğrenme arşivi', 'archive',
    h('div', { class: 'kv' }, h('span', {}, 'Tamamlanan kitap'), h('span', {}, `${bs.completedBooks} kitap · ${bs.completedPages} sayfa`)),
    h('div', { class: 'kv' }, h('span', {}, 'Aile okuması kitabı'), h('span', {}, book ? book.title : '—')),
    h('div', { class: 'kv' }, h('span', {}, 'Ezber'), h('span', {}, `${memo.mastered.length} ezberlendi · ${memo.learning.length} öğreniliyor`)),
    h('div', { class: 'kv' }, h('span', {}, 'Bugünkü tekrar'), h('span', {}, set.total ? `${set.done}/${set.total} · ${set.items.map((it) => (it.done ? '✓ ' : '○ ') + it.title + (it.done ? ` (${REVIEW_RESULT_LABEL[it.review.result].split(' ')[0].toLowerCase()})` : '')).join(', ')}` : '—')),
    h('div', { class: 'kv' }, h('span', {}, 'Aralığı gelen'), h('span', {}, due.length ? due.map((d) => d.title).join(', ') : '—')),
    h('div', { class: 'kv' }, h('span', {}, 'Ayın hafıza projesi'), h('span', {}, project ? project.title : '—')),
    h('div', { class: 'row wrap', style: { marginTop: '10px', gap: '6px 14px' } },
      h('a', { class: 'small', href: '#/parent/library', style: { fontWeight: 800 } }, 'Kitaplık →'),
      h('a', { class: 'small', href: '#/parent/memory', style: { fontWeight: 800 } }, 'Ezber →'),
      h('a', { class: 'small', href: '#/parent/reflections', style: { fontWeight: 800 } }, 'Yansımalar →'))));

  // ── Achievements
  const ach = recentAchievements(state, today, 8);
  add(grid, pcard('Son gelişmeler', 'flag',
    ach.length ? ach.map((a) => h('div', { class: 'ach' }, icon(achIcon(a.type), 18), achLabel(ctx, a), h('span', { class: 'd' }, formatShort(a.date)))) : h('div', { class: 'muted small' }, 'Henüz kayıt yok.')));

  add(body, grid);
}

function stackBar(s) {
  if (!s.applicable) return h('div', { class: 'stack-bar' });
  const seg = (n, cls) => h('i', { class: cls, style: { width: `${(n / s.applicable) * 100}%` } });
  return h('div', {},
    h('div', { class: 'stack-bar' }, seg(s.independent, 'c-ind'), seg(s.reminder, 'c-rem'), seg(s.assisted, 'c-ass'), seg(s.unspecified, 'c-unk'), seg(s.notDone, 'c-no')),
    h('div', { class: 'legend' },
      h('span', {}, h('b', { class: 'c-ind' }), `Kendi ${s.independent}`), h('span', {}, h('b', { class: 'c-rem' }), `Hatırlatma ${s.reminder}`),
      h('span', {}, h('b', { class: 'c-ass' }), `Birlikte ${s.assisted}`), h('span', {}, h('b', { class: 'c-no' }), `Yapılmadı ${s.notDone}`),
      s.unspecified ? h('span', {}, h('b', { class: 'c-unk' }), `Belirtilmedi ${s.unspecified}`) : null));
}

export function checkRow(ok, text) {
  return h('div', { class: ok ? 'ok' : 'no' }, icon(ok ? 'check' : 'minus', 16), text);
}

function achIcon(t) { return { skill_mastered: 'seed', discovery: 'map', presentation: 'mic', weekly_choice: 'gift', comeback: 'hand' }[t] || 'flag'; }
function achLabel(ctx, a) {
  if (a.type === 'skill_mastered') return `Beceri kazanıldı: ${ctx.state.skills.pool.find((s) => s.id === a.skillId)?.title || a.skillId}`;
  if (a.type === 'discovery') return `Keşif: ${ctx.state.config.expedition.items.find((i) => i.id === a.id)?.title || a.id}`;
  if (a.type === 'presentation') return `Sunum: ${a.title || ''}`;
  if (a.type === 'weekly_choice') return `Haftanın seçimi: ${a.title}`;
  if (a.type === 'comeback') return 'Aradan sonra geri döndü';
  return a.type;
}
