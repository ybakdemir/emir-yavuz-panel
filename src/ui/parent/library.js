import { h, add, confirmSheet } from '../dom.js';
import { icon } from '../icons.js';
import { formatShort } from '../../core/dates.js';
import { addBook, updateBook, completeBook, reopenBook, removeBook, setActiveBook, activeBook, booksReading, booksCompleted, bookStats, readingDaysForBook } from '../../core/library.js';
import { bookCover } from '../child/archive.js';
import { pcard, field, textInput, numberInput, dateInput, kv } from './common.js';

// Kitaplık — add/edit/complete books, correct dates, choose the family-reading book.
// Totals here are a lifetime record, not a target.

export function renderLibrary(body, ctx) {
  const { state, today } = ctx;
  const stats = bookStats(state);
  const active = activeBook(state);
  const grid = h('div', { class: 'grid grid-2' });

  // ── add
  const f = { title: '', totalPages: 0, startedAt: today, note: '' };
  const titleIn = textInput('', (v) => { f.title = v; }, { placeholder: 'Kitap adı', 'aria-label': 'Kitap adı' });
  const submit = () => {
    f.title = titleIn.value;
    if (!f.title.trim()) { ctx.toast('Önce kitabın adını yazın.'); return; }
    ctx.update((s) => addBook(s, f, today));
    ctx.toast('Kitap eklendi.');
  };
  titleIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  add(grid, pcard('Yeni kitap', 'plus',
    field('Ad', titleIn),
    h('div', { class: 'row wrap', style: { marginTop: '8px', alignItems: 'flex-end' } },
      field('Sayfa', numberInput(0, (v) => { f.totalPages = v; }, { min: 0 })),
      field('Başlangıç', dateInput(today, (v) => { f.startedAt = v || today; }))),
    h('div', { style: { height: '8px' } }),
    field('Not (isteğe bağlı)', textInput('', (v) => { f.note = v; }, { placeholder: 'Kimle, nerede, neden…' })),
    h('button', { class: 'btn btn-primary btn-sm', style: { marginTop: '12px' }, onclick: submit }, icon('plus', 16), 'Ekle')));

  // ── lifetime record
  add(grid, pcard('Kitaplık kaydı', 'library',
    h('div', { class: 'row', style: { alignItems: 'flex-end', gap: '22px' } },
      h('div', {}, h('div', { class: 'big' }, String(stats.completedBooks)), h('div', { class: 'small muted' }, 'tamamlanan kitap')),
      h('div', {}, h('div', { class: 'big', style: { fontSize: '28px', color: 'var(--ink-2)' } }, String(stats.completedPages)), h('div', { class: 'small muted' }, 'tamamlanan sayfa'))),
    kv('Şu an okunan', stats.reading ? `${stats.reading} kitap` : '—'),
    kv('Aile okuması kitabı', active ? active.title : '—'),
    h('div', { class: 'small muted', style: { marginTop: '8px' } }, 'Bu sayılar tarihsel bir kayıttır; ödül eşiği ya da hedef değildir. Günlük "20 sayfa aile okuması" görevi aktif kitabın adıyla gösterilir; her gün sayfa girmek gerekmez.')));
  add(body, grid);

  // ── reading
  add(body, h('div', { class: 'section-title' }, 'Şu an okunuyor'));
  const reading = booksReading(state);
  if (!reading.length) add(body, h('div', { class: 'pcard muted small' }, 'Okunan kitap yok.'));
  else add(body, h('div', { class: 'grid grid-2' }, reading.map((b) => bookEditor(ctx, b, active?.id === b.id))));

  // ── completed
  add(body, h('div', { class: 'section-title' }, 'Tamamlananlar'));
  const done = booksCompleted(state);
  if (!done.length) add(body, h('div', { class: 'pcard muted small' }, 'Henüz tamamlanan kitap yok.'));
  else add(body, h('div', { class: 'grid grid-2' }, done.map((b) => bookEditor(ctx, b, false))));
}

function bookEditor(ctx, b, isActive) {
  const set = (patch) => ctx.update((s) => updateBook(s, b.id, patch));
  const days = readingDaysForBook(ctx.state, b.id).length;
  const completed = b.status === 'COMPLETED';
  return h('div', { class: 'pcard book-edit' },
    h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '14px' } },
      bookCover(b),
      h('div', { class: 'grow' },
        field('Ad', textInput(b.title, (v) => set({ title: v }))),
        h('div', { class: 'row wrap', style: { marginTop: '8px', alignItems: 'flex-end' } },
          field('Sayfa', numberInput(b.totalPages, (v) => set({ totalPages: v }), { min: 0 })),
          field('Başlangıç', dateInput(b.startedAt, (v) => set({ startedAt: v || b.startedAt }))),
          completed ? field('Bitiş', dateInput(b.finishedAt, (v) => ctx.update((s) => completeBook(s, b.id, v || b.finishedAt)))) : null))),
    h('div', { style: { height: '8px' } }),
    field('Not', textInput(b.note || '', (v) => set({ note: v }))),
    h('div', { class: 'small muted', style: { marginTop: '8px' } },
      completed ? `Tamamlandı: ${formatShort(b.finishedAt)}` : `Okunuyor · başlangıç ${formatShort(b.startedAt)}`,
      days ? ` · ${days} gün aile okuması` : ''),
    h('div', { class: 'row wrap', style: { marginTop: '10px' } },
      completed
        ? h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => reopenBook(s, b.id)) }, 'Yeniden okunuyor')
        : h('button', { class: 'btn btn-primary btn-sm', onclick: () => ctx.update((s) => completeBook(s, b.id, ctx.today)) }, icon('check', 16), 'Tamamlandı'),
      !completed ? h('button', { class: `btn btn-sm ${isActive ? 'btn-soft' : 'btn-ghost'}`, onclick: () => ctx.update((s) => setActiveBook(s, isActive ? null : b.id)) }, isActive ? 'Aile okuması kitabı ✓' : 'Aile okuması kitabı yap') : null,
      h('button', { class: 'icon-btn', 'aria-label': 'Sil', style: { marginLeft: 'auto' }, onclick: async () => {
        const ok = await confirmSheet({ title: 'Kitabı sil', body: `"${b.title}" kitaplıktan kaldırılacak. Bu işlem yalnızca yanlış girişler için düşünülmüştür.`, ok: 'Sil', danger: true });
        if (ok) ctx.update((s) => removeBook(s, b.id));
      } }, icon('trash', 18))));
}
