import { BOOK_STATUS } from '../content/defaults.js';
import { isItemDone } from './completion.js';

/** Short unique id for learning-layer records (never reused, never reordered). */
export function newId(prefix = 'x') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Book cover tone is derived from the title, so the same book always looks the same. */
export const COVER_TONES = ['forest', 'gold', 'sky', 'clay', 'night', 'fossil'];
export function coverTone(title = '') {
  let hsh = 0;
  for (const ch of String(title)) hsh = (hsh * 31 + ch.codePointAt(0)) >>> 0;
  return COVER_TONES[hsh % COVER_TONES.length];
}

export function getBook(state, id) {
  return (id && state.books?.[id]) || null;
}

export function bookList(state) {
  return Object.values(state.books || {});
}

export function addBook(state, { title, totalPages = 0, startedAt, note = '', cover = null }, today) {
  const t = String(title || '').trim();
  if (!t) return null;
  const id = newId('b');
  state.books ||= {};
  state.books[id] = {
    id, title: t, totalPages: Math.max(0, Number(totalPages) || 0),
    startedAt: startedAt || today, finishedAt: null, status: BOOK_STATUS.READING,
    note: note || '', cover: cover || { tone: coverTone(t) }, createdAt: today,
  };
  // Becomes the daily reading task's book unless another one was explicitly chosen.
  const chosen = getBook(state, state.reading.activeBookId);
  if (!chosen || chosen.status !== BOOK_STATUS.READING) state.reading.activeBookId = id;
  return state.books[id];
}

export function updateBook(state, id, patch) {
  const b = getBook(state, id);
  if (!b) return null;
  Object.assign(b, patch);
  if (patch.title !== undefined) { b.title = String(patch.title).trim() || b.title; b.cover ||= {}; if (!b.cover.custom) b.cover.tone = coverTone(b.title); }
  if (patch.totalPages !== undefined) b.totalPages = Math.max(0, Number(patch.totalPages) || 0);
  // A completed book keeps its dates consistent; a reopened one has no finish date.
  if (b.status === BOOK_STATUS.COMPLETED && !b.finishedAt) b.finishedAt = b.startedAt;
  if (b.status === BOOK_STATUS.READING) b.finishedAt = null;
  return b;
}

export function completeBook(state, id, finishedAt) {
  const b = getBook(state, id);
  if (!b) return null;
  b.status = BOOK_STATUS.COMPLETED;
  b.finishedAt = finishedAt || b.finishedAt;
  if (b.finishedAt && b.startedAt && b.finishedAt < b.startedAt) b.finishedAt = b.startedAt;
  if (state.reading.activeBookId === id) state.reading.activeBookId = null;
  return b;
}

export function reopenBook(state, id) {
  const b = getBook(state, id);
  if (!b) return null;
  b.status = BOOK_STATUS.READING;
  b.finishedAt = null;
  return b;
}

export function removeBook(state, id) {
  if (!state.books?.[id]) return false;
  delete state.books[id];
  if (state.reading.activeBookId === id) state.reading.activeBookId = null;
  return true;
}

export function setActiveBook(state, id) {
  state.reading.activeBookId = id && getBook(state, id)?.status === BOOK_STATUS.READING ? id : null;
}

/**
 * The book the daily "20 sayfa aile okuması" task is about: the explicitly
 * chosen one, else the most recently started book still being read.
 */
export function activeBook(state) {
  const chosen = getBook(state, state.reading?.activeBookId);
  if (chosen && chosen.status === BOOK_STATUS.READING) return chosen;
  return bookList(state).filter((b) => b.status === BOOK_STATUS.READING)
    .sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''))[0] || null;
}

export function booksReading(state) {
  return bookList(state).filter((b) => b.status === BOOK_STATUS.READING).sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
}

export function booksCompleted(state) {
  return bookList(state).filter((b) => b.status === BOOK_STATUS.COMPLETED).sort((a, b) => (b.finishedAt || '').localeCompare(a.finishedAt || ''));
}

/** Lifetime record — a history, not a target. */
export function bookStats(state) {
  const done = booksCompleted(state);
  return {
    completedBooks: done.length,
    completedPages: done.reduce((n, b) => n + (Number(b.totalPages) || 0), 0),
    reading: booksReading(state).length,
  };
}

/** Days on which the family reading task was completed while this book was active. */
export function readingDaysForBook(state, bookId) {
  return Object.keys(state.days || {}).filter((k) => state.days[k]?.bookId === bookId && isItemDone(state.days[k], 'reading')).sort();
}
