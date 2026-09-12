import { h, add, openSheet } from '../dom.js';
import { icon } from '../icons.js';
import { weekKey, weekDays, weekLabel, dayNameShort, fromKey, formatLong } from '../../core/dates.js';
import { dayCompletion, weeklyStatus, chooseWeekly } from '../../core/rewards.js';
import { activeSkill, evaluateGraduation } from '../../core/skills.js';
import { coreItemsForDay } from '../../core/schedule.js';
import { getStatus, isCompleted } from '../../core/completion.js';
import { independenceStats } from '../../core/analytics.js';
import { weeklyMessageFor } from '../../core/messages.js';
import { STATUS_LABEL, SKILL_STATUS_LABEL } from '../../content/defaults.js';
import { taskIcon } from './components.js';
import { motif } from '../art.js';
import { dino } from '../dinos.js';

export function renderWeek(main, ctx) {
  const { state, today } = ctx;
  const wk = weekKey(today);
  const days = weekDays(wk);
  const goodRatio = state.config.rewards.goodDayRatio;

  add(main, h('header', { class: 'week-head' }, h('div', {}, h('div', { class: 'kicker' }, 'Haftalık yolculuk'), h('h1', {}, 'Bu Hafta')), h('div', { class: 'week-range' }, weekLabel(wk))));

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
  add(main, h('div', { class: 'msg' },
    h('div', { class: 'msg-dino' }, dino('velociraptor', { size: 84 })),
    h('div', { class: 'grow' }, h('div', { class: 'msg-kicker' }, 'Kaşif notu'), h('div', { class: 'msg-txt' }, weeklyMessage(ctx, wk)))));

  // ── Skill of the week
  const skill = activeSkill(state);
  const skillCard = h('div', { class: 'card week-card wc-skill' }, motif('seed'),
    h('div', { class: 'hd' }, taskIcon('seed', 'gold'), h('div', { class: 'grow' }, h('h3', {}, 'Haftanın Becerisi'), h('div', { class: 'small muted' }, skill ? SKILL_STATUS_LABEL[skill.status] : ''))));
  if (skill) {
    const ev = evaluateGraduation(state, skill.id, today);
    add(skillCard, h('div', { class: 'bd' },
      h('div', { class: 'wc-title' }, skill.title),
      skill.hint ? h('div', { class: 'wc-hint' }, skill.hint) : null,
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
  const presCard = h('div', { class: 'card week-card wc-pres' }, motif('mic'),
    h('div', { class: 'hd' }, taskIcon('mic', 'sky'), h('div', { class: 'grow' }, h('h3', {}, 'Haftanın Sunumu'), h('div', { class: 'small muted' }, `${state.config.presentation.targetMinutes} dakika`))),
    h('div', { class: 'bd' },
      pres.topic
        ? h('div', {}, h('div', { class: 'wc-title' }, pres.topic),
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
  const choiceCard = h('div', { class: `card week-card wc-choice ${w.unlocked ? 'unlocked' : ''}` }, motif('gift'),
    h('div', { class: 'hd' }, taskIcon('gift', 'gold'), h('div', { class: 'grow' }, h('h3', {}, r.title), h('div', { class: 'small muted' }, w.unlocked ? 'Açıldı!' : `${w.goodDays}/${w.needed} iyi gün` + (w.requirePresentation ? (w.presentationDone ? ' · sunum tamam' : ' · sunum bekliyor') : '')))));
  if (w.chosen) {
    add(choiceCard, h('div', { class: 'bd' }, h('div', { class: 'pill pill-gold' }, icon('check', 14), 'Seçimin'), h('div', { class: 'wc-title', style: { marginTop: '6px' } }, w.chosen)));
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
  return weeklyMessageFor(independenceStats(ctx.state, ...weekWindow(wk, ctx.today)));
}

function weekWindow(wk, today) {
  const days = weekDays(wk).filter((k) => k <= today);
  return [days[0], days[days.length - 1]];
}
