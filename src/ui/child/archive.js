import { h, add } from '../dom.js';
import { icon } from '../icons.js';
import { glyph } from '../art.js';
import { formatShort, formatLong, weekLabel, monthName } from '../../core/dates.js';
import { booksReading, booksCompleted, bookStats, activeBook, readingDaysForBook } from '../../core/library.js';
import { memoByStatus, dueItems } from '../../core/memorization.js';
import { recordDailyReview, memoryHealth, inPool, dailyReviewSet } from '../../core/dailyReview.js';
import { activeProject, projectHistory } from '../../core/projects.js';
import { pageHero, sectionHead, taskIcon, packArt } from './components.js';
import { MEMO_TYPE, MEMO_TYPE_LABEL, REVIEW_RESULT, REVIEW_RESULT_LABEL, PROJECT_STATUS, PROJECT_TYPE_LABEL, HEALTH_LABEL } from '../../content/defaults.js';

// ARŞİVİM — "my growing collection of things I have learned and completed".
// Dates, status and a durable-collection feel; no stars, scores or bars.

const SUB = {
  books: renderBooks,
  memory: renderMemory,
  presentations: renderPresentations,
};

export function renderArchive(main, ctx, parts = []) {
  const page = SUB[parts[0]];
  if (page) return page(main, ctx);
  return renderLanding(main, ctx);
}

// Compact editorial header on the archive hero (visual pack): the library
// scene — shelves, books and the reading companion — so the archive reads
// as a collection, not a map.
function head(kicker, title, sub, back = null) {
  return pageHero({
    variant: 'compact', hero: 'archive', cls: 'hero-archive', label: title, kicker, title, sub,
    extra: back ? [h('a', { class: 'arch-back', href: back.href }, icon('back', 18), back.label)] : [],
  });
}

const plural = (n, one, many = one) => `${n} ${n === 1 ? one : many}`;

// ── Landing ───────────────────────────────────────────────────────────
function renderLanding(main, ctx) {
  const { state, today } = ctx;
  const name = state.config.settings.childName || 'Emir';
  const bs = bookStats(state);
  const memo = memoByStatus(state);
  const suras = memo.mastered.filter((it) => it.type === MEMO_TYPE.SURA).length;
  const others = memo.mastered.length - suras;
  const pres = presentationHistory(state).filter((p) => p.presented).length;
  const due = dueItems(state, today);

  add(main, head('Büyüyen koleksiyonum', 'Arşivim', `${name}'in okudukları, ezberledikleri ve anlattıkları burada birikir.`));

  if (due.length) {
    add(main, h('a', { class: 'arch-due', href: '#/archive/memory' },
      glyph('scroll', 26), h('div', { class: 'grow' }, h('div', { class: 't' }, 'Bugün tekrar zamanı'), h('div', { class: 's' }, due.map((d) => d.title).join(' · '))), icon('chevron', 20)));
  }

  add(main, sectionHead('Koleksiyonlarım', 'Burada birikenler', { tight: true }));
  add(main, h('div', { class: 'arch-grid' },
    collection('#/archive/books', 'library', 'fossil', 'Kitaplığım', 'reading',
      bs.completedBooks || bs.reading
        ? [bs.completedBooks ? plural(bs.completedBooks, 'kitap tamamladım') : null, bs.reading ? plural(bs.reading, 'kitap okuyorum') : null].filter(Boolean).join(' · ')
        : 'İlk kitabın için yer hazır.'),
    collection('#/archive/memory', 'scroll', 'forest', 'Ezberlerim', null,
      memo.mastered.length || memo.learning.length
        ? [suras ? plural(suras, 'sure ezberledim') : null, others ? plural(others, 'ezber daha') : null, memo.learning.length ? plural(memo.learning.length, 'ezber öğreniyorum') : null].filter(Boolean).join(' · ')
        : 'Ezberlediklerin burada saklanır.'),
    collection('#/archive/presentations', 'mic', 'sky', 'Sunumlarım', 'presentation',
      pres ? plural(pres, 'sunum yaptım') : 'Anlattığın her konu burada kalır.')));

  add(main, h('div', { class: 'arch-foot' }, glyph('footprint', 18), 'Burası senin hikâyen. Buradaki hiçbir şey silinmez.'));
}

