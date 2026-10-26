import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PARQ_QUESTIONS,
  assignPlanTemplate,
  calculateBmi,
  calculateLevelFromPoints,
  classifyBmi,
  summarizeParq,
  validatePhysicalProfile,
} from './assessment.js';

test('PAR-Q contiene siete preguntas y detecta respuestas positivas', () => {
  assert.equal(PARQ_QUESTIONS.length, 7);
  const answers = Object.fromEntries(PARQ_QUESTIONS.map(({ id }) => [id, false]));
  assert.deepEqual(summarizeParq(answers), {
    complete: true,
    missing: [],
    positive: [],
    hasPositive: false,
    initialRecoveryStatus: 'green',
  });
  answers.chest_pain_activity = true;
  assert.equal(summarizeParq(answers).initialRecoveryStatus, 'red_parq');
  assert.deepEqual(summarizeParq(answers).positive, ['chest_pain_activity']);
});

test('PAR-Q incompleto no permite avanzar', () => {
  const result = summarizeParq({ heart_condition: false });
  assert.equal(result.complete, false);
  assert.equal(result.initialRecoveryStatus, 'pending');
  assert.equal(result.missing.length, 6);
});

test('calcula IMC y lo clasifica sin presentarlo como diagnóstico', () => {
  assert.equal(calculateBmi({ heightCm: 180, weightKg: 81 }), 25);
  assert.equal(classifyBmi(25), 'overweight');
  assert.equal(calculateBmi({ heightCm: 0, weightKg: 81 }), null);
});

test('valida el perfil físico requerido', () => {
  assert.equal(validatePhysicalProfile({
    birthDate: '1990-02-03',
    heightCm: 180,
    weightKg: 81,
    biologicalSex: 'male',
  }).ok, true);
  assert.equal(validatePhysicalProfile({
    birthDate: '1990-02-03',
    heightCm: 180,
    weightKg: 81,
    biologicalSex: 'female',
  }).ok, true);
  const invalid = validatePhysicalProfile({ heightCm: 0, weightKg: -1 });
  assert.equal(invalid.ok, false);
  assert.deepEqual(Object.keys(invalid.errors).sort(), ['biologicalSex', 'birthDate', 'heightCm', 'weightKg']);
});

test('calcula nivel intermedio o avanzado a partir de cuatro criterios de 0 a 2', () => {
  assert.deepEqual(calculateLevelFromPoints({
    experience: 1,
    frequency: 1,
    relativeStrength: 1,
    progression: 0,
  }), {
    ok: true,
    points: 3,
    maxPoints: 8,
    level: 'intermediate',
    criteria: { experience: 1, frequency: 1, relativeStrength: 1, progression: 0 },
    explanation: '3/8 puntos: nivel intermedio.',
  });
  assert.equal(calculateLevelFromPoints({ experience: 2, frequency: 2, relativeStrength: 1, progression: 1 }).level, 'advanced');
  assert.equal(calculateLevelFromPoints({ experience: 3, frequency: 0, relativeStrength: 0, progression: 0 }).ok, false);
});

test('elige una plantilla exacta y, si no existe, la más cercana por R1', () => {
  const templates = [
    { id: 'upper-advanced-4', daysPerWeek: 4, level: 'advanced', objective: 'strength' },
    { id: 'full-intermediate-3', daysPerWeek: 3, level: 'intermediate', objective: 'hypertrophy' },
    { id: 'upper-intermediate-4', daysPerWeek: 4, level: 'intermediate', objective: 'hypertrophy' },
  ];
  const exact = assignPlanTemplate({ daysPerWeek: 4, level: 'intermediate', objective: 'hypertrophy', templates });
  assert.equal(exact.exact, true);
  assert.equal(exact.template.id, 'upper-intermediate-4');

  const nearest = assignPlanTemplate({ daysPerWeek: 4, level: 'intermediate', objective: 'strength', templates });
  assert.equal(nearest.exact, false);
  assert.equal(nearest.template.id, 'upper-intermediate-4');
  assert.deepEqual(nearest.changes, ['objective']);
});
