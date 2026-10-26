/**
 * Reglas puras del onboarding web de GymTrack.
 *
 * Este módulo no lee archivos, no conoce HTTP y no depende de React. La API
 * puede usarlo como autoridad y las reglas se pueden probar de forma aislada.
 */

export const PARQ_QUESTIONS = Object.freeze([
  { id: 'heart_condition', label: '¿Alguna vez un médico le ha dicho que tiene una afección cardíaca o que solo debe hacer actividad física recomendada por un médico?' },
  { id: 'chest_pain_activity', label: '¿Siente dolor en el pecho cuando hace actividad física?' },
  { id: 'chest_pain_rest', label: '¿En el último mes ha sentido dolor en el pecho cuando no estaba haciendo actividad física?' },
  { id: 'dizziness', label: '¿Pierde el equilibrio por mareo o ha perdido el conocimiento?' },
  { id: 'bone_joint', label: '¿Tiene algún problema óseo o articular que podría empeorar con un cambio en su actividad física?' },
  { id: 'medication', label: '¿Está tomando actualmente algún medicamento para la presión arterial o para el corazón?' },
  { id: 'other_reason', label: '¿Existe alguna otra razón por la que no debería hacer actividad física?' },
]);

const isFinitePositive = value => Number.isFinite(value) && value > 0;

