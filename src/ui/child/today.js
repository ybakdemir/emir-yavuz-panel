import { h, add } from '../dom.js';
import { icon, footprintStamp } from '../icons.js';
import { dino } from '../dinos.js';
import { formatLong, weekKey, dayNameLong } from '../../core/dates.js';
import { itemsForDay, coreItemsForDay, dayType } from '../../core/schedule.js';
import { ensureDay, setStatus, getStatus, isCompleted, effectiveSkillId, DEFAULT_COMPLETION } from '../../core/completion.js';
import { visibleSteps, stepsDone, toggleStep } from '../../core/routines.js';
import { targetsFor, physicalProgress, toggleExercise } from '../../core/physical.js';
import { activeSkill } from '../../core/skills.js';
import { isComeback } from '../../core/analytics.js';
import { activeBook } from '../../core/library.js';
import { dueItems } from '../../core/memorization.js';
import { dailyReviewSet, expandDailySet, recordDailyReview } from '../../core/dailyReview.js';
import { eventForItem } from '../../core/celebration.js';
import { REVIEW_RESULT, REVIEW_RESULT_LABEL, HEALTH_LABEL } from '../../content/defaults.js';
import { ring, trail, howChips, taskIcon, checkCircle, stamp, ICON_TONE } from './components.js';
import { heroScene, exerciseGlyph, glyph } from '../art.js';
import { discoveryCopy } from './celebrate.js';

/** Items whose subtitle is the habit itself and stays after completion. */
const KEEP_SUB = new Set(['explorer']);
const REVIEW_CARD = 'memoryReview';   // openCards key for the daily review card

const openCards = new Map();    // itemId → bool (session only); unset = auto
const justDone = new Set();     // for the footprint stamp animation
const howOpen = new Set();      // cards whose "how did it go" chips are expanded
let autoOpenId = null;          // first incomplete expandable card opens by itself

function isOpen(itemId) {
  return openCards.has(itemId) ? openCards.get(itemId) : autoOpenId === itemId;
}
function toggleOpen(ctx, itemId) {
  openCards.set(itemId, !isOpen(itemId));
  ctx.store.update(() => {});
}

function virtualDay(state) {
  return { homework: 'unknown', items: {}, steps: {}, physical: {}, skillId: state.skills.activeId || null };
}

