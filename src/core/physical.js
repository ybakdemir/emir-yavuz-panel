import { isoWeekday } from './dates.js';

/** The five exercises with today's target, following the 7-day pattern. */
export function targetsFor(physical, key) {
  const i = isoWeekday(key);
  return physical.exercises.map((e) => ({ ...e, target: e.pattern[i] ?? e.pattern[0] }));
}

export function physicalProgress(physical, day) {
  const marks = day?.physical || {};
  const done = physical.exercises.filter((e) => marks[e.id]).length;
  return { done, total: physical.exercises.length, all: done === physical.exercises.length };
}

export function toggleExercise(day, exerciseId) {
  day.physical ||= {};
  day.physical[exerciseId] = !day.physical[exerciseId];
  return day.physical[exerciseId];
}
