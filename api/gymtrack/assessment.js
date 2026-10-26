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

export function normalizeAssessmentDraft(input = {}, now = new Date().toISOString()) {
  const profile = input.profile && typeof input.profile === 'object' ? input.profile : {};
  const parq = input.parq && typeof input.parq === 'object' ? input.parq : {};
  const availability = input.availability && typeof input.availability === 'object' ? input.availability : {};
  const profileValidation = Object.keys(profile).length ? validatePhysicalProfile(profile) : { ok: false, errors: {} };
  const parqSummary = summarizeParq(parq);
  const days = Array.isArray(availability.days) ? [...new Set(availability.days.filter(day => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b) : [];
  const daysPerWeek = Number.isInteger(availability.daysPerWeek) ? availability.daysPerWeek : null;
  const sleepHours = Number.isFinite(availability.sleepHours) ? availability.sleepHours : null;
  const minutes = Number.isInteger(availability.minutes) ? availability.minutes : null;
  const errors = {};
  if (Object.keys(profile).length && !profileValidation.ok) errors.profile = profileValidation.errors;
  if (Object.keys(parq).length && !parqSummary.complete) errors.parq = parqSummary.missing;
  if (daysPerWeek !== null && (daysPerWeek < 2 || daysPerWeek > 6)) errors.daysPerWeek = 'days-per-week-invalid';
  if (daysPerWeek !== null && days.length && days.length !== daysPerWeek) errors.days = 'days-do-not-match-frequency';
  if (sleepHours !== null && (sleepHours < 0 || sleepHours > 24)) errors.sleepHours = 'sleep-hours-invalid';
  if (minutes !== null && (minutes < 30 || minutes > 90)) errors.minutes = 'session-minutes-invalid';

  const criteria = input.criteria && typeof input.criteria === 'object' ? {
    experience: Number.isInteger(input.criteria.experience) ? input.criteria.experience : null,
    frequency: Number.isInteger(input.criteria.frequency) ? input.criteria.frequency : null,
    relativeStrength: Number.isInteger(input.criteria.relativeStrength) ? input.criteria.relativeStrength : null,
    progression: Number.isInteger(input.criteria.progression) ? input.criteria.progression : null,
  } : null;

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
        ...(Number.isFinite(Number(input.experience?.months)) ? { months: Number(input.experience.months) } : {}),
        ...(cleanText(input.experience?.progressionMode, 32) ? { progressionMode: cleanText(input.experience.progressionMode, 32) } : {})
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
      level: null,
      levelStatus: criteria && Object.values(criteria).every(value => value !== null) ? 'ready-for-scoring' : 'pending-scoring-thresholds',
      criteria
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