export function renderToday(main, ctx) {
  const { state, today } = ctx;
  const stored = state.days[today];
  const day = stored ? { ...stored, skillId: effectiveSkillId(state, stored) } : virtualDay(state);
  const name = state.config.settings.childName || 'Emir';
  const items = itemsForDay(state.config, today, day);
  const core = coreItemsForDay(state.config, today, day);
  const doneCount = core.filter((it) => isCompleted(getStatus(day, it.id))).length;
  const allDone = core.length > 0 && doneCount === core.length;
  const comeback = isComeback(state, today);

  // ── hero: greeting, date, encouragement, progress — inside one scenic card
  const remaining = core.length - doneCount;
  const headline = allDone ? 'Bugünün keşfi tamamlandı!' : doneCount === 0 ? 'Bugünkü keşfe hazır mısın?' : remaining === 1 ? 'Son bir adım kaldı' : 'Harika gidiyorsun, kaşif';
  const subline = allDone ? 'Her görevi kendi yolunla bitirdin.' : doneCount === 0 ? `${core.length} görev seni bekliyor.` : `${remaining} görev kaldı — yolun açık.`;
  add(main,
    h('section', { class: `hero ${allDone ? 'complete' : ''}`, 'aria-label': 'Bugün' },
      heroScene(),
      h('a', { href: '#/parent', class: 'parent-link', 'aria-label': 'Ebeveyn modu' }, icon('gear', 20)),
      h('div', { class: 'hero-body' },
        h('div', { class: 'hero-date' }, formatLong(today)),
        h('h1', { class: 'hello' }, `Merhaba ${name}`),
        h('div', { class: 'hero-copy' },
          h('div', { class: 'hero-title' }, headline),
          h('div', { class: 'hero-sub' }, subline)),
        h('div', { class: 'hero-progress' }, ring(doneCount, core.length, 74, 'hero'), trail(doneCount, core.length))),
      h('div', { class: 'hero-dino' }, dino(allDone ? 'trex' : doneCount > 0 ? 'triceratops' : 'brachiosaurus'))));

  if (comeback && doneCount > 0) {
    add(main, h('div', { class: 'note' }, icon('hand', 22), 'Geri dönmek güzel. Bugün yeniden başlıyoruz.'));
  }

  const fresh = ctx.peekDiscoveries();
  if (fresh.length) {
    const { title, reason } = discoveryCopy(state, fresh[fresh.length - 1]);
    // The Expedition page takes the pending discoveries and reveals the newest; the banner only navigates.
    add(main, h('a', { class: 'discovery-banner', href: '#/expedition' },
      icon('map', 28), h('div', { class: 'grow' }, h('div', { class: 't' }, 'Yeni keşif!'), h('div', { class: 's' }, [title, reason].filter(Boolean).join('. '))), icon('chevron', 22)));
  }

  // A skill graduated today is a milestone worth seeing all day, not just once.
  const masteredToday = (state.achievements || []).filter((a) => a.type === 'skill_mastered' && a.date === today);
  if (masteredToday.length) {
    const sk = state.skills.pool.find((x) => x.id === masteredToday[masteredToday.length - 1].skillId);
    add(main, h('button', { class: 'milestone-banner', onclick: () => ctx.celebrate('skill_mastered', { dinoKind: 'stegosaurus', kicker: 'Yeni beceri', message: `${sk?.title || 'Bir beceri'} — artık kendi başına yapabiliyorsun.` }) },
      glyph('seed', 26), h('div', { class: 'grow' }, h('div', { class: 't' }, 'Yeni beceri'), h('div', { class: 's' }, sk ? `${sk.title} — artık kendin yapabiliyorsun.` : 'Artık kendin yapabiliyorsun.')), icon('chevron', 22)));
  }

  // ── Bugünkü Ezber Tekrarım — one compact card for the Daily Review Pool,
  // placed in the task flow right after "3 ayet" (the natural moment for
  // sura review) so the top of Today stays calm. Only when the pool has
  // something; a due item outside the pool still gets the quiet link.
  const review = dailyReviewSet(state, today);
  if (!review.total) {
    const due = dueItems(state, today);
    if (due.length) {
      add(main, h('a', { class: 'quiet-link', href: '#/archive/memory' },
        icon('scroll', 20), h('span', { class: 'grow' }, 'Bugün tekrar zamanı: ', h('b', {}, due.map((d) => d.title).join(', '))), icon('chevron', 18)));
    }
  }

  // ── task cards
  const expandable = items.filter((it) => ['routine', 'physical'].includes(it.kind) && !isCompleted(getStatus(day, it.id)));
  autoOpenId = expandable.find((it) => it.kind !== 'routine' || visibleSteps(state.config.routines[it.id]).length)?.id || null;
  const list = h('div', { class: 'tasks' });
  const book = activeBook(state);
  // after "3 ayet" when it is on the list, otherwise just before the evening routine, otherwise last
  const anchor = items.find((it) => it.id === 'quran') ? { after: 'quran' } : items.find((it) => it.id === 'evening') ? { before: 'evening' } : { after: items.at(-1)?.id };
  let placed = false;
  for (const item of items) {
    if (review.total && anchor.before === item.id) { add(list, renderDailyReviewCard(review, ctx)); placed = true; }
    add(list, renderCard(item.id === 'reading' && book ? { ...item, subtitle: book.title, bookId: book.id, keepSub: true } : KEEP_SUB.has(item.id) ? { ...item, keepSub: true } : item, day, ctx));
    if (review.total && anchor.after === item.id) { add(list, renderDailyReviewCard(review, ctx)); placed = true; }
  }
  if (review.total && !placed) add(list, renderDailyReviewCard(review, ctx));
  add(main, list);

  if (allDone) {
    add(main, h('div', { class: 'day-done' },
      h('div', { class: 'trail on' }, footprintStamp(22), footprintStamp(22), footprintStamp(22)),
      h('div', { class: 'grow' }, h('div', { class: 't' }, 'Kamp ateşi yandı.'), h('div', { class: 's' }, 'Bugünün işi bitti. Yarın yeni bir keşif.'))));
  }

  // Weekend: let the child add homework if there is some.
  if (dayType(today, day) === 'weekend' && day.homework !== 'exists') {
    add(main, h('div', { class: 'row', style: { marginTop: '14px', justifyContent: 'center' } },
      h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => { ensureDay(s, today).homework = 'exists'; }) }, icon('plus', 18), 'Bugün ödevim var')));
  }
}

