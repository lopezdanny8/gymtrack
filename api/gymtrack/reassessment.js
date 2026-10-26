/**
 * Regla pura de reevaluación GymTrack.
 * La fecha de inicio pertenece al plan generado; la confirmación pertenece al assessment.
 */

export const REASSESSMENT_INTERVAL_DAYS = 56;
const DAY_MS = 24 * 60 * 60 * 1000;

const validTime = value => {
  const time = Date.parse(String(value || ''));
  return Number.isFinite(time) ? time : null;
};

export function reassessmentStatus({ plan, assessment, now = new Date().toISOString() } = {}) {
  const startedAt = plan?.generatedAt || null;
  const startTime = validTime(startedAt);
  if (startTime === null) {
    return { status: 'not_started', due: false, startedAt: null, lastAt: null, dueAt: null };
  }
  const lastAt = assessment?.reevaluation?.lastAt || null;
  const lastTime = validTime(lastAt);
  const anchorTime = lastTime === null ? startTime : lastTime;
  const dueAt = new Date(anchorTime + REASSESSMENT_INTERVAL_DAYS * DAY_MS).toISOString();
  const nowTime = validTime(now) ?? Date.now();
  return {
    status: nowTime >= validTime(dueAt) ? 'due' : 'current',
    due: nowTime >= validTime(dueAt),
    startedAt,
    lastAt,
    dueAt,
  };
}
