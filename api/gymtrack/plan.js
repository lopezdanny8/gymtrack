import { assignPlanTemplate } from './assessment.js';
import { buildStarterPlan } from '../../frontend/src/lib/starter.js';
import { EXIDX } from '../../frontend/src/lib/exercises.js';
import { ALL_EQUIPMENT } from '../../frontend/src/lib/equipment.js';

const OBJECTIVES = new Set(['hypertrophy', 'strength', 'recomposition', 'performance']);
const SPLIT_BY_DAYS = { 2: 'full-body-2', 3: 'full-body', 4: 'upper-lower', 5: 'mixed-5', 6: 'ppl-2x' };
const AUXILIARY_GRIPS = new Set(['forearms']);
const LABELS = {
  'Full Body A': 'Cuerpo completo A', 'Full Body B': 'Cuerpo completo B', 'Full Body C': 'Cuerpo completo C',
  'Upper A': 'Superior A', 'Lower A': 'Inferior A', 'Upper B': 'Superior B', 'Lower B': 'Inferior B',
  'Push Day': 'Empuje', 'Pull Day': 'Jalón', 'Leg Day': 'Piernas',
};
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const templateCatalog = [];
for (let daysPerWeek = 2; daysPerWeek <= 6; daysPerWeek++) {
  for (const level of ['intermediate', 'advanced']) {
    for (const objective of OBJECTIVES) {
      templateCatalog.push({
        id: `gymtrack-v1-${daysPerWeek}-${level}-${objective}`,
        daysPerWeek,
        level,
        objective,
        split: SPLIT_BY_DAYS[daysPerWeek],
      });
    }
  }
}

function selectedEquipment(values = []) {
  const choices = new Set(values);
  const out = new Set();
  const add = value => { if (ALL_EQUIPMENT.includes(value)) out.add(value); };
  if (choices.has('dumbbell')) add('dumbbell');
  if (choices.has('barbell')) { add('barbell'); add('weight plates'); }
  if (choices.has('machines')) {
    for (const value of ALL_EQUIPMENT) if (/machine|lever|sled|assisted/i.test(value)) add(value);
  }
  if (choices.has('cables')) {
    for (const value of ALL_EQUIPMENT) if (/cable|pulley/i.test(value)) add(value);
  }
  if (choices.has('bands')) {
    for (const value of ALL_EQUIPMENT) if (/band/i.test(value)) add(value);
  }
  // Bodyweight exercises are always available in openGym. Do not infer a bench or
  // pull-up bar: GymTrack v1 does not ask the user whether those accessories exist.
  return [...out];
}

function routineMap(built) {
  return new Map((built?.routines || []).map(routine => [routine.name, routine]));
}

function assembleSplit(split, equipment) {
  const sources = [];
  const add = (planId, names, suffix = '') => {
    const built = buildStarterPlan(planId, equipment);
    if (!built) return false;
    const byName = routineMap(built);
    for (const [sourceName, planName] of names) {
      const routine = byName.get(sourceName);
      if (!routine) return false;
      routine.name = `${LABELS[sourceName] || sourceName}${suffix ? ` ${suffix}` : ''}`;
      sources.push({ routine, sourceName, built, suffix });
    }
    return true;
  };

  if (split === 'full-body-2') {
    if (!add('full-body', [['Full Body A', 'A'], ['Full Body B', 'B']])) return null;
  } else if (split === 'upper-lower-2') {
    if (!add('upper-lower', [['Upper A', 'A'], ['Lower A', 'A']])) return null;
  } else if (split === 'full-body') {
    if (!add('full-body', [['Full Body A', 'A'], ['Full Body B', 'B'], ['Full Body C', 'C']])) return null;
  } else if (split === 'ppl') {
    if (!add('ppl', [['Push Day', ''], ['Pull Day', ''], ['Leg Day', '']])) return null;
  } else if (split === 'upper-lower') {
    if (!add('upper-lower', [['Upper A', 'A'], ['Lower A', 'A'], ['Upper B', 'B'], ['Lower B', 'B']])) return null;
  } else if (split === 'mixed-5') {
    if (!add('upper-lower', [['Upper A', 'A'], ['Lower A', 'A']])) return null;
    if (!add('ppl', [['Push Day', ''], ['Pull Day', '']])) return null;
    if (!add('upper-lower', [['Lower B', 'B']])) return null;
  } else if (split === 'ppl-2x') {
    const first = add('ppl', [['Push Day', 'A'], ['Pull Day', 'A'], ['Leg Day', 'A']]);
    const second = add('ppl', [['Push Day', 'B'], ['Pull Day', 'B'], ['Leg Day', 'B']]);
    if (!first || !second) return null;
  } else {
    return null;
  }
  return sources;
}

