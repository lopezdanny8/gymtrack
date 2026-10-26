import test from 'node:test';
import assert from 'node:assert/strict';
import { reassessmentStatus, REASSESSMENT_INTERVAL_DAYS } from './reassessment.js';

const start = '2026-01-01T12:00:00.000Z';
const day = n => new Date(Date.parse(start) + n * 24 * 60 * 60 * 1000).toISOString();

test('reevaluación está vigente antes de ocho semanas y vence al día 56', () => {
  const plan = { generatedAt: start };
  assert.equal(REASSESSMENT_INTERVAL_DAYS, 56);
  assert.equal(reassessmentStatus({ plan, now: day(55) }).status, 'current');
  assert.equal(reassessmentStatus({ plan, now: day(56) }).status, 'due');
  assert.equal(reassessmentStatus({ plan, now: day(56) }).dueAt, day(56));
});

test('una confirmación explícita reinicia el siguiente periodo', () => {
  const status = reassessmentStatus({
    plan: { generatedAt: start },
    assessment: { reevaluation: { lastAt: day(56) } },
    now: day(56),
  });
  assert.equal(status.status, 'current');
  assert.equal(status.dueAt, day(112));
});

test('sin plan generado no hay reevaluación pendiente', () => {
  assert.deepEqual(reassessmentStatus({ assessment: {}, now: day(100) }), {
    status: 'not_started', due: false, startedAt: null, lastAt: null, dueAt: null,
  });
});