/** Collection row: the visual-pack icon for the slot (`key`) or the toned glyph tile. */
function collection(href, g, tone, title, key, line) {
  const art = key ? packArt(key, 52) : null;
  return h('a', { class: `arch-card tone-${tone}`, href },
    h('div', { class: `arch-ic ${art ? 'art' : ''}` }, art || glyph(g, 34)),
    h('div', { class: 'grow' }, h('div', { class: 't' }, title), h('div', { class: 's' }, line)),
    h('span', { class: 'arch-chev' }, icon('chevron', 22)));
}

// ── Kitaplığım ────────────────────────────────────────────────────────
/** Generated cover: a small "book" built from the design tokens. Title is the artwork. */
export function bookCover(book, { size = 'md' } = {}) {
  const tone = book.cover?.tone || 'forest';
  const words = String(book.title || '').trim().split(/\s+/);
  return h('div', { class: `book-cover tone-${tone} size-${size}`, 'aria-hidden': 'true' },
    h('div', { class: 'bc-spine' }),
    h('div', { class: 'bc-face' },
      h('div', { class: 'bc-mark' }, glyph('leaf', 16)),
      h('div', { class: 'bc-title' }, words.slice(0, 6).join(' ')),
      h('div', { class: 'bc-rule' })));
}

function renderBooks(main, ctx) {
  const { state } = ctx;
  const reading = booksReading(state);
  const done = booksCompleted(state);
  const active = activeBook(state);

  add(main, head('Kitaplığım', 'Kitaplığım', 'Okuduğum her kitap rafta kalır.', { href: '#/archive', label: 'Arşivim' }));

  add(main, sectionHead('Kitaplığım', 'Şu an okuyorum', { tight: true }));
  if (!reading.length) add(main, h('div', { class: 'card empty' }, 'Şu an okunan bir kitap yok. Anne ya da baba yeni bir kitap ekleyebilir.'));
  else add(main, h('div', { class: 'stack' }, reading.map((b) => {
    const days = readingDaysForBook(state, b.id).length;
    return h('div', { class: 'card book-row' }, bookCover(b),
      h('div', { class: 'grow' },
        h('div', { class: 't' }, b.title),
        h('div', { class: 's' }, b.totalPages ? `${b.totalPages} sayfa` : null, b.totalPages ? ' · ' : null, `Başladım: ${formatShort(b.startedAt)}`),
        days ? h('div', { class: 's muted' }, `${plural(days, 'gün')} birlikte okuduk`) : null,
        active?.id === b.id ? h('span', { class: 'pill pill-amber', style: { marginTop: '6px' } }, icon('book', 14), 'Aile okuması') : null));
  })));

  add(main, sectionHead('Raf', 'Tamamladığım kitaplar', { count: done.length ? h('span', { class: 'count-pill' }, plural(done.length, 'kitap')) : null }));
  if (!done.length) add(main, h('div', { class: 'card empty' }, 'İlk tamamlanan kitap burada yerini alacak.'));
  else add(main, h('div', { class: 'shelf' }, done.map((b) => h('div', { class: 'shelf-item' },
    bookCover(b, { size: 'lg' }),
    h('div', { class: 'shelf-t' }, b.title),
    h('div', { class: 'shelf-s' }, b.totalPages ? `${b.totalPages} sayfa` : ''),
    h('div', { class: 'shelf-d' }, `${formatShort(b.startedAt)} → ${formatShort(b.finishedAt || b.startedAt)}`)))));
}

// ── Ezberlerim ────────────────────────────────────────────────────────
const openReview = new Set(); // session-only: mastered cards whose result buttons are open