function adaptationDetails(sources, daysPerWeek) {
  const usedKeys = new Set(sources.map(({ sourceName }) => ({
    'Full Body A': 'fb-a', 'Full Body B': 'fb-b', 'Full Body C': 'fb-c',
    'Upper A': 'upper-a', 'Lower A': 'lower-a', 'Upper B': 'upper-b', 'Lower B': 'lower-b',
    'Push Day': 'push', 'Pull Day': 'pull', 'Leg Day': 'legs',
  })[sourceName]));
  const details = [];
  const seenBuilds = new Set();
  for (const { built } of sources) {
    if (seenBuilds.has(built)) continue;
    seenBuilds.add(built);
    for (const item of built.fit?.details || []) {
      if (!usedKeys.has(item.routineKey)) continue;
      const sourceLabels = {
        'fb-a': 'Cuerpo completo A', 'fb-b': 'Cuerpo completo B', 'fb-c': 'Cuerpo completo C',
        'upper-a': 'Superior A', 'lower-a': 'Inferior A', 'upper-b': 'Superior B', 'lower-b': 'Inferior B',
        push: 'Empuje', pull: 'Jalón', legs: 'Piernas',
      };
      details.push({
        type: item.type,
        routineName: sourceLabels[item.routineKey] || item.routineKey,
        ...(item.exerciseId ? { exerciseId: item.exerciseId } : {}),
        ...(item.replacementId ? { replacementId: item.replacementId } : {}),
      });
    }
  }
  const swapped = details.filter(item => item.type === 'substituted').length;
  const dropped = details.filter(item => item.type === 'removed').length;
  return { swapped, dropped, details };
}

function prescriptionFor(objective, level, reviewRequired) {
  if (reviewRequired) return { setsPerExercise: { min: 1, max: 2 }, reps: { min: 10, max: 15 }, targetRpeMax: 5, progressionEnabled: false };
  if (objective === 'strength') return { setsPerExercise: { min: level === 'advanced' ? 3 : 2, max: 3 }, reps: { min: 4, max: 6 }, targetRpeMax: 8, progressionEnabled: true };
  if (objective === 'performance') return { setsPerExercise: { min: 2, max: level === 'advanced' ? 3 : 2 }, reps: { min: 6, max: 8 }, targetRpeMax: 7, progressionEnabled: true };
  return { setsPerExercise: { min: 3, max: level === 'advanced' ? 4 : 3 }, reps: { min: 8, max: 12 }, targetRpeMax: 8, progressionEnabled: true };
}

function applyPrescription(sources, prescription, reviewRequired, objective) {
  const sets = reviewRequired ? 2 : objective === 'strength' ? prescription.setsPerExercise.min : prescription.setsPerExercise.max;
  const reps = reviewRequired ? prescription.reps.max : prescription.reps.max;
  return sources.map(({ routine }) => ({
    ...routine,
    ex: routine.ex.map(exercise => ({ ...exercise, sets: Math.min(sets, Math.max(1, exercise.sets)), reps, weight: 0 })),
  }));
}

