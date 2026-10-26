import { describe, expect, it } from 'vitest'
import { applyGymTrackPlan, getPlanApplicationPreview } from './gymtrack-apply.js'

const plan = {
  status: 'ready', reviewRequired: false, activationAllowed: true,
  routines: [{ id: 'gt-a', name: 'GymTrack A', ex: [] }, { id: 'gt-b', name: 'GymTrack B', ex: [] }],
  schedule: [{ day: 1, routineId: 'gt-a' }, { day: 3, routineId: 'gt-b' }],
}
const state = over => ({
  routines: [{ id: 'old', name: 'Rutina existente', ex: [] }],
  week: { 0: ['old'], 1: ['old'], 6: ['keep'] },
  queue: { ids: ['old'] }, rotation: { id: 'rotation-1', sequence: ['old'], label: 'Mi rotación' }, scheduleMode: 'rotation',
  ...over,
})

describe('GymTrack Aplicar Plan', () => {
  it('agrega las rutinas nuevas, cambia solo los días P9 y conserva estado fuera del alcance', () => {
    const current = state()
    const before = { queue: current.queue, rotation: current.rotation, scheduleMode: current.scheduleMode }
    const result = applyGymTrackPlan(current, plan)
    expect(result.ok).toBe(true)
    expect(result.firstRoutineId).toBe('gt-a')
    expect(current.routines.map(routine => routine.id)).toEqual(['old', 'gt-a', 'gt-b'])
    expect(current.routines.slice(1).every(routine => routine.gymtrack)).toBe(true)
    expect(current.week).toEqual({ 0: ['old'], 1: ['gt-a'], 3: ['gt-b'], 6: ['keep'] })
    expect(current.queue).toBe(before.queue)
    expect(current.rotation).toBe(before.rotation)
    expect(current.scheduleMode).toBe('rotation')
  })

  it('detecta las colisiones sin modificar el estado', () => {
    const current = state()
    const preview = getPlanApplicationPreview(plan, current)
    expect(preview.collisions.map(slot => slot.day)).toEqual([1])
    expect(current.week[1]).toEqual(['old'])
  })

  it('no duplica rutinas del mismo plan si se aplica otra vez', () => {
    const current = state({ routines: [{ id: 'gt-a', name: 'GymTrack A', ex: [] }] })
    applyGymTrackPlan(current, plan)
    expect(current.routines.map(routine => routine.id)).toEqual(['gt-a', 'gt-b'])
  })

  it('bloquea review_required antes de tocar rutinas o semana', () => {
    const current = state()
    const before = JSON.stringify(current)
    const result = applyGymTrackPlan(current, { ...plan, status: 'review_required', reviewRequired: true, activationAllowed: false })
    expect(result).toEqual({ ok: false, code: 'review-required' })
    expect(JSON.stringify(current)).toBe(before)
  })
})
