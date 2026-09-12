import { h, add, openSheet } from '../dom.js';
import { icon } from '../icons.js';
import { weekKey, weekDays, weekLabel, dayNameShort, fromKey, formatLong } from '../../core/dates.js';
import { dayCompletion, weeklyStatus, chooseWeekly } from '../../core/rewards.js';
import { activeSkill, evaluateGraduation } from '../../core/skills.js';
import { coreItemsForDay } from '../../core/schedule.js';
import { getStatus, isCompleted } from '../../core/completion.js';
import { independenceStats } from '../../core/analytics.js';
import { STATUS_LABEL, SKILL_STATUS_LABEL } from '../../content/defaults.js';
import { taskIcon } from './components.js';

export function renderWeek(main, ctx) {
  const { state, today } = ctx;
  const wk = weekKey(today);
  const days = weekDays(wk);
  const goodRatio = state.config.rewards.goodDayRatio;

  add(main, h('header', { class: 'week-head' }, h('h1', {}, 'Bu Hafta'), h('div', { class: 'muted', style: { fontWeight: 800 } }, weekLabel(wk))));

  // ── Mon–Sun strip
  add(main, h('div', { class: 'week-strip' }, days.map((k) => {
    const c = dayCompletion(state, k);
    const future = k > today;
    const cls = !state.days[k] || c.total === 0 ? 'none' : c.ratio === 1 ? 'full' : c.ratio >= goodRatio ? 'good' : 'some';
    return h('div', { class: `wday ${k === today ? 'today' : ''} ${future ? 'future' : ''}`, role: future ? null : 'button', tabindex: future ? null : '0',
      onclick: () => { if (!future) openDaySheet(ctx, k); } },
      h('div', { class: 'dn' }, dayNameShort(k)), h('div', { class: 'dd' }, fromKey(k).getDate()),
      h('div', { class: `dot ${cls}` }, cls === 'full' || cls === 'good' ? icon('check', 16) : cls === 'some' ? h('span', { style: { fontSize: '11px', fontWeight: 900 } }, `${c.done}`) : null));
  })));

  // ── encouraging message
  add(main, h('div', { class: 'msg' }, icon('hand', 26), weeklyMessage(ctx, wk)));

  // ── Skill of the week
  const skill = activeSkill(state);
  const skillCard = h('div', { class: 'card week-card' },
    h('div', { class: 'hd' }, taskIcon('seed'), h('div', { class: 'grow' }, h('h3', {}, 'Haftanın Becerisi'), h('div', { class: 'small muted' }, skill ? SKILL_STATUS_LABEL[skill.status] : ''))));
  if (skill) {
    const ev = evaluateGraduation(state, skill.id, today);
    add(skillCard, h('div', { class: 'bd' },
      h('div', { style: { fontSize: '18px', fontWeight: 800 } }, skill.title),
      skill.hint ? h('div', { class: 'small muted', style: { marginTop: '2px' } }, skill.hint) : null,
      h('div', { class: 'dots', 'aria-label': 'Bu haftaki günler' }, days.map((k) => {
        const st = state.days[k]?.items?.skill?.status;
        return h('span', { class: st === 'independent' ? 'ok' : isCompleted(st) ? 'half' : '', title: dayNameShort(k) });
      })),
      ev.eligible ? h('div', { class: 'pill pill-green', style: { marginTop: '10px' } }, icon('check', 14), 'Artık yapabiliyorsun gibi görünüyor!') : null));
  } else {
    add(skillCard, h('div', { class: 'bd muted' }, 'Bu hafta için henüz beceri seçilmedi.'));
  }
  add(main, skillCard);

  // ── Presentation of the week
  const pres = state.weeks?.[wk]?.presentation || {};
  const setPres = (patch) => ctx.update((s) => { s.weeks[wk] ||= {}; s.weeks[wk].presentation = { ...(s.weeks[wk].presentation || {}), ...patch }; });
  const presCard = h('div', { class: 'card week-card' },
    h('div', { class: 'hd' }, taskIcon('mic', 'sky'), h('div', { class: 'grow' }, h('h3', {}, 'Haftanın Sunumu'), h('div', { class: 'small muted' }, `${state.config.presentation.targetMinutes} dakika`))),
    h('div', { class: 'bd' },
      pres.topic
        ? h('div', {}, h('div', { style: { fontSize: '18px', fontWeight: 800 } }, pres.topic),
          h('div', { class: 'row wrap', style: { marginTop: '10px' } },
            h('button', { class: `chip ${pres.prepared ? 'on' : ''}`, onclick: () => setPres({ prepared: !pres.prepared }) }, pres.prepared ? icon('check', 16) : null, 'Hazırlandım'),
            h('button', { class: `chip ${pres.presented ? 'on' : ''}`, onclick: () => setPres(pres.presented ? { presented: false, presentedOn: null } : { presented: true, prepared: true, presentedOn: today }) }, pres.presented ? icon('check', 16) : null, 'Sundum'),
            h('button', { class: 'chip muted', onclick: () => setPres({ topic: null }) }, 'Değiştir')))
        : h('div', {}, h('div', { class: 'small muted', style: { marginBottom: '8px' } }, 'Bu hafta ne anlatmak istersin?'),
          h('div', { class: 'row wrap' }, state.config.presentation.topics.map((t) => h('button', { class: 'chip', onclick: () => setPres({ topic: t }) }, t))))));
  add(main, presCard);

  // ── Weekly Choice
  const w = weeklyStatus(state, wk);
  const r = state.config.rewards.weekly;
  const choiceCard = h('div', { class: 'card week-card' },
    h('div', { class: 'hd' }, taskIcon('gift', 'amber'), h('div', { class: 'grow' }, h('h3', {}, r.title), h('div', { class: 'small muted' }, w.unlocked ? 'Açıldı!' : `${w.goodDays}/${w.needed} iyi gün` + (w.requirePresentation ? (w.presentationDone ? ' · sunum tamam' : ' · sunum bekliyor') : '')))));
  if (w.chosen) {
    add(choiceCard, h('div', { class: 'bd' }, h('div', { class: 'pill pill-amber' }, icon('check', 14), 'Seçimin'), h('div', { style: { fontSize: '18px', fontWeight: 800, marginTop: '6px' } }, w.chosen)));
  } else if (w.unlocked) {
    add(choiceCard, h('div', { class: 'bd stack' }, h('div', { class: 'small muted' }, 'Bu hafta sen seçiyorsun:'),
      r.options.map((o) => h('button', { class: 'choice-opt', onclick: () => ctx.update((s) => chooseWeekly(s, wk, o, today)) }, icon('chevron', 18), o))));
  } else {
    add(choiceCard, h('div', { class: 'bd' },
      h('div', { class: 'dots' }, days.map((k) => h('span', { class: dayCompletion(state, k).ratio >= goodRatio && state.days[k] ? 'ok' : '' }))),
      h('div', { class: 'small muted', style: { marginTop: '8px' } }, `${w.needed} iyi gün${w.requirePresentation ? ' ve sunum' : ''} → haftanın seçimi senin.`)));
  }
  add(main, choiceCard);

  add(main, h('div', { class: 'row', style: { marginTop: '18px', justifyContent: 'center' } },
    h('a', { class: 'btn btn-ghost', href: `#/print/${wk}` }, icon('printer', 20), 'Haftamı yazdır')));
}

