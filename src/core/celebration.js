// Differential encouragement without a point economy.
//
// Three semantic levels, never a number. The level says how much the UI
// makes of a moment; it is not stored, not summed and never spent.
//   STANDARD   — an ordinary completion: check + micro-animation.
//   MEANINGFUL — a habit worth a warmer word: Little Explorer, the day's
//                memory reviews, Physical Five, the weekly reflection.
//   MILESTONE  — development itself: a skill graduated, the weekly
//                presentation, a memory / English / monthly milestone
//                (these can also open a Dinosaur Discovery, see expedition.js).

export const LEVEL = { STANDARD: 'standard', MEANINGFUL: 'meaningful', MILESTONE: 'milestone' };

/** Item ids on Today whose completion is more than a checkbox. */
const ITEM_LEVEL = { explorer: LEVEL.MEANINGFUL, physical: LEVEL.MEANINGFUL };

export const EVENTS = {
  task_done: { level: LEVEL.STANDARD, message: '' },
  explorer_done: { level: LEVEL.MEANINGFUL, message: 'İngilizce keşfin tamamlandı.' },
  physical_done: { level: LEVEL.MEANINGFUL, message: 'Physical Five tamamlandı. Her gün biraz daha güçlü.' },
  reviews_done: { level: LEVEL.MEANINGFUL, message: 'Bugünkü tekrarların tamamlandı. Hafızanı güçlü tuttun.' },
  reflection_saved: { level: LEVEL.MEANINGFUL, message: 'Haftanı düşündün. Bu da bir kaşif işi.' },
  presentation_done: { level: LEVEL.MILESTONE, title: 'Haftanın sunumu', message: 'Bir konuyu hazırlayıp anlattın. Bilgi paylaşınca büyür.' },
  skill_mastered: { level: LEVEL.MILESTONE, title: 'Yeni beceri', message: 'Bir beceriyi artık kendi başına yapabiliyorsun.' },
  memory_strong: { level: LEVEL.MILESTONE, title: 'Güçlü hafıza', message: 'Bir ezberi uzun süre koruyorsun.' },
  discovery: { level: LEVEL.MILESTONE, title: 'Yeni keşif!', message: 'Keşif haritasında yeni bir şey buldun.' },
};

/** Why a discovery opened — shown with the dinosaur, never as a number. */
export const DISCOVERY_REASON = {
  memory: 'Hafızanı düzenli çalışarak güçlü tuttun.',
  english: 'İngilizce keşfini gün gün sürdürdün.',
  month: 'Bir ay boyunca yolunu düzenli yürüdün.',
  steps: 'İyi günlerin seni buraya getirdi.',
};

export function celebrationFor(event) {
  return EVENTS[event] || EVENTS.task_done;
}

/** Level for completing a Today item. Everything not listed is STANDARD. */
export function levelForItem(itemId) {
  return ITEM_LEVEL[itemId] || LEVEL.STANDARD;
}

/** Event name for completing a Today item (null → standard, nothing to say). */
export function eventForItem(itemId) {
  return levelForItem(itemId) === LEVEL.STANDARD ? null : `${itemId}_done`;
}