// ── cards ────────────────────────────────────────────────────────────
function renderCard(item, day, ctx) {
  const { today } = ctx;
  const status = getStatus(day, item.id);
  const done = isCompleted(status);
  const card = h('div', { class: `task tone-${ICON_TONE[item.id] || 'forest'} ${done ? 'done' : ''} ${justDone.has(item.id) ? 'just-done' : ''}`, id: 'task-' + item.id });
  if (justDone.has(item.id)) setTimeout(() => justDone.delete(item.id), 900);

  // One tap = done. Independence is never assumed; the chips below are optional.
  const complete = (val = DEFAULT_COMPLETION) => {
    justDone.add(item.id); howOpen.clear(); howOpen.add(item.id);
    ctx.update((s) => {
      const d = ensureDay(s, today); setStatus(d, item.id, val);
      if (item.kind === 'homework') d.homework = 'exists';
      if (item.bookId) d.bookId = item.bookId; // which book the family reading was about (structural room for pages later)
    });
    const ev = eventForItem(item.id);
    if (ev) ctx.celebrate(ev, { glyph: item.icon });
  };
  const undo = () => ctx.update((s) => { setStatus(ensureDay(s, today), item.id, null); });
  const pick = (val) => { if (val !== DEFAULT_COMPLETION) howOpen.delete(item.id); ctx.update((s) => { setStatus(ensureDay(s, today), item.id, val); }); };
  const how = () => howChips(status, pick, { open: howOpen.has(item.id), onToggle: () => { if (howOpen.has(item.id)) howOpen.delete(item.id); else howOpen.add(item.id); ctx.store.update(() => {}); } });

  switch (item.kind) {
    case 'routine': return renderRoutineCard(card, item, day, ctx, { status, done, complete, undo, pick, how });
    case 'physical': return renderPhysicalCard(card, item, day, ctx, { status, done, complete, undo, pick, how });
    case 'homework': return renderHomeworkCard(card, item, day, ctx, { status, done, complete, undo, pick, how });
    case 'skill': return renderSkillCard(card, item, day, ctx, { status, done, complete, undo, pick, how });
    case 'presentation': return renderPresentationCard(card, item, day, ctx);
    default: return renderSimpleCard(card, item, day, ctx, { status, done, complete, undo, pick, how });
  }
}

function mainRow(item, { title, sub, done, onTap, expandable = false, open = false, onCheck }) {
  return h('div', { class: 'task-main', role: 'button', tabindex: '0', onclick: onTap, onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } } },
    taskIcon(item.icon, ICON_TONE[item.id] || ''),
    h('div', { class: 'grow' }, h('div', { class: 'task-title' }, title), sub ? h('div', { class: 'task-sub' }, sub) : null),
    expandable ? h('span', { class: `task-chev ${open ? 'open' : ''}`, 'aria-hidden': 'true' }, icon('chevronDown', 22)) : null,
    checkCircle(done, onCheck));
}

function renderSimpleCard(card, item, day, ctx, a) {
  add(card, stamp(), mainRow(item, {
    title: item.title, sub: a.done && !item.keepSub ? null : item.subtitle, done: a.done,
    onTap: () => (a.done ? null : a.complete()),
    onCheck: () => (a.done ? a.undo() : a.complete()),
  }));
  if (a.done) add(card, a.how());
  return card;
}