export function calculateBmi({ heightCm, weightKg }) {
  if (!isFinitePositive(heightCm) || !isFinitePositive(weightKg)) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function classifyBmi(bmi) {
  if (!Number.isFinite(bmi) || bmi <= 0) return null;
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obesity';
}

export function validatePhysicalProfile(profile = {}) {
  const errors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(profile.birthDate || ''))) {
    errors.birthDate = 'birth-date-required';
  }
  if (!isFinitePositive(Number(profile.heightCm))) errors.heightCm = 'height-invalid';
  if (!isFinitePositive(Number(profile.weightKg))) errors.weightKg = 'weight-invalid';
  if (!['male', 'female'].includes(profile.biologicalSex)) {
    errors.biologicalSex = 'biological-sex-required';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

const cleanText = (value, max = 80) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export function evaluateTrainingEligibility({ months, trainingDaysPerWeek } = {}) {
  const missing = [];
  if (!Number.isFinite(months)) missing.push('months');
  if (!Number.isInteger(trainingDaysPerWeek) || trainingDaysPerWeek < 0 || trainingDaysPerWeek > 7) {
    missing.push('trainingDaysPerWeek');
  }
  if (missing.length) return { status: 'pending', eligible: null, missing, reasons: [] };

  const reasons = [];
  if (months < 6) reasons.push('training-duration-under-6-months');
  if (trainingDaysPerWeek < 2) reasons.push('training-frequency-under-2-days');
  return {
    status: reasons.length ? 'ineligible' : 'eligible',
    eligible: reasons.length === 0,
    missing: [],
    reasons,
  };
}

export function evaluatePlanEntryGate({ eligibility, parqSummary } = {}) {
  const blockingReasons = [];
  const eligibilityStatus = eligibility?.status;
  const parqComplete = parqSummary?.complete === true;
  const eligibilityPending = eligibilityStatus === 'pending' || !['eligible', 'ineligible'].includes(eligibilityStatus);

  if (eligibilityPending) blockingReasons.push('eligibility-data-incomplete');
  else if (eligibilityStatus === 'ineligible' && Array.isArray(eligibility.reasons)) {
    blockingReasons.push(...eligibility.reasons);
  }
  if (!parqComplete) blockingReasons.push('parq-incomplete');

  const passed = eligibilityStatus === 'eligible' && parqComplete;
  const requiresLimitedIntensity = parqSummary?.hasPositive === true;
  return {
    status: eligibilityPending ? 'pending' : passed ? 'passed' : 'blocked',
    passed: eligibilityPending ? null : passed,
    blockingReasons,
    requiresLimitedIntensity,
    consultationRecommended: requiresLimitedIntensity,
  };
}

const roundTo = (value, places) => Number(value.toFixed(places));

export function scoreTrainingMonths(months) {
  if (!Number.isFinite(months) || months < 6) return null;
  if (months < 12) return 0;
  if (months <= 36) return 1;
  return 2;
}

export function scoreTrainingFrequency(days) {
  if (!Number.isInteger(days) || days < 2 || days > 7) return null;
  if (days <= 3) return 0;
  if (days === 4) return 1;
  return 2;
}

export function scoreProgressionMode(mode) {
  if (mode === 'no_log') return 0;
  if (mode === 'tracks_loads') return 1;
  if (mode === 'plan_with_rpe') return 2;
  return null;
}

export function estimateBenchPress1RM(weightKg, reps) {
  if (!isFinitePositive(weightKg) || !Number.isInteger(reps) || reps < 2 || reps > 10) return null;
  return roundTo(weightKg * (1 + reps / 30), 1);
}

export function scoreRelativeStrengthRatio(ratio, biologicalSex) {
  if (!Number.isFinite(ratio) || ratio < 0) return null;
  if (biologicalSex === 'male') return ratio < 0.9 ? 0 : ratio < 1.2 ? 1 : 2;
  if (biologicalSex === 'female') return ratio < 0.5 ? 0 : ratio < 0.75 ? 1 : 2;
  return null;
}

export function calculateLevelFromAssessment({ experience = {}, profile = {}, eligibility = {} } = {}) {
  const criteria = {
    experience: scoreTrainingMonths(experience.months),
    frequency: scoreTrainingFrequency(experience.trainingDaysPerWeek),
    relativeStrength: null,
    progression: scoreProgressionMode(experience.progressionMode),
  };
  const bodyweightKg = Number(profile.weightKg);
  const biologicalSex = profile.biologicalSex;
  const bestSet = experience.benchPressBestSet;
  const validBestSet = bestSet && isFinitePositive(Number(bestSet.weightKg))
    && Number.isInteger(Number(bestSet.reps)) && Number(bestSet.reps) >= 2 && Number(bestSet.reps) <= 10;
  const estimatedRaw = validBestSet ? Number(bestSet.weightKg) * (1 + Number(bestSet.reps) / 30) : null;
  const estimated1RMKg = estimatedRaw === null ? null : roundTo(estimatedRaw, 1);
  const bodyweightRatioRaw = estimatedRaw !== null && isFinitePositive(bodyweightKg) ? estimatedRaw / bodyweightKg : null;
  const bodyweightRatio = bodyweightRatioRaw === null ? null : roundTo(bodyweightRatioRaw, 3);
  const benchPressEstimate = { method: 'epley', estimated1RMKg, bodyweightRatio };
  if (bodyweightRatioRaw !== null) criteria.relativeStrength = scoreRelativeStrengthRatio(bodyweightRatioRaw, biologicalSex);

  const base = { criteria, benchPressEstimate, maxPoints: 8 };
  if (eligibility.status === 'ineligible') {
    return {
      ...base, level: null, status: 'ineligible', points: null,
      explanation: 'No se calcula el nivel porque aún no cumples el requisito mínimo de experiencia y frecuencia actual.',
    };
  }
  const profileReady = isFinitePositive(bodyweightKg) && ['male', 'female'].includes(biologicalSex);
  const otherCriteriaReady = criteria.experience !== null && criteria.frequency !== null && criteria.progression !== null;
  if (eligibility.status !== 'eligible' || !profileReady || !otherCriteriaReady) {
    return {
      ...base, level: null, status: 'pending-inputs', points: null,
      explanation: 'Completa los datos de experiencia, frecuencia actual, sexo y peso corporal para calcular tu nivel.',
    };
  }
  if (!validBestSet) {
    return {
      ...base, level: 'intermediate', status: 'provisional', points: null,
      explanation: 'Nivel intermedio provisional. Agrega una serie reciente de press de banca de 2 a 10 repeticiones para calcular el nivel definitivo.',
    };
  }
  if (criteria.relativeStrength === null) {
    return {
      ...base, level: null, status: 'pending-inputs', points: null,
      explanation: 'Revisa el peso corporal y el sexo del perfil para calcular la fuerza relativa.',
    };
  }
  const scored = calculateLevelFromPoints(criteria);
  return {
    ...base,
    level: scored.level,
    status: 'scored',
    points: scored.points,
    explanation: scored.explanation,
  };
}

export function normalizeAssessmentDraft(input = {}, now = new Date().toISOString()) {
  const profile = input.profile && typeof input.profile === 'object' ? input.profile : {};
  const parq = input.parq && typeof input.parq === 'object' ? input.parq : {};
  const experience = input.experience && typeof input.experience === 'object' ? input.experience : {};
  const availability = input.availability && typeof input.availability === 'object' ? input.availability : {};
  const profileValidation = Object.keys(profile).length ? validatePhysicalProfile(profile) : { ok: false, errors: {} };
  const parqSummary = summarizeParq(parq);
  const invalidParq = Object.entries(parq).filter(([id, value]) => PARQ_QUESTIONS.some(question => question.id === id) && typeof value !== 'boolean').map(([id]) => id);
  const hasMonths = experience.months !== undefined && experience.months !== null && experience.months !== '';
  const months = hasMonths ? Number(experience.months) : null;
  const hasTrainingDays = experience.trainingDaysPerWeek !== undefined && experience.trainingDaysPerWeek !== null && experience.trainingDaysPerWeek !== '';
  const trainingDaysPerWeek = hasTrainingDays ? Number(experience.trainingDaysPerWeek) : null;
  const bestSet = experience.benchPressBestSet && typeof experience.benchPressBestSet === 'object' && !Array.isArray(experience.benchPressBestSet)
    ? experience.benchPressBestSet
    : null;
  const hasBenchWeight = bestSet?.weightKg !== undefined && bestSet.weightKg !== null && bestSet.weightKg !== '';
  const hasBenchReps = bestSet?.reps !== undefined && bestSet.reps !== null && bestSet.reps !== '';
  const benchWeightKg = hasBenchWeight ? Number(bestSet.weightKg) : null;
  const benchReps = hasBenchReps ? Number(bestSet.reps) : null;
  const days = Array.isArray(availability.days) ? [...new Set(availability.days.filter(day => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b) : [];
  const daysPerWeek = Number.isInteger(availability.daysPerWeek) ? availability.daysPerWeek : null;
  const sleepHours = Number.isFinite(availability.sleepHours) ? availability.sleepHours : null;
  const minutes = Number.isInteger(availability.minutes) ? availability.minutes : null;
  const errors = {};
  if (Object.keys(profile).length && !profileValidation.ok) errors.profile = profileValidation.errors;
  if (invalidParq.length) errors.parq = invalidParq;
  if (daysPerWeek !== null && (daysPerWeek < 2 || daysPerWeek > 6)) errors.daysPerWeek = 'days-per-week-invalid';
  if (daysPerWeek !== null && days.length && days.length !== daysPerWeek) errors.days = 'days-do-not-match-frequency';
  if (sleepHours !== null && (sleepHours < 0 || sleepHours > 24)) errors.sleepHours = 'sleep-hours-invalid';
  if (minutes !== null && (minutes < 30 || minutes > 90)) errors.minutes = 'session-minutes-invalid';
  const experienceErrors = {};
  if (hasMonths && (!Number.isFinite(months) || months < 0)) experienceErrors.months = 'training-months-invalid';
  if (hasTrainingDays && (!Number.isInteger(trainingDaysPerWeek) || trainingDaysPerWeek < 0 || trainingDaysPerWeek > 7)) {
    experienceErrors.trainingDaysPerWeek = 'training-days-per-week-invalid';
  }
  if (hasBenchWeight !== hasBenchReps) {
    experienceErrors.benchPressBestSet = 'bench-set-requires-weight-and-reps';
  } else if (hasBenchWeight && (!Number.isFinite(benchWeightKg) || benchWeightKg <= 0 || !Number.isInteger(benchReps))) {
    experienceErrors.benchPressBestSet = 'bench-set-invalid';
  } else if (hasBenchWeight && (benchReps < 2 || benchReps > 10)) {
    experienceErrors.benchPressBestSet = 'bench-set-reps-outside-estimation-range';
  }
  if (Object.keys(experienceErrors).length) errors.experience = experienceErrors;
  const eligibility = evaluateTrainingEligibility({ months, trainingDaysPerWeek });
  const planEntryGate = evaluatePlanEntryGate({ eligibility, parqSummary });
  const levelResult = calculateLevelFromAssessment({
    experience: {
      months,
      trainingDaysPerWeek,
      progressionMode: cleanText(experience.progressionMode, 32),
      benchPressBestSet: hasBenchWeight && hasBenchReps && isFinitePositive(benchWeightKg)
        && Number.isInteger(benchReps) && benchReps >= 2 && benchReps <= 10
        ? { weightKg: benchWeightKg, reps: benchReps }
        : null,
    },
    profile: { weightKg: Number(profile.weightKg), biologicalSex: cleanText(profile.biologicalSex, 24) },
    eligibility,
  });

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    assessment: {
      version: 1,
      updatedAt: now,
      profile: {
        ...(profile.birthDate ? { birthDate: cleanText(profile.birthDate, 10) } : {}),
        ...(profile.biologicalSex ? { biologicalSex: cleanText(profile.biologicalSex, 24) } : {}),
        ...(Number.isFinite(Number(profile.heightCm)) ? { heightCm: Number(profile.heightCm) } : {}),
        ...(Number.isFinite(Number(profile.weightKg)) ? { weightKg: Number(profile.weightKg) } : {}),
        ...(calculateBmi({ heightCm: Number(profile.heightCm), weightKg: Number(profile.weightKg) }) ? {
          bmi: calculateBmi({ heightCm: Number(profile.heightCm), weightKg: Number(profile.weightKg) }),
          bmiCategory: classifyBmi(calculateBmi({ heightCm: Number(profile.heightCm), weightKg: Number(profile.weightKg) }))
        } : {})
      },
      parq: Object.fromEntries(PARQ_QUESTIONS.filter(({ id }) => typeof parq[id] === 'boolean').map(({ id }) => [id, parq[id]])),
      parqSummary,
      experience: {
        ...(Number.isFinite(months) ? { months } : {}),
        ...(Number.isInteger(trainingDaysPerWeek) ? { trainingDaysPerWeek } : {}),
        ...(hasBenchWeight && hasBenchReps && Number.isFinite(benchWeightKg) && Number.isInteger(benchReps) ? {
          benchPressBestSet: { weightKg: benchWeightKg, reps: benchReps }
        } : {}),
        ...(cleanText(experience.progressionMode, 32) ? { progressionMode: cleanText(experience.progressionMode, 32) } : {})
      },
      objective: cleanText(input.objective, 32),
      availability: {
        ...(daysPerWeek !== null ? { daysPerWeek } : {}),
        ...(days.length ? { days } : {}),
        ...(cleanText(availability.startTime, 5) ? { startTime: cleanText(availability.startTime, 5) } : {}),
        ...(minutes !== null ? { minutes } : {}),
        ...(sleepHours !== null ? { sleepHours } : {}),
        equipment: Array.isArray(availability.equipment) ? availability.equipment.filter(item => typeof item === 'string').map(item => item.trim().slice(0, 32)).filter(Boolean).slice(0, 20) : []
      },
      eligibility,
      planEntryGate,
      level: levelResult.level,
      levelStatus: levelResult.status,
      levelPoints: levelResult.points,
      levelMaxPoints: levelResult.maxPoints,
      criteria: levelResult.criteria,
      benchPressEstimate: levelResult.benchPressEstimate,
      levelExplanation: levelResult.explanation,
    }
  };
}

export function summarizeParq(answers = {}) {
  const missing = PARQ_QUESTIONS.filter(question => answers[question.id] !== true && answers[question.id] !== false)
    .map(question => question.id);
  const positive = PARQ_QUESTIONS.filter(question => answers[question.id] === true)
    .map(question => question.id);
  return {
    complete: missing.length === 0,
    missing,
    positive,
    hasPositive: positive.length > 0,
    initialRecoveryStatus: positive.length > 0 ? 'red_parq' : missing.length === 0 ? 'green' : 'pending',
  };
}

export function calculateLevelFromPoints(criteria = {}) {
  const names = ['experience', 'frequency', 'relativeStrength', 'progression'];
  const errors = {};
  for (const name of names) {
    if (!Number.isInteger(criteria[name]) || criteria[name] < 0 || criteria[name] > 2) {
      errors[name] = 'score-must-be-an-integer-from-0-to-2';
    }
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const points = names.reduce((sum, name) => sum + criteria[name], 0);
  const level = points >= 5 ? 'advanced' : 'intermediate';
  return {
    ok: true,
    points,
    maxPoints: 8,
    level,
    criteria: Object.fromEntries(names.map(name => [name, criteria[name]])),
    explanation: `${points}/8 puntos: ${level === 'advanced' ? 'nivel avanzado' : 'nivel intermedio'}.`,
  };
}

const templateDistance = (requested, template) => {
  const daysDistance = Math.abs(Number(requested.daysPerWeek) - Number(template.daysPerWeek));
  const levelDistance = requested.level === template.level ? 0 : 1;
  const objectiveDistance = requested.objective === template.objective ? 0 : 1;
  // R1: primero coinciden días y nivel; después se aproxima el objetivo.
  return daysDistance * 100 + levelDistance * 10 + objectiveDistance;
};

export function assignPlanTemplate({ daysPerWeek, level, objective, templates = [] } = {}) {
  if (!Number.isInteger(daysPerWeek) || daysPerWeek < 2 || daysPerWeek > 6) {
    return { ok: false, error: 'days-per-week-invalid' };
  }
  if (!['intermediate', 'advanced'].includes(level)) return { ok: false, error: 'level-invalid' };
  if (!String(objective || '').trim()) return { ok: false, error: 'objective-required' };
  if (!Array.isArray(templates) || templates.length === 0) return { ok: false, error: 'templates-empty' };

  const requested = { daysPerWeek, level, objective };
  const ranked = templates
    .filter(template => template && template.id)
    .map(template => ({ template, distance: templateDistance(requested, template) }))
    .sort((a, b) => a.distance - b.distance || String(a.template.id).localeCompare(String(b.template.id)));
  if (ranked.length === 0) return { ok: false, error: 'templates-empty' };

  const selected = ranked[0].template;
  const exact = ranked[0].distance === 0;
  return {
    ok: true,
    exact,
    template: selected,
    requested,
    changes: exact ? [] : [
      ...(selected.daysPerWeek !== daysPerWeek ? ['daysPerWeek'] : []),
      ...(selected.level !== level ? ['level'] : []),
      ...(selected.objective !== objective ? ['objective'] : []),
    ],
  };
}