function cycleFor(reviewRequired) {
  if (reviewRequired) return {
    status: 'review_required',
    progressionRule: null,
    weeks: [{ week: 1, phase: 'review', label: 'Revisión', volumePercent: 50, note: 'Borrador de baja intensidad; requiere revisión profesional antes de entrenar. Sin progresión automática.' }],
  };
  return {
    status: 'ready',
    progressionRule: {
      method: 'double_progression',
      topRepRequirement: 'two_consecutive_sessions',
      maxRpe: 8,
      loadIncrementKg: 2.5,
      incrementPhase: 'intensification',
      whenCriteriaNotMet: 'hold_load',
      note: 'Sube 1 repetición por serie dentro del rango. Incrementa 2,5 kg solo al cumplir el tope en dos sesiones seguidas con RPE ≤ 8; sin RPE, conserva la carga.',
    },
    weeks: [
      { week: 1, phase: 'base', label: 'Base', volumePercent: 100, note: 'Volumen base y técnica controlada.' },
      { week: 2, phase: 'progression', label: 'Progresión', volumePercent: 100, note: 'Añade repeticiones dentro del rango sin superar RPE 8.' },
      { week: 3, phase: 'intensification', label: 'Intensificación', volumePercent: 100, loadIncrementKg: 2.5, note: 'Aplica +2,5 kg solo si se cumplió el criterio de doble progresión; si no, conserva la carga.' },
      { week: 4, phase: 'deload', label: 'Descarga', volumePercent: 60, note: 'Reduce 40 % del volumen semanal; redondea series hacia abajo con un mínimo de una. No uses esta semana como base de progresión.' },
    ],
  };
}

function respectsRecovery(sources, days) {
  const muscleGroups = sources.map(({ routine }) => new Set(routine.ex.flatMap(exercise => {
    const metadata = EXIDX[exercise.id];
    return [metadata?.mg].filter(muscle => muscle && !AUXILIARY_GRIPS.has(muscle));
  })));
  for (let i = 0; i < days.length; i++) {
    for (let j = i + 1; j < days.length; j++) {
      const gap = Math.abs(days[i] - days[j]);
      const cyclicGap = Math.min(gap, 7 - gap);
      if (cyclicGap >= 2) continue;
      if ([...muscleGroups[i]].some(muscle => muscleGroups[j].has(muscle))) return false;
    }
  }
  return true;
}