function renderRoutineCard(card, item, day, ctx, a) {
  const routine = ctx.state.config.routines[item.id];
  const steps = visibleSteps(routine);
  if (!steps.length) { // MASTERED → one tap
    return renderSimpleCard(card, { ...item, title: a.done ? routine.doneTitle : routine.title, subtitle: 'Artık kendim yapabiliyorum' }, day, ctx, a);
  }
  const prog = stepsDone(routine, day);
  const open = isOpen(item.id);
  add(card, stamp(), mainRow(item, {
    title: a.done ? routine.doneTitle : routine.title,
    sub: a.done ? null : `${prog.done}/${prog.total} adım`,
    done: a.done, expandable: true, open,
    onTap: () => toggleOpen(ctx, item.id),
    onCheck: () => {
      if (a.done) { a.undo(); return; }
      ctx.update((s) => { const d = ensureDay(s, ctx.today); d.steps[item.id] = Object.fromEntries(steps.map((st) => [st.id, true])); });
      a.complete();
    },
  }));
  if (open) {
    add(card, h('div', { class: 'task-body' }, h('div', { class: 'steps' },
      steps.map((st) => {
        const on = !!day.steps?.[item.id]?.[st.id];
        return h('div', { class: `step ${on ? 'on' : ''}`, role: 'checkbox', 'aria-checked': on ? 'true' : 'false', tabindex: '0', onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }, onclick: () => {
          ctx.update((s) => {
            const d = ensureDay(s, ctx.today);
            const nowOn = toggleStep(d, item.id, st.id);
            const p = stepsDone(routine, d);
            if (p.all && !isCompleted(getStatus(d, item.id))) { setStatus(d, item.id, DEFAULT_COMPLETION); justDone.add(item.id); howOpen.clear(); howOpen.add(item.id); }
            if (!nowOn && isCompleted(getStatus(d, item.id))) setStatus(d, item.id, null);
          });
        } }, h('div', { class: 'step-check' }, icon('check', 20)), h('div', { class: 'step-txt' }, st.label));
      }))));
  }
  if (a.done) add(card, a.how());
  return card;
}

function renderPhysicalCard(card, item, day, ctx, a) {
  const physical = ctx.state.config.physical;
  const targets = targetsFor(physical, ctx.today);
  const prog = physicalProgress(physical, day);
  const open = isOpen(item.id);
  add(card, stamp(), mainRow(item, {
    title: item.title, sub: a.done ? null : (prog.done ? `${prog.done}/${prog.total} hareket` : `${prog.total} hareket`),
    done: a.done, expandable: true, open, onTap: () => toggleOpen(ctx, item.id),
    onCheck: () => {
      if (a.done) { a.undo(); return; }
      ctx.update((s) => { const d = ensureDay(s, ctx.today); d.physical = Object.fromEntries(physical.exercises.map((e) => [e.id, true])); });
      a.complete();
    },
  }));
  if (open) {
    add(card, h('div', { class: 'task-body challenge' },
      h('div', { class: 'challenge-hd' }, h('span', {}, 'Bugünün hedefi'), h('span', { class: 'muted' }, `${prog.done}/${prog.total}`)),
      h('div', { class: 'exercises' },
      targets.map((t) => {
        const on = !!day.physical?.[t.id];
        return h('div', { class: `exercise ${on ? 'on' : ''}`, role: 'checkbox', 'aria-checked': on ? 'true' : 'false', tabindex: '0', 'aria-label': `${t.name} ${t.target} ${t.unit}`, onclick: () => {
          let completedNow = false;
          ctx.update((s) => {
            const d = ensureDay(s, ctx.today);
            const nowOn = toggleExercise(d, t.id);
            const p = physicalProgress(physical, d);
            if (p.all && !isCompleted(getStatus(d, item.id))) { setStatus(d, item.id, DEFAULT_COMPLETION); justDone.add(item.id); howOpen.clear(); howOpen.add(item.id); completedNow = true; }
            if (!nowOn && isCompleted(getStatus(d, item.id))) setStatus(d, item.id, null);
          });
          if (completedNow) { const ev = eventForItem(item.id); if (ev) ctx.celebrate(ev, { glyph: item.icon }); }
        }, onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } } },
        h('div', { class: 'ex-pic' }, exerciseGlyph(t.id, 44)),
        h('div', { class: 'grow' }, h('div', { class: 'step-txt' }, t.name)),
        h('div', { class: 'ex-target' }, h('span', { class: 'n' }, t.target), h('span', { class: 'unit' }, t.unit === 'saniye' ? 'sn' : 'kez')),
        h('div', { class: 'step-check' }, icon('check', 20)));
      }))));
  }
  if (a.done) add(card, a.how());
  return card;
}