function renderMemory(main, ctx) {
  const { state, today } = ctx;
  const memo = memoByStatus(state);
  const due = dueItems(state, today);
  const dueIds = new Set(due.map((d) => d.id));
  const projects = projectHistory(state);
  const active = activeProject(state);

  add(main, head('Ezberlerim', 'Ezberlerim', 'Ezberlediklerim ve tekrar ettiklerim.', { href: '#/archive', label: 'Arşivim' }));

  // Today's pool set lives on Bugün; here it is only a one-line pointer.
  const set = dailyReviewSet(state, today);
  if (set.total) {
    add(main, h('a', { class: 'quiet-link', href: '#/today' },
      glyph('scroll', 20), h('span', { class: 'grow' }, set.complete ? 'Bugünkü tekrarların tamamlandı: ' : `Bugünkü tekrarım ${set.done}/${set.total}: `, h('b', {}, set.items.map((it) => (it.done ? '✓ ' : '○ ') + it.title).join('  '))), icon('chevron', 18)));
  }

  if (due.length) {
    add(main, h('div', { class: 'card memo-due' },
      h('div', { class: 'hd' }, glyph('scroll', 26), h('div', { class: 'grow' }, h('h3', {}, 'Tekrar zamanı'), h('div', { class: 'small muted' }, 'Sakin bir tekrar. Nasıl geçtiğini söylemen yeter.'))),
      due.map((it) => reviewBlock(ctx, it))));
  }

  const group = (title, g, tone, items, opts = {}) => {
    if (!items.length && !opts.always) return;
    add(main, sectionHead(opts.kicker || 'Ezber', title, { count: items.length ? h('span', { class: 'count-pill' }, plural(items.length, 'ezber')) : null, tight: !!opts.always }));
    if (!items.length) { add(main, h('div', { class: 'card empty' }, opts.empty || 'Şimdilik boş.')); return; }
    add(main, h('div', { class: 'stack' }, items.map((it) => memoCard(ctx, it, dueIds.has(it.id)))));
  };

  const suras = [...memo.mastered.filter((i) => i.type === MEMO_TYPE.SURA), ...memo.learning.filter((i) => i.type === MEMO_TYPE.SURA)];
  const rest = [...memo.mastered.filter((i) => i.type !== MEMO_TYPE.SURA), ...memo.learning.filter((i) => i.type !== MEMO_TYPE.SURA)];
  group('Sürelerim', 'quran', 'forest', suras, { always: true, empty: 'İlk sure burada yerini alacak.', kicker: 'Kur\'an' });
  group('Diğer Ezberlerim', 'scroll', 'practice', rest, { kicker: 'Şiir · Şarkı · Diğer' });

  if (projects.length) {
    add(main, sectionHead('Aylık', 'Hafıza projelerim'));
    add(main, h('div', { class: 'stack' }, projects.map((p) => h('div', { class: `card memo-card ${p.status === PROJECT_STATUS.ACTIVE ? 'active' : ''}` },
      h('div', { class: 'task-icon gold' }, glyph('leaf', 26)),
      h('div', { class: 'grow' },
        h('div', { class: 't' }, p.title),
        h('div', { class: 's' }, PROJECT_TYPE_LABEL[p.type] || '', ' · ', monthName(p.targetMonth + '-01'), ' ', p.targetMonth.slice(0, 4)),
        h('div', { class: 's muted' }, p.status === PROJECT_STATUS.COMPLETED ? `Tamamladım: ${formatShort(p.completedAt)}` : p.status === PROJECT_STATUS.ACTIVE ? 'Bu ayın projesi' : 'Başka bir projeye geçtim')),
      p.status === PROJECT_STATUS.COMPLETED ? h('span', { class: 'mastered-mark', 'aria-label': 'Tamamlandı' }, icon('check', 22)) : active?.id === p.id ? h('span', { class: 'pill pill-gold' }, 'Bu ay') : null))));
  }
}

function memoCard(ctx, it, isDue) {
  const mastered = it.status === 'MASTERED';
  const last = it.lastReviewedAt ? `Son tekrar: ${formatShort(it.lastReviewedAt)}${it.lastResult ? ' · ' + REVIEW_RESULT_LABEL[it.lastResult] : ''}` : null;
  const health = memoryHealth(it, ctx.today);
  const open = openReview.has(it.id) && !isDue;
  const card = h('div', { class: `card memo-card ${mastered ? 'mastered' : 'learning'}` },
    h('div', { class: 'memo-main', role: mastered ? 'button' : null, tabindex: mastered ? '0' : null,
      onclick: () => { if (!mastered) return; if (openReview.has(it.id)) openReview.delete(it.id); else openReview.add(it.id); ctx.store.update(() => {}); },
      onkeydown: (e) => { if (mastered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.currentTarget.click(); } } },
      h('div', { class: `task-icon ${mastered ? 'forest' : 'gold'}` }, glyph(it.type === MEMO_TYPE.SURA ? 'quran' : 'scroll', 26)),
      h('div', { class: 'grow' },
        h('div', { class: 't' }, it.title),
        h('div', { class: 's' }, mastered ? `Ezberledim: ${formatShort(it.masteredAt)}` : `Öğreniyorum · Başladım: ${formatShort(it.startedAt)}`, it.type !== MEMO_TYPE.SURA ? ` · ${MEMO_TYPE_LABEL[it.type]}` : ''),
        last ? h('div', { class: 's muted' }, last) : null,
        mastered ? h('div', { class: 'row wrap', style: { marginTop: '6px', gap: '6px' } },
          isDue ? h('span', { class: 'pill pill-amber' }, 'Tekrar zamanı') : it.nextReviewAt ? h('span', { class: 's muted' }, `Sonraki tekrar: ${formatShort(it.nextReviewAt)}`) : null,
          health ? h('span', { class: `memo-health h-${health}` }, HEALTH_LABEL[health]) : null,
          inPool(it) ? h('span', { class: 'pill pill-green' }, 'Günlük tekrar') : null) : null),
      mastered ? h('span', { class: 'mastered-mark', 'aria-label': 'Ezberlendi' }, icon('check', 22)) : null));
  if (open) add(card, reviewButtons(ctx, it, 'Bugün tekrar ettim:'));
  return card;
}

