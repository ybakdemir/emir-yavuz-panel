import { h, add, openSheet } from '../dom.js';
import { icon, footprintStamp } from '../icons.js';
import { weekKey, weekDays, weekLabel, dayNameShort, fromKey, formatLong, formatShort } from '../../core/dates.js';
import { dayCompletion, weeklyStatus, chooseWeekly } from '../../core/rewards.js';
import { activeSkill, evaluateGraduation } from '../../core/skills.js';
import { coreItemsForDay } from '../../core/schedule.js';
import { getStatus, isCompleted } from '../../core/completion.js';
import { independenceStats } from '../../core/analytics.js';
import { weeklyMessageFor } from '../../core/messages.js';
import { STATUS_LABEL, SKILL_STATUS_LABEL, PROJECT_TYPE_LABEL, REFLECTION_PROMPTS } from '../../content/defaults.js';
import { activeProject } from '../../core/projects.js';
import { reflectionFor, saveReflection, skipReflection, unskipReflection, isReflectionWindow, hasAnswers } from '../../core/reflections.js';
import { monthName } from '../../core/dates.js';
import { taskIcon, pageHero, sectionHead, bubble, badgeArt, companion } from './components.js';
import { motif, glyph } from '../art.js';

export function renderWeek(main, ctx) {
  const { state, today } = ctx;
  const wk = weekKey(today);
  const days = weekDays(wk);
  const goodRatio = state.config.rewards.goodDayRatio;

  const goodDays = days.filter((k) => state.days[k] && dayCompletion(state, k).ratio >= goodRatio).length;
  const name = state.config.settings.childName || 'Emir';
  const w = weeklyStatus(state, wk);
  const r = state.config.rewards.weekly;

  // ── hero (reference 02-WEEK): "HAFTAM" sign, "Harika gidiyorsun Emir!", one line about the week
  add(main, pageHero({
    variant: 'full', hero: 'week', label: 'Haftam', kicker: 'Haftam', title: `Harika gidiyorsun ${name}!`,
    sub: 'Bu hafta da sağlıklı alışkanlıklarla daha güçlü bir sen!', cls: 'hero-week',
  }));

  // ── torn parchment: "Bu Haftaki Yolculuğum" + week range, seven day circles on a row
  add(main, h('section', { class: 'paper torn week-paper', 'aria-label': 'Bu haftaki yolculuğum' },
    h('div', { class: 'wp-head' }, h('h2', {}, 'Bu Haftaki Yolculuğum'), h('span', { class: 'wp-range' }, weekLabel(wk))),
    h('div', { class: 'week-strip', 'aria-label': 'Haftanın günleri' }, days.map((k) => {
      const c = dayCompletion(state, k);
      const future = k > today, isToday = k === today;
      const cls = !state.days[k] || c.total === 0 ? 'none' : c.ratio === 1 ? 'full' : c.ratio >= goodRatio ? 'good' : 'some';
      return h('div', { class: `wday ${isToday ? 'today' : ''} ${future ? 'future' : ''} d-${cls}`, role: future ? null : 'button', tabindex: future ? null : '0',
        'aria-label': `${dayNameShort(k)} ${fromKey(k).getDate()}`, onclick: () => { if (!future) openDaySheet(ctx, k); },
        onkeydown: (e) => { if (!future && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDaySheet(ctx, k); } } },
        h('div', { class: 'dot' },
          isToday && cls !== 'full' && cls !== 'good' ? h('span', { class: 'rays', 'aria-hidden': 'true' }) : null,
          cls === 'full' || cls === 'good' ? icon('check', 22) : cls === 'some' ? h('b', {}, `${c.done}`) : footprintStamp(18)),
        h('div', { class: 'dn' }, dayNameShort(k)),
        isToday ? h('span', { class: 'today-pill' }, 'Bugün') : null);
    }))));

  // ── "N iyi gün" card (reference 02-WEEK): the achievement badge, the count, the weekly note, a bubble and the companion
  add(main, h('section', { class: 'card streak', 'aria-label': 'Bu haftaki iyi günler' },
    h('div', { class: 'streak-badge', 'aria-hidden': 'true' }, badgeArt(84)),
    h('div', { class: 'grow' },
      h('div', { class: 'streak-n' }, `${goodDays} İyi Gün`),
      h('div', { class: 'streak-t' }, goodDays ? 'Harika bir istikrar!' : 'Yeni bir hafta başlıyor!'),
      h('div', { class: 'streak-s' }, weeklyMessage(ctx, wk))),
    h('div', { class: 'streak-side' }, bubble('İstikrar, keşfin en güçlü arkadaşıdır!', { tone: 'sunny', side: 'left' }),
      h('div', { class: 'streak-dino', 'aria-hidden': 'true' }, companion(96)))));

  // ── "Bu Hafta" summary: planned tasks, good days (with bar), this week's achievement — derived, nothing new is stored
  const planned = coreItemsForDay(state.config, today, state.days[today] || { homework: 'unknown', items: {} }).length;
  const achievement = w.chosen ? `Seçimin: ${w.chosen}` : w.unlocked ? `${r.title} açıldı — seçim senin!` : `${w.needed} iyi gün${w.requirePresentation ? ' ve sunum' : ''} → ${r.title.toLowerCase()} senin.`;
  add(main, h('section', { class: 'card week-sum', 'aria-label': 'Bu hafta' },
    h('div', { class: 'card-head' }, h('h2', {}, 'Bu Hafta'), h('a', { class: 'link-arrow aside', href: `#/print/${wk}` }, 'Detayları gör', icon('chevron', 16))),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('div', { class: 'st-hd' }, h('span', { class: 'st-ic clay' }, glyph('compass', 22)), h('span', { class: 'st-l' }, 'Planladığım Görevler')), h('div', { class: 'st-v' }, planned), h('div', { class: 'st-t' }, 'görev')),
      h('div', { class: 'stat' }, h('div', { class: 'st-hd' }, h('span', { class: 'st-ic' }, icon('check', 22)), h('span', { class: 'st-l' }, 'Tamamladığım Günler')), h('div', { class: 'st-v' }, goodDays, h('small', {}, `/ ${days.length}`)), h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(days.length), 'aria-valuenow': String(goodDays) }, h('i', { style: { width: `${(goodDays / days.length) * 100}%` } }))),
      h('div', { class: 'stat' }, h('div', { class: 'st-hd' }, h('span', { class: 'st-ic gold' }, glyph('gift', 22)), h('span', { class: 'st-l' }, 'Bu Haftaki Başarım')), h('div', { class: 'st-t' }, achievement)))));

  add(main, sectionHead('Haftanın hedefleri', 'Bu haftanın yolu', { cls: 'sec-on-jungle' }));
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
            h('button', { class: `chip ${pres.presented ? 'on' : ''}`, onclick: () => { const was = pres.presented; setPres(was ? { presented: false, presentedOn: null } : { presented: true, prepared: true, presentedOn: today }); if (!was) ctx.celebrate('presentation_done', { dinoKind: 'parasaurolophus', kicker: 'Haftanın sunumu', title: pres.topic || 'Haftanın sunumu' }); } }, pres.presented ? icon('check', 16) : null, 'Sundum'),
            h('button', { class: 'chip muted', onclick: () => setPres({ topic: null }) }, 'Değiştir')))
        : h('div', {}, h('div', { class: 'small muted', style: { marginBottom: '8px' } }, 'Bu hafta ne anlatmak istersin?'),
          h('div', { class: 'row wrap' }, state.config.presentation.topics.map((t) => h('button', { class: 'chip', onclick: () => setPres({ topic: t }) }, t))))));
  add(main, presCard);

  // ── Weekly Choice
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

  // ── Ayın Hafıza Projesi — planning context only; there is nothing to tick here.
  const project = activeProject(state);
  if (project) {
    add(main, h('div', { class: 'card week-card wc-project' }, motif('leaf'),
      h('div', { class: 'hd' }, taskIcon('leaf', 'gold'), h('div', { class: 'grow' }, h('h3', {}, 'Ayın Hafıza Projesi'), h('div', { class: 'small muted' }, `${PROJECT_TYPE_LABEL[project.type] || ''} · ${monthName(project.targetMonth + '-01')}`))),
      h('div', { class: 'bd' },
        h('div', { class: 'wc-title' }, project.title),
        h('div', { class: 'wc-hint' }, 'Acele yok. Bu ay boyunca küçük parçalar hâlinde ezberliyoruz.'),
        h('a', { class: 'small', href: '#/archive/memory', style: { display: 'inline-block', marginTop: '8px', fontWeight: 800 } }, 'Ezberlerim →'))));
  }

  // ── Haftamı Düşünüyorum — optional, weekend only, three short prompts, skippable.
  if (isReflectionWindow(today)) add(main, reflectionCard(ctx, wk));

  // ── parchment quote scroll (reference copy) — a leaf and footprints; the companion already stands on the streak card
  add(main, h('div', { class: 'quote-scroll', 'aria-label': 'Haftanın sözü' },
    h('div', { class: 'qs-leaf', 'aria-hidden': 'true' }, glyph('leaf', 34)),
    h('div', { class: 'qs-paper' }, '“Her yeni hafta, yeni bir keşif fırsatıdır!”'),
    h('div', { class: 'qs-prints', 'aria-hidden': 'true' }, footprintStamp(22), footprintStamp(22))));

  add(main, h('div', { class: 'row', style: { marginTop: '18px', justifyContent: 'center' } },
    h('a', { class: 'btn btn-ghost on-jungle', href: `#/print/${wk}` }, icon('printer', 20), 'Haftamı yazdır')));
}