function renderHomeworkCard(card, item, day, ctx, a) {
  if (day.homework === 'none' && !a.done) {
    card.classList.add('neutral');
    add(card, mainRow(item, { title: 'Bugün ödev yok', sub: 'Okul ödevim', done: false, onTap: () => {}, onCheck: () => {} }),
      h('div', { class: 'task-actions' },
        h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => { ensureDay(s, ctx.today).homework = 'unknown'; }) }, 'Aslında ödev var')));
    return card;
  }
  if (day.homework === 'unknown' && !a.done) card.classList.add('pending-answer');
  add(card, stamp(), mainRow(item, {
    title: a.done ? 'Ödevimi yaptım' : item.title,
    sub: a.done ? null : (day.homework === 'unknown' ? 'Bugün ödev var mı?' : 'Ödevimi yaptım'),
    done: a.done,
    onTap: () => (a.done ? null : a.complete()),
    onCheck: () => (a.done ? a.undo() : a.complete()),
  }));
  if (!a.done && day.homework === 'unknown') {
    add(card, h('div', { class: 'task-actions' },
      h('button', { class: 'btn btn-soft btn-sm', onclick: () => a.complete() }, icon('check', 18), 'Ödevimi yaptım'),
      h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => { ensureDay(s, ctx.today).homework = 'none'; }) }, 'Bugün ödev yok')));
  }
  if (a.done) add(card, a.how());
  return card;
}

function renderSkillCard(card, item, day, ctx, a) {
  const skill = ctx.state.skills.pool.find((s) => s.id === day.skillId) || activeSkill(ctx.state);
  if (!skill) return card;
  add(card, stamp(), mainRow({ ...item }, {
    title: skill.title, sub: a.done ? null : ('Haftanın becerisi' + (skill.hint ? ' · ' + skill.hint : '')), done: a.done,
    onTap: () => (a.done ? null : a.complete()),
    onCheck: () => (a.done ? a.undo() : a.complete()),
  }));
  if (a.done) add(card, a.how());
  return card;
}

function renderPresentationCard(card, item, day, ctx) {
  const wk = weekKey(ctx.today);
  const pres = ctx.state.weeks?.[wk]?.presentation || {};
  const done = !!pres.presented;
  if (done) card.classList.add('done');
  const open = openCards.has(item.id) ? openCards.get(item.id) : false;
  const setPres = (patch) => {
    ctx.update((s) => { s.weeks[wk] ||= {}; s.weeks[wk].presentation = { ...(s.weeks[wk].presentation || {}), ...patch }; });
    if (patch.presented && !done) ctx.celebrate('presentation_done', { dinoKind: 'parasaurolophus', kicker: 'Haftanın sunumu', title: pres.topic || 'Haftanın sunumu' });
  };
  add(card, stamp(), mainRow(item, {
    title: item.title, sub: pres.topic ? `Konu: ${pres.topic}` : 'Bir konu seç', done, expandable: true, open, onTap: () => toggleOpen(ctx, item.id),
    onCheck: () => setPres(done ? { presented: false, presentedOn: null } : { presented: true, prepared: true, presentedOn: ctx.today }),
  }));
  if (open) {
    const topics = ctx.state.config.presentation.topics;
    add(card, h('div', { class: 'task-body' },
      !pres.topic ? h('div', { class: 'how' }, h('div', { class: 'lbl' }, 'Bu haftanın konusu'),
        topics.map((t) => h('button', { class: 'chip', onclick: () => setPres({ topic: t }) }, t))) : null,
      pres.topic ? h('div', { class: 'how' },
        h('button', { class: `chip ${pres.prepared ? 'on' : ''}`, onclick: () => setPres({ prepared: !pres.prepared }) }, pres.prepared ? icon('check', 16) : null, 'Hazırlandım'),
        h('button', { class: `chip ${pres.presented ? 'on' : ''}`, onclick: () => setPres(pres.presented ? { presented: false, presentedOn: null } : { presented: true, prepared: true, presentedOn: ctx.today }) }, pres.presented ? icon('check', 16) : null, 'Sundum'),
        h('button', { class: 'chip muted', onclick: () => setPres({ topic: null }) }, 'Konuyu değiştir')) : null));
  }
  return card;
}

