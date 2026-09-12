/** Minimum classified completions (independent + reminder + assisted) before the weekly message may talk about independence. */
export const MIN_CLASSIFIED_FOR_INDEPENDENCE_CLAIM = 3;
export const STRONG_INDEPENDENCE_RATE = 0.7;

export const WEEKLY_MSG = {
  newWeek: 'Yeni bir hafta. Küçük adımlar, büyük keşifler.',
  strong: 'Bu hafta işlerin çoğunu kendin yaptın. Bu tam bir kaşif işi.',
  nextStep: 'Güzel bir hafta gidiyor. Bir sonraki adım: hatırlatma olmadan denemek.',
  neutral: 'Bu hafta planını takip etmeye devam ettin. Güzel gidiyorsun.',
  restart: 'Her gün yeniden başlamak da bir beceri. Devam.',
};

/**
 * Pick the child's weekly encouragement from a week's independenceStats.
 * Any claim about independence (strong or "next step") needs evidence: at
 * least MIN_CLASSIFIED classified completions in the window. Below that the
 * message only talks about participation/completion — one classified
 * "Kendim yaptım" (100% of 1) must never produce the strong message.
 */
export function weeklyMessageFor(st) {
  if (!st.days) return WEEKLY_MSG.newWeek;
  const enoughEvidence = st.classified >= MIN_CLASSIFIED_FOR_INDEPENDENCE_CLAIM;
  if (enoughEvidence && st.rate >= STRONG_INDEPENDENCE_RATE) return WEEKLY_MSG.strong;
  if (enoughEvidence && st.completionRate >= 0.7) return WEEKLY_MSG.nextStep;
  if (st.completionRate >= 0.7) return WEEKLY_MSG.neutral;
  return WEEKLY_MSG.restart;
}