function weeklyMessage(ctx, wk) {
  const custom = ctx.state.config.settings.weeklyMessage;
  if (custom) return custom;
  const days = weekDays(wk).filter((k) => k <= ctx.today);
  const st = independenceStats(ctx.state, days[0], days[days.length - 1]);
  if (!st.days) return 'Yeni bir hafta. Küçük adımlar, büyük keşifler.';
  if (st.rate >= 0.7) return 'Bu hafta işlerin çoğunu kendin yaptın. Bu tam bir kaşif işi.';
  if (st.completionRate >= 0.7) return 'Güzel bir hafta gidiyor. Bir sonraki adım: hatırlatma olmadan denemek.';
  return 'Her gün yeniden başlamak da bir beceri. Devam.';
}

function openDaySheet(ctx, key) {
  const { state } = ctx;
  const day = state.days[key];
  const items = day ? coreItemsForDay(state.config, key, day) : [];
  const close = openSheet([
    h('div', { class: 'sheet-title' }, formatLong(key)),
    !day ? h('div', { class: 'empty' }, 'Bu gün için kayıt yok.') : h('div', { class: 'stack' }, items.map((it) => {
      const st = getStatus(day, it.id);
      const title = it.kind === 'skill' ? (state.skills.pool.find((s) => s.id === day.skillId)?.title || it.title) : it.title;
      return h('div', { class: 'row', style: { minHeight: '44px' } },
        h('span', { class: `pill ${isCompleted(st) ? 'pill-green' : 'pill-sand'}` }, isCompleted(st) ? icon('check', 14) : null),
        h('div', { class: 'grow', style: { fontWeight: 700 } }, title),
        h('div', { class: 'small muted' }, st ? STATUS_LABEL[st] : 'Yapılmadı'));
    })),
    h('div', { class: 'sheet-actions' }, h('button', { class: 'btn btn-primary', onclick: () => close() }, 'Tamam')),
  ]);
}
