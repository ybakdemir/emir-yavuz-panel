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
import { ring, trail, howChips, taskIcon, checkCircle, stamp, ICON_TONE } from './components.js';
import { heroScene, exerciseGlyph } from '../art.js';

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
    add(main, h('a', { class: 'discovery-banner', href: '#/expedition', onclick: () => ctx.takeDiscoveries() },
      icon('map', 28), h('div', { class: 'grow' }, h('div', { class: 't' }, 'Yeni keşif!'), h('div', { class: 's' }, 'Keşif haritasında yeni bir şey buldun.')), icon('chevron', 22)));
  }

  // ── task cards
  const expandable = items.filter((it) => ['routine', 'physical'].includes(it.kind) && !isCompleted(getStatus(day, it.id)));
  autoOpenId = expandable.find((it) => it.kind !== 'routine' || visibleSteps(state.config.routines[it.id]).length)?.id || null;
  const list = h('div', { class: 'tasks' });
  for (const item of items) add(list, renderCard(item, day, ctx));
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
    ctx.update((s) => { const d = ensureDay(s, today); setStatus(d, item.id, val); if (item.kind === 'homework') d.homework = 'exists'; });
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
    title: item.title, sub: a.done ? null : item.subtitle, done: a.done,
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
          ctx.update((s) => {
            const d = ensureDay(s, ctx.today);
            const nowOn = toggleExercise(d, t.id);
            const p = physicalProgress(physical, d);
            if (p.all && !isCompleted(getStatus(d, item.id))) { setStatus(d, item.id, DEFAULT_COMPLETION); justDone.add(item.id); howOpen.clear(); howOpen.add(item.id); }
            if (!nowOn && isCompleted(getStatus(d, item.id))) setStatus(d, item.id, null);
          });
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
  const setPres = (patch) => ctx.update((s) => { s.weeks[wk] ||= {}; s.weeks[wk].presentation = { ...(s.weeks[wk].presentation || {}), ...patch }; });
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

export { dayNameLong };