// ── Bugünkü Ezber Tekrarım ──────────────────────────────────────────
// One card, never one card per sura. Closed: the list with ✓/○ and a count.
// Open ("Tekrarlara Başla"): each unfinished item shows the three review
// outcomes — the same three as Ezberlerim, recorded through the same engine.
// Those outcomes never touch the daily-task independence statuses.
function renderDailyReviewCard(set, ctx) {
  const { today } = ctx;
  const open = openCards.get(REVIEW_CARD) ?? false;
  const card = h('div', { class: `task tone-forest memo-daily ${set.complete ? 'done' : ''} ${open ? 'open' : ''}`, id: 'task-memory-review' });
  const sub = set.complete
    ? 'Bugünkü tekrarların tamamlandı.'
    : set.done ? `${set.done} / ${set.total} tamamlandı` : `${set.total} tekrar bugün`;
  add(card, h('div', { class: 'task-main', role: 'button', tabindex: '0', onclick: () => toggleOpen(ctx, REVIEW_CARD),
    onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOpen(ctx, REVIEW_CARD); } } },
    taskIcon('scroll', 'forest'),
    h('div', { class: 'grow' }, h('div', { class: 'task-title' }, 'Bugünkü Ezber Tekrarım'), h('div', { class: 'task-sub' }, sub)),
    h('span', { class: `task-chev ${open ? 'open' : ''}`, 'aria-hidden': 'true' }, icon('chevronDown', 22)),
    h('span', { class: `memo-count ${set.complete ? 'on' : ''}`, 'aria-label': `${set.done} / ${set.total} tamamlandı` }, set.complete ? icon('check', 22) : `${set.done}/${set.total}`)));

  const pick = (it, result) => {
    ctx.update((s) => recordDailyReview(s, it.id, result, today));
    const after = dailyReviewSet(ctx.state, today);
    if (after.complete) { openCards.set(REVIEW_CARD, false); ctx.celebrate('reviews_done', { glyph: 'scroll' }); }
    else ctx.toast(result === REVIEW_RESULT.SELF ? 'Harika, kaydettim.' : result === REVIEW_RESULT.ASSISTED ? 'Kaydettim. Yakında bir daha bakarız.' : 'Kaydettim. Birlikte biraz daha çalışırız.');
  };

  add(card, h('div', { class: 'memo-list' }, set.items.map((it) => h('div', { class: `memo-row ${it.done ? 'on' : ''}` },
    h('div', { class: 'memo-row-hd' },
      h('span', { class: 'memo-tick', 'aria-hidden': 'true' }, it.done ? icon('check', 16) : null),
      h('span', { class: 'memo-title' }, it.title),
      it.done
        ? h('span', { class: 'memo-res' }, REVIEW_RESULT_LABEL[it.review.result])
        : it.health && it.health !== 'strong' ? h('span', { class: `memo-health h-${it.health}` }, HEALTH_LABEL[it.health]) : null),
    open && !it.done ? h('div', { class: 'how memo-how' },
      h('button', { class: 'chip', onclick: () => pick(it, REVIEW_RESULT.SELF) }, REVIEW_RESULT_LABEL.self),
      h('button', { class: 'chip warm', onclick: () => pick(it, REVIEW_RESULT.ASSISTED) }, REVIEW_RESULT_LABEL.assisted),
      h('button', { class: 'chip sky', onclick: () => pick(it, REVIEW_RESULT.NEEDS_WORK) }, REVIEW_RESULT_LABEL.needs_work)) : null))));

  const canExpand = !set.all && set.poolSize > set.total;
  if (!set.complete || canExpand) {
    add(card, h('div', { class: 'task-actions memo-actions' },
      !set.complete && !open ? h('button', { class: 'btn btn-primary btn-sm', onclick: () => { openCards.set(REVIEW_CARD, true); ctx.store.update(() => {}); } }, icon('check', 18), 'Tekrarlara Başla') : null,
      canExpand ? h('button', { class: 'memo-all', onclick: () => { openCards.set(REVIEW_CARD, true); ctx.update((s) => expandDailySet(s, today)); } }, `Tümünü Tekrar Et (${set.poolSize})`) : null));
  }
  return card;
}

export { dayNameLong };
