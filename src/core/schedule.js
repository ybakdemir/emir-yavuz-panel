import { isWeekend, addDays } from './dates.js';

export function dayType(key, day) {
  return day?.dayType || (isWeekend(key) ? 'weekend' : 'weekday');
}

/**
 * Which day rule applies to `item` on `key`. A schedule change is effective
 * from the day it was made: `days` stays the rule for days before `daysFrom`,
 * `daysNow` is the rule from then on. So changing a rule never rewrites the
 * history behind past ratios and good days — and a build that only knows
 * `days` (e.g. the current Production reading the shared /v2 node) keeps
 * the old behaviour instead of applying the new rule to the past.
 */
export function daysFor(item, key) {
  if (item.daysFrom && item.daysNow && key >= item.daysFrom) return item.daysNow;
  return item.days;
}

/** Change an item's day rule from `today` on; the rule in force yesterday stays for earlier days. */
export function setItemDays(item, days, today) {
  if (daysFor(item, today) === days && daysFor(item, addDays(today, -1)) === days) return item;
  item.days = daysFor(item, addDays(today, -1));
  item.daysFrom = today;
  item.daysNow = days;
  return item;
}

function matchesDayType(item, type, key) {
  const days = daysFor(item, key);
  return days === 'all' || days === type;
}

/**
 * Items that should be *shown* on Today for a given day. Homework shows on
 * weekdays even while its state is unknown (so the child can answer
 * "Bugün ödev yok"), and on weekends only when explicitly marked as existing.
 */
export function itemsForDay(config, key, day) {
  const type = dayType(key, day);
  return config.items.filter((item) => {
    if (item.enabled === false) return false;
    if (item.kind === 'homework') {
      if (day?.homework === 'exists') return true;
      if (day?.homework === 'none') return type === 'weekday'; // still shown, in "no homework" state
      return type === 'weekday';
    }
    if (item.kind === 'skill') return !!day?.skillId;
    return matchesDayType(item, type, key);
  });
}

/**
 * Items that *count* toward completion for a given day (the denominator of
 * every ratio). Homework counts only when it exists; the weekly presentation
 * is week-level and never counts at day level.
 */
export function coreItemsForDay(config, key, day) {
  return itemsForDay(config, key, day).filter((item) => {
    if (item.kind === 'presentation') return false;
    if (item.kind === 'homework') return day?.homework === 'exists';
    return true;
  });
}
