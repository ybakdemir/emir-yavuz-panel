/** Steps shown for a routine at its current stage. MASTERED shows none. */
export function visibleSteps(routine) {
  if (!routine || routine.stage === 'mastered') return [];
  return (routine.steps || []).filter((s) => (s.stages || ['learn']).includes(routine.stage));
}

export function stepsDone(routine, day) {
  const steps = visibleSteps(routine);
  const marks = day?.steps?.[routine.id] || {};
  const done = steps.filter((s) => marks[s.id]).length;
  return { done, total: steps.length, all: steps.length > 0 && done === steps.length };
}

export function toggleStep(day, routineId, stepId) {
  day.steps ||= {};
  day.steps[routineId] ||= {};
  day.steps[routineId][stepId] = !day.steps[routineId][stepId];
  return day.steps[routineId][stepId];
}
