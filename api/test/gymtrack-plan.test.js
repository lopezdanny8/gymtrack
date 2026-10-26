import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAssessmentDraft } from '../gymtrack/assessment.js';
import { generateGymTrackPlan } from '../gymtrack/plan.js';

const parqNo = {
  heart_condition: false,
  chest_pain_activity: false,
  chest_pain_rest: false,
  dizziness: false,
  bone_joint: false,
  medication: false,
  other_reason: false,
};
const validDays = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 4, 6],
  6: [1, 2, 3, 4, 5, 6],
};
const allEquipment = ['bodyweight', 'dumbbell', 'barbell', 'machines', 'cables', 'bands'];

function assessment(daysPerWeek, days, equipment = allEquipment) {
  const result = normalizeAssessmentDraft({
    profile: { birthDate: '1990-02-03', biologicalSex: 'male', heightCm: 180, weightKg: 81 },
    parq: parqNo,
    experience: { months: 18, trainingDaysPerWeek: 3, progressionMode: 'tracks_loads' },
    objective: 'hypertrophy',
    availability: { daysPerWeek, days, minutes: 60, equipment },
  });
  assert.equal(result.ok, true);
  return result.assessment;
}

test('GymTrack genera los cinco splits aprobados para 2–6 días con ejercicios válidos', () => {
  const splits = { 2: 'full-body-2', 3: 'full-body', 4: 'upper-lower', 5: 'mixed-5', 6: 'ppl-2x' };
  for (const daysPerWeek of [2, 3, 4, 5, 6]) {
    const result = generateGymTrackPlan(assessment(daysPerWeek, validDays[daysPerWeek]));
    assert.equal(result.ok, true, `failed for ${daysPerWeek} days: ${result.error}`);
    assert.equal(result.plan.template.split, splits[daysPerWeek]);
    assert.equal(result.plan.routines.length, daysPerWeek);
    assert.deepEqual(result.plan.schedule.map(slot => slot.day), validDays[daysPerWeek]);
    const routineIds = new Set(result.plan.routines.map(routine => routine.id));
    assert.equal(routineIds.size, daysPerWeek);
    assert.ok(result.plan.schedule.every(slot => routineIds.has(slot.routineId)));
    assert.ok(result.plan.routines.every(routine => routine.ex.length >= 3));
    assert.ok(result.plan.routines.every(routine => routine.ex.every(exercise => exercise.sets > 0 && exercise.reps > 0 && exercise.weight === 0)));
  }
});

test('cada categoría de equipamiento seleccionable permite armar el split Full Body cuando los ejercicios sustitutos alcanzan', () => {
  for (const equipment of [[], ['bodyweight'], ['dumbbell'], ['barbell'], ['machines'], ['cables'], ['bands']]) {
    const result = generateGymTrackPlan(assessment(3, validDays[3], equipment));
    assert.equal(result.ok, true, `failed for equipment ${equipment.join(',') || 'none'}: ${result.error}`);
    assert.equal(result.plan.routines.length, 3);
  }
});

test('cambia de split para conservar 48 horas cuando los días elegidos son consecutivos', () => {
  const twoDays = generateGymTrackPlan(assessment(2, [1, 2]));
  assert.equal(twoDays.ok, true);
  assert.equal(twoDays.plan.template.split, 'upper-lower-2');
  assert.deepEqual(twoDays.plan.routines.map(routine => routine.name), ['Superior A', 'Inferior A']);
  assert.ok(twoDays.plan.template.changes.includes('split-for-48-hour-recovery'));

  const threeDays = generateGymTrackPlan(assessment(3, [1, 2, 4]));
  assert.equal(threeDays.ok, true);
  assert.equal(threeDays.plan.template.split, 'ppl');
  assert.deepEqual(threeDays.plan.routines.map(routine => routine.name), ['Empuje', 'Jalón', 'Piernas']);
  assert.ok(threeDays.plan.template.changes.includes('split-for-48-hour-recovery'));
});

test('no asigna de forma silenciosa una prescripción a un objetivo legado que P7 ya no ofrece', () => {
  const oldAssessment = { ...assessment(3, validDays[3]), objective: 'fat_loss' };
  const result = generateGymTrackPlan(oldAssessment);
  assert.equal(result.ok, false);
  assert.equal(result.status, 422);
  assert.equal(result.code, 'no-compatible-template');
  assert.match(result.error, /objetivo registrado/);
});