export function generateGymTrackPlan(assessment, { id = `gtp_${Date.now().toString(36)}`, generatedAt = new Date().toISOString() } = {}) {
  if (!assessment || typeof assessment !== 'object') return { ok: false, status: 409, code: 'assessment-missing', error: 'No existe una evaluación guardada.' };
  if (assessment.planEntryGate?.status !== 'passed') return { ok: false, status: 409, code: 'plan-entry-gate-blocked', error: 'Completa los requisitos del PAR-Q y de elegibilidad antes de generar una rutina.', gate: assessment.planEntryGate || null };
  if (!['scored', 'provisional'].includes(assessment.levelStatus) || !['intermediate', 'advanced'].includes(assessment.level)) return { ok: false, status: 409, code: 'level-not-ready', error: 'Faltan datos para calcular un nivel y generar la rutina.' };

  const daysPerWeek = assessment.availability?.daysPerWeek;
  const days = Array.isArray(assessment.availability?.days) ? [...assessment.availability.days].sort((a, b) => a - b) : [];
  const objective = assessment.objective;
  if (!Number.isInteger(daysPerWeek) || daysPerWeek < 2 || daysPerWeek > 6 || days.length !== daysPerWeek || days.some(day => !Number.isInteger(day) || day < 0 || day > 6) || new Set(days).size !== days.length) {
    return { ok: false, status: 422, code: 'no-compatible-template', error: 'Los días disponibles no permiten construir una semana válida.' };
  }
  if (!OBJECTIVES.has(objective)) return { ok: false, status: 422, code: 'no-compatible-template', error: 'El objetivo registrado no tiene una plantilla GymTrack v1.' };

  const selected = assignPlanTemplate({ daysPerWeek, level: assessment.level, objective, templates: templateCatalog });
  if (!selected.ok) return { ok: false, status: 422, code: 'no-compatible-template', error: 'No encontramos una plantilla compatible con la evaluación.' };
  const equipment = selectedEquipment(assessment.availability?.equipment || []);
  let selectedTemplate = selected.template;
  let sources = assembleSplit(selectedTemplate.split, equipment);
  const usableSources = candidate => candidate && candidate.length === daysPerWeek
    && candidate.every(({ routine }) => Array.isArray(routine.ex) && routine.ex.length >= 3);
  if (!usableSources(sources)) {
    return { ok: false, status: 422, code: 'no-compatible-template', error: 'El equipo seleccionado no permite generar una rutina semanal con ejercicios suficientes.' };
  }
  let recoveryAdjusted = false;
  if (!respectsRecovery(sources, days)) {
    const fallbackSplit = daysPerWeek === 2 ? 'upper-lower-2' : daysPerWeek === 3 ? 'ppl' : null;
    const fallback = fallbackSplit ? assembleSplit(fallbackSplit, equipment) : null;
    if (!fallbackSplit || !usableSources(fallback) || !respectsRecovery(fallback, days)) {
      return { ok: false, status: 422, code: 'no-compatible-template', error: 'Los días elegidos no permiten espaciar los músculos principales por 48 horas, incluso con el split alternativo. Ajusta tu disponibilidad para generar la rutina.' };
    }
    selectedTemplate = { ...selected.template, id: `${selected.template.id}-${fallbackSplit}`, split: fallbackSplit };
    sources = fallback;
    recoveryAdjusted = true;
  }
  for (const { routine } of sources) {
    if (new Set(routine.ex.map(exercise => exercise.id)).size !== routine.ex.length || routine.ex.some(exercise => !EXIDX[exercise.id])) {
      return { ok: false, status: 422, code: 'no-compatible-template', error: 'La plantilla no supera la validación de ejercicios.' };
    }
  }
  const reviewRequired = assessment.planEntryGate.requiresLimitedIntensity === true;
  const prescription = prescriptionFor(objective, assessment.level, reviewRequired);
  const routines = applyPrescription(sources, prescription, reviewRequired, objective);
  const schedule = days.map((day, index) => ({ day, dayName: DAY_NAMES[day], routineId: routines[index].id }));
  const adaptations = adaptationDetails(sources, daysPerWeek);
  return {
    ok: true,
    plan: {
      id,
      schemaVersion: 1,
      status: reviewRequired ? 'review_required' : 'ready',
      reviewRequired,
      activationAllowed: !reviewRequired,
      generatedAt,
      sourceAssessmentUpdatedAt: assessment.updatedAt,
      level: assessment.level,
      levelStatus: assessment.levelStatus,
      levelPoints: assessment.levelPoints ?? null,
      objective,
      daysPerWeek,
      days,
      equipment: assessment.availability?.equipment || [],
      sessionMinutes: Number.isInteger(assessment.availability?.minutes) ? assessment.availability.minutes : null,
      template: {
        id: selectedTemplate.id,
        split: selectedTemplate.split,
        exact: selected.exact,
        changes: recoveryAdjusted ? ['split-for-48-hour-recovery'] : selected.changes,
      },
      prescription,
      routines,
      schedule,
      adaptations,
      cycle: cycleFor(reviewRequired),
      notes: reviewRequired
        ? ['Respuestas positivas en PAR-Q: borrador de baja intensidad, pendiente de revisión profesional. No aplicar ni iniciar automáticamente.']
        : [
          'Rutina inicial heurística GymTrack v1; ajústala según técnica, recuperación y respuesta individual.',
          'La asignación evita repetir el músculo principal antes de 48 horas.',
          ...(recoveryAdjusted ? ['Se eligió un split alternativo para respetar los días consecutivos de disponibilidad.'] : []),
        ],
    },
  };
}