function reflectionCard(ctx, wk) {
  const r = reflectionFor(ctx.state, wk);
  const card = h('div', { class: 'card week-card wc-reflect' }, motif('leaf'),
    h('div', { class: 'hd' }, taskIcon('leaf', 'forest'), h('div', { class: 'grow' }, h('h3', {}, 'Haftamı Düşünüyorum'), h('div', { class: 'small muted' }, 'İstersen. Kısa cümleler yeter.'))));
  if (r?.skipped && !hasAnswers(r)) {
    add(card, h('div', { class: 'bd row wrap' }, h('div', { class: 'small muted grow' }, 'Bu hafta atladın — sorun değil.'),
      h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => unskipReflection(s, wk)) }, 'Yine de yazayım')));
    return card;
  }
  const inputs = {};
  const body = h('div', { class: 'bd stack' }, REFLECTION_PROMPTS.map((p) => {
    inputs[p.id] = h('input', { class: 'input reflect-in', type: 'text', maxlength: '140', value: r?.answers?.[p.id] || '', placeholder: '…', 'aria-label': p.q });
    return h('label', { class: 'reflect-q' }, h('span', {}, p.q), inputs[p.id]);
  }));
  const saved = hasAnswers(r);
  add(card, body, h('div', { class: 'row wrap', style: { padding: '0 18px 18px' } },
    h('button', { class: 'btn btn-primary btn-sm', onclick: () => { ctx.update((s) => saveReflection(s, wk, Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.value])), ctx.today)); if (saved) ctx.toast('Güncelledim.'); else ctx.celebrate('reflection_saved', { glyph: 'leaf' }); } }, icon('check', 16), saved ? 'Güncelle' : 'Kaydet'),
    saved ? h('span', { class: 'small muted' }, `Yazdım: ${formatShort(r.savedOn || wk)}`) : h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => skipReflection(s, wk, ctx.today)) }, 'Bu hafta geç')));
  return card;
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
