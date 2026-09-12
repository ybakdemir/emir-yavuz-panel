import { isWeekend } from './dates.js';

export function dayType(key, day) {
  return day?.dayType || (isWeekend(key) ? 'weekend' : 'weekday');
}

function matchesDayType(item, type) {
  return item.days === 'all' || item.days === type;
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
    return matchesDayType(item, type);
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
