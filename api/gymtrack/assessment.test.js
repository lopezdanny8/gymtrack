import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PARQ_QUESTIONS,
  assignPlanTemplate,
  calculateBmi,
  calculateLevelFromAssessment,
  calculateLevelFromPoints,
  classifyBmi,
  estimateBenchPress1RM,
  evaluatePlanEntryGate,
  evaluateTrainingEligibility,
  normalizeAssessmentDraft,
  scoreProgressionMode,
  scoreRelativeStrengthRatio,
  scoreTrainingFrequency,
  scoreTrainingMonths,
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

test('deriva elegibilidad solo con meses y frecuencia de entrenamiento actual', () => {
  assert.deepEqual(evaluateTrainingEligibility({}), {
    status: 'pending', eligible: null, missing: ['months', 'trainingDaysPerWeek'], reasons: [],
  });
  assert.deepEqual(evaluateTrainingEligibility({ months: 4, trainingDaysPerWeek: 1 }), {
    status: 'ineligible', eligible: false, missing: [],
    reasons: ['training-duration-under-6-months', 'training-frequency-under-2-days'],
  });
  assert.deepEqual(evaluateTrainingEligibility({ months: 6, trainingDaysPerWeek: 2 }), {
    status: 'eligible', eligible: true, missing: [], reasons: [],
  });
});

test('combina elegibilidad y PAR-Q en el gate P8 sin bloquear respuestas positivas completas', () => {
  const completeNo = Object.fromEntries(PARQ_QUESTIONS.map(({ id }) => [id, false]));
  const completePositive = { ...completeNo, chest_pain_activity: true };
  const eligible = evaluateTrainingEligibility({ months: 12, trainingDaysPerWeek: 3 });
  const ineligible = evaluateTrainingEligibility({ months: 4, trainingDaysPerWeek: 1 });

  assert.deepEqual(evaluatePlanEntryGate({
    eligibility: evaluateTrainingEligibility({}),
    parqSummary: summarizeParq({}),
  }), {
    status: 'pending',
    passed: null,
    blockingReasons: ['eligibility-data-incomplete', 'parq-incomplete'],
    requiresLimitedIntensity: false,
    consultationRecommended: false,
  });

  assert.deepEqual(evaluatePlanEntryGate({
    eligibility: ineligible,
    parqSummary: summarizeParq({ heart_condition: true }),
  }), {
    status: 'blocked',
    passed: false,
    blockingReasons: ['training-duration-under-6-months', 'training-frequency-under-2-days', 'parq-incomplete'],
    requiresLimitedIntensity: true,
    consultationRecommended: true,
  });

  assert.deepEqual(evaluatePlanEntryGate({
    eligibility: eligible,
    parqSummary: summarizeParq(completeNo),
  }), {
    status: 'passed',
    passed: true,
    blockingReasons: [],
    requiresLimitedIntensity: false,
    consultationRecommended: false,
  });

  const positiveGate = evaluatePlanEntryGate({
    eligibility: eligible,
    parqSummary: summarizeParq(completePositive),
  });
  assert.equal(positiveGate.status, 'passed');
  assert.equal(positiveGate.requiresLimitedIntensity, true);
  assert.equal(positiveGate.consultationRecommended, true);
});

test('normaliza frecuencia actual y serie reciente por separado de disponibilidad', () => {
  const result = normalizeAssessmentDraft({
    experience: {
      months: 18,
      trainingDaysPerWeek: 2,
      benchPressBestSet: { weightKg: 52.5, reps: 6 },
      progressionMode: 'plan_with_rpe',
    },
    availability: { daysPerWeek: 4, days: [1, 2, 3, 4] },
  });
  assert.equal(result.ok, true);
  assert.equal(result.assessment.experience.trainingDaysPerWeek, 2);
  assert.deepEqual(result.assessment.experience.benchPressBestSet, { weightKg: 52.5, reps: 6 });
  assert.equal(result.assessment.availability.daysPerWeek, 4);
  assert.equal(result.assessment.eligibility.status, 'eligible');
  assert.equal(result.assessment.level, null);
});

