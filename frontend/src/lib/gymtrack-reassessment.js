const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_PROGRESS_DAYS = 14;
const MIN_PROGRESS_SESSIONS = 2;

const timeOf = value => {
  const time = Date.parse(String(value || ''));
  return Number.isFinite(time) ? time : null;
};

/**
 * Early reassessment is intentionally conservative. It needs two distinct GymTrack workouts
 * carrying an explicit `plan.kind === "up"` signal, at least two weeks apart, after the last
 * confirmation (or plan start). Missing metadata never invents progress.
 */
export function progressReassessmentStatus(state = {}, { plan, reevaluation, now = new Date().toISOString() } = {}) {
  const routineIds = new Set((state.routines || []).filter(routine => routine?.gymtrack).map(routine => routine.id));
  const anchor = timeOf(reevaluation?.lastAt || plan?.generatedAt);
  if (anchor === null || routineIds.size === 0) return { due: false, reason: null, sessions: 0 };
  const workouts = (state.workouts || [])
    .filter(workout => workout?.d && timeOf(workout.d) >= anchor)
    .filter(workout => (workout.routineIds || []).some(id => routineIds.has(id))
      || (workout.entries || []).some(entry => routineIds.has(entry?.rid)));
  const progressWorkouts = workouts.filter(workout => (workout.entries || []).some(entry =>
    routineIds.has(entry?.rid) && entry?.plan?.kind === 'up' && entry.noProg !== true));
  const dates = progressWorkouts.map(workout => timeOf(workout.d)).filter(Number.isFinite);
  const spanDays = dates.length > 1 ? (Math.max(...dates) - Math.min(...dates)) / DAY_MS : 0;
  const due = progressWorkouts.length >= MIN_PROGRESS_SESSIONS && spanDays >= MIN_PROGRESS_DAYS;
  return {
    due,
    reason: due ? 'progress' : null,
    sessions: progressWorkouts.length,
    spanDays,
    now,
  };
}
