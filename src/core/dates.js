// Local-time date helpers. v1 used toISOString() (UTC) which mis-files
// anything done 00:00–03:00 Turkey time under the previous day. Everything
// in v2 goes through these helpers instead.

const DAY_NAMES_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const DAY_NAMES_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const pad = (n) => String(n).padStart(2, '0');

/** Date → 'YYYY-MM-DD' in local time. */
export function toKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' → Date at local midnight. */
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(now = new Date()) {
  return toKey(now);
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** Days from a to b (b - a), integer. */
export function diffDays(a, b) {
  const ms = fromKey(b).getTime() - fromKey(a).getTime();
  return Math.round(ms / 86400000);
}

/** ISO weekday index: Monday = 0 … Sunday = 6. */
export function isoWeekday(key) {
  const dow = fromKey(key).getDay();
  return dow === 0 ? 6 : dow - 1;
}

export function isWeekend(key) {
  return isoWeekday(key) >= 5;
}

/** Monday of the week containing `key`. Used as the week key. */
export function weekKey(key) {
  return addDays(key, -isoWeekday(key));
}

export function monthKey(key) {
  return key.slice(0, 7);
}

/** ['YYYY-MM-DD' ×7] Monday → Sunday. */
export function weekDays(wk) {
  return Array.from({ length: 7 }, (_, i) => addDays(wk, i));
}

/** Inclusive list of day keys from `from` to `to`. */
export function range(from, to) {
  const out = [];
  let k = from;
  while (k <= to) { out.push(k); k = addDays(k, 1); }
  return out;
}

export function formatLong(key) {
  const d = fromKey(key);
  return `${DAY_NAMES_LONG[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export function formatShort(key) {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

export function dayNameShort(key) {
  return DAY_NAMES_SHORT[fromKey(key).getDay()];
}

export function dayNameLong(key) {
  return DAY_NAMES_LONG[fromKey(key).getDay()];
}

export function monthName(key) {
  return MONTH_NAMES[Number(key.slice(5, 7)) - 1];
}

export function weekLabel(wk) {
  const a = fromKey(wk), b = fromKey(addDays(wk, 6));
  const sameMonth = a.getMonth() === b.getMonth();
  return sameMonth
    ? `${a.getDate()}–${b.getDate()} ${MONTH_NAMES[a.getMonth()]}`
    : `${a.getDate()} ${MONTH_NAMES[a.getMonth()].slice(0, 3)} – ${b.getDate()} ${MONTH_NAMES[b.getMonth()].slice(0, 3)}`;
}

export { DAY_NAMES_LONG, DAY_NAMES_SHORT, MONTH_NAMES };