test('rechaza frecuencia o serie de press inválidas sin calcular puntuación', () => {
  const result = normalizeAssessmentDraft({
    experience: { months: -1, trainingDaysPerWeek: 8, benchPressBestSet: { weightKg: 0, reps: 1 } },
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors.experience.months, 'training-months-invalid');
  assert.equal(result.errors.experience.trainingDaysPerWeek, 'training-days-per-week-invalid');
  assert.equal(result.errors.experience.benchPressBestSet, 'bench-set-invalid');
  const invalidRepRange = normalizeAssessmentDraft({
    experience: { benchPressBestSet: { weightKg: 40, reps: 11 } },
  });
  assert.equal(invalidRepRange.ok, false);
  assert.equal(invalidRepRange.errors.experience.benchPressBestSet, 'bench-set-reps-outside-estimation-range');
});

test('puntúa las bandas v1 de experiencia, frecuencia y progresión', () => {
  assert.equal(scoreTrainingMonths(5.99), null);
  assert.equal(scoreTrainingMonths(6), 0);
  assert.equal(scoreTrainingMonths(11.99), 0);
  assert.equal(scoreTrainingMonths(12), 1);
  assert.equal(scoreTrainingMonths(36), 1);
  assert.equal(scoreTrainingMonths(36.01), 2);
  assert.equal(scoreTrainingFrequency(1), null);
  assert.equal(scoreTrainingFrequency(2), 0);
  assert.equal(scoreTrainingFrequency(3), 0);
  assert.equal(scoreTrainingFrequency(4), 1);
  assert.equal(scoreTrainingFrequency(5), 2);
  assert.equal(scoreTrainingFrequency(7), 2);
  assert.equal(scoreProgressionMode('no_log'), 0);
  assert.equal(scoreProgressionMode('tracks_loads'), 1);
  assert.equal(scoreProgressionMode('plan_with_rpe'), 2);
  assert.equal(scoreProgressionMode('follows_plan'), null);
});

test('estima 1RM con Epley solo para series de 2–10 repeticiones y aplica los cortes por sexo', () => {
  assert.equal(estimateBenchPress1RM(60, 6), 72);
  assert.equal(estimateBenchPress1RM(60, 1), null);
  assert.equal(estimateBenchPress1RM(60, 11), null);
  assert.equal(scoreRelativeStrengthRatio(0.8999, 'male'), 0);
  assert.equal(scoreRelativeStrengthRatio(0.9, 'male'), 1);
  assert.equal(scoreRelativeStrengthRatio(1.1999, 'male'), 1);
  assert.equal(scoreRelativeStrengthRatio(1.2, 'male'), 2);
  assert.equal(scoreRelativeStrengthRatio(0.4999, 'female'), 0);
  assert.equal(scoreRelativeStrengthRatio(0.5, 'female'), 1);
  assert.equal(scoreRelativeStrengthRatio(0.7499, 'female'), 1);
  assert.equal(scoreRelativeStrengthRatio(0.75, 'female'), 2);
});

test('calcula el nivel solo en servidor y devuelve desglose, total y explicación', () => {
  const result = normalizeAssessmentDraft({
    profile: { birthDate: '1990-02-03', biologicalSex: 'male', heightCm: 180, weightKg: 70 },
    experience: {
      months: 12,
      trainingDaysPerWeek: 4,
      benchPressBestSet: { weightKg: 60, reps: 6 },
      progressionMode: 'tracks_loads',
    },
    criteria: { experience: 2, frequency: 2, relativeStrength: 2, progression: 2 },
  });
  assert.equal(result.ok, true);
  assert.equal(result.assessment.levelStatus, 'scored');
  assert.equal(result.assessment.level, 'intermediate');
  assert.equal(result.assessment.levelPoints, 4);
  assert.equal(result.assessment.levelMaxPoints, 8);
  assert.deepEqual(result.assessment.criteria, {
    experience: 1, frequency: 1, relativeStrength: 1, progression: 1,
  });
  assert.deepEqual(result.assessment.benchPressEstimate, {
    method: 'epley', estimated1RMKg: 72, bodyweightRatio: 1.029,
  });
  assert.match(result.assessment.levelExplanation, /4\/8/);

  const advanced = calculateLevelFromAssessment({
    eligibility: { status: 'eligible' },
    profile: { biologicalSex: 'female', weightKg: 60 },
    experience: {
      months: 48, trainingDaysPerWeek: 5, progressionMode: 'plan_with_rpe',
      benchPressBestSet: { weightKg: 45, reps: 6 },
    },
  });
  assert.equal(advanced.points, 8);
  assert.equal(advanced.level, 'advanced');
});

test('sin serie válida el resultado elegible es intermedio provisional y no inventa un total', () => {
  const result = normalizeAssessmentDraft({
    profile: { birthDate: '1990-02-03', biologicalSex: 'female', heightCm: 165, weightKg: 60 },
    experience: { months: 18, trainingDaysPerWeek: 3, progressionMode: 'tracks_loads' },
  });
  assert.equal(result.assessment.levelStatus, 'provisional');
  assert.equal(result.assessment.level, 'intermediate');
  assert.equal(result.assessment.levelPoints, null);
  assert.equal(result.assessment.criteria.relativeStrength, null);
  assert.equal(result.assessment.benchPressEstimate.estimated1RMKg, null);
  assert.match(result.assessment.levelExplanation, /provisional/i);
});

test('la inelegibilidad y los datos P7 incompletos no producen un nivel definitivo', () => {
  const ineligible = normalizeAssessmentDraft({
    profile: { birthDate: '1990-02-03', biologicalSex: 'male', heightCm: 180, weightKg: 70 },
    experience: {
      months: 5, trainingDaysPerWeek: 4, progressionMode: 'tracks_loads',
      benchPressBestSet: { weightKg: 60, reps: 6 },
    },
  }).assessment;
  assert.equal(ineligible.levelStatus, 'ineligible');
  assert.equal(ineligible.level, null);
  assert.equal(ineligible.levelPoints, null);

  const incomplete = normalizeAssessmentDraft({
    profile: { birthDate: '1990-02-03', biologicalSex: 'male', heightCm: 180, weightKg: 70 },
    experience: { months: 18, trainingDaysPerWeek: 3 },
    criteria: { experience: 2, frequency: 2, relativeStrength: 2, progression: 2 },
  }).assessment;
  assert.equal(incomplete.levelStatus, 'pending-inputs');
  assert.equal(incomplete.level, null);
  assert.equal(incomplete.levelPoints, null);
  assert.deepEqual(incomplete.criteria, {
    experience: 1, frequency: 0, relativeStrength: null, progression: null,
  });
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