function reviewBlock(ctx, it) {
  return h('div', { class: 'memo-review' },
    h('div', { class: 'memo-review-t' }, it.title, h('span', { class: 'small muted' }, ` · ${it.type === MEMO_TYPE.SURA ? 'sure' : MEMO_TYPE_LABEL[it.type].toLowerCase()}`)),
    reviewButtons(ctx, it, 'Nasıl geçti?'));
}

function reviewButtons(ctx, it, label) {
  const pick = (result) => {
    openReview.delete(it.id);
    ctx.update((s) => recordDailyReview(s, it.id, result, ctx.today));
    ctx.toast(result === REVIEW_RESULT.SELF ? 'Harika, kaydettim.' : result === REVIEW_RESULT.ASSISTED ? 'Kaydettim. Yakında bir daha bakarız.' : 'Kaydettim. Birlikte biraz daha çalışırız.');
  };
  return h('div', { class: 'how memo-how' },
    h('div', { class: 'lbl' }, label),
    h('button', { class: 'chip', onclick: () => pick(REVIEW_RESULT.SELF) }, REVIEW_RESULT_LABEL.self),
    h('button', { class: 'chip warm', onclick: () => pick(REVIEW_RESULT.ASSISTED) }, REVIEW_RESULT_LABEL.assisted),
    h('button', { class: 'chip sky', onclick: () => pick(REVIEW_RESULT.NEEDS_WORK) }, REVIEW_RESULT_LABEL.needs_work));
}

// ── Sunumlarım ────────────────────────────────────────────────────────
export function presentationHistory(state) {
  return Object.entries(state.weeks || {})
    .filter(([, w]) => w?.presentation && (w.presentation.topic || w.presentation.presented || w.presentation.prepared))
    .map(([wk, w]) => ({ wk, ...w.presentation }))
    .sort((a, b) => (b.presentedOn || b.wk).localeCompare(a.presentedOn || a.wk));
}

function renderPresentations(main, ctx) {
  const list = presentationHistory(ctx.state);
  add(main, head('Sunumlarım', 'Sunumlarım', 'Anlattığım konular, haftalar boyunca.', { href: '#/archive', label: 'Arşivim' }));
  if (!list.length) { add(main, h('div', { class: 'card empty' }, 'İlk sunumun burada yerini alacak.')); return; }
  add(main, h('div', { class: 'stack' }, list.map((p) => h('div', { class: `card pres-row ${p.presented ? 'done' : ''}` },
    taskIcon('mic', 'sky', '', 'presentation'),
    h('div', { class: 'grow' },
      h('div', { class: 'pres-date' }, p.presented && p.presentedOn ? formatLong(p.presentedOn) : weekLabel(p.wk)),
      h('div', { class: 't' }, p.topic || 'Konu seçilmemiş'),
      h('div', { class: 'row wrap', style: { marginTop: '6px' } },
        h('span', { class: `pill ${p.prepared ? 'pill-green' : 'pill-sand'}` }, p.prepared ? icon('check', 12) : null, 'Hazırlandım'),
        h('span', { class: `pill ${p.presented ? 'pill-green' : 'pill-sand'}` }, p.presented ? icon('check', 12) : null, 'Sundum'),
        p.legacy ? h('span', { class: 'pill pill-sand' }, 'eski kayıt') : null),
      p.reflection ? h('div', { class: 'pres-note' }, '“', p.reflection, '”') : null,
      p.note ? h('div', { class: 's muted' }, p.note) : null)))));
}
