const dayKey = day => String(day)

export function routineIdsOnDay(value) {
  if (Array.isArray(value)) return value.filter(id => typeof id === 'string' && id)
  return typeof value === 'string' && value ? [value] : []
}

export function planSchedule(plan) {
  return Array.isArray(plan?.schedule)
    ? plan.schedule.filter(slot => Number.isInteger(slot?.day) && typeof slot?.routineId === 'string' && slot.routineId)
    : []
}

export function getPlanApplicationPreview(plan, state) {
  const schedule = planSchedule(plan)
  const week = state?.week && typeof state.week === 'object' ? state.week : {}
  const collisions = schedule
    .map(slot => ({ ...slot, existingRoutineIds: routineIdsOnDay(week[dayKey(slot.day)]) }))
    .filter(slot => slot.existingRoutineIds.length > 0)
  return {
    days: schedule.map(slot => slot.day),
    schedule,
    collisions,
    routinesToAdd: (plan?.routines || []).filter(routine => routine && typeof routine.id === 'string' && routine.id && !(state?.routines || []).some(existing => existing?.id === routine.id)),
  }
}

export function applyGymTrackPlan(state, plan) {
  if (!state || !plan || plan.status === 'review_required' || plan.reviewRequired === true || plan.activationAllowed === false) {
    return { ok: false, code: 'review-required' }
  }
  const preview = getPlanApplicationPreview(plan, state)
  if (!preview.schedule.length || !Array.isArray(plan.routines)) return { ok: false, code: 'invalid-plan' }
  state.routines = Array.isArray(state.routines) ? state.routines : []
  for (const routine of preview.routinesToAdd) state.routines.push(routine)
  state.week = { ...(state.week && typeof state.week === 'object' ? state.week : {}) }
  for (const slot of preview.schedule) state.week[dayKey(slot.day)] = [slot.routineId]
  return { ok: true, days: preview.days, addedRoutineIds: preview.routinesToAdd.map(routine => routine.id) }
}
