import { describe, expect, it } from 'vitest'
import { progressReassessmentStatus } from './gymtrack-reassessment.js'

const plan = { generatedAt: '2026-01-01T12:00:00.000Z' }
const workout = (d, kind = 'up') => ({
  d,
  routineIds: ['gt-routine'],
  entries: [{ rid: 'gt-routine', plan: { kind } }],
})
const state = workouts => ({ routines: [{ id: 'gt-routine', gymtrack: { planId: 'p1' } }], workouts })

describe('reevaluación GymTrack por progreso', () => {
  it('se activa con dos progresiones separadas por al menos dos semanas', () => {
    expect(progressReassessmentStatus(state([
      workout('2026-01-05'), workout('2026-01-20'),
    ]), { plan })).toMatchObject({ due: true, reason: 'progress', sessions: 2 })
  })

  it('no se activa con una sola progresión o sesiones demasiado cercanas', () => {
    expect(progressReassessmentStatus(state([workout('2026-01-05')]), { plan }).due).toBe(false)
    expect(progressReassessmentStatus(state([
      workout('2026-01-05'), workout('2026-01-10'),
    ]), { plan }).due).toBe(false)
  })

  it('ignora rutinas ajenas y entradas sin una subida explícita', () => {
    const result = progressReassessmentStatus({
      routines: [{ id: 'gt-routine', gymtrack: { planId: 'p1' } }, { id: 'other' }],
      workouts: [
        workout('2026-01-05', 'hold'),
        { d: '2026-01-20', routineIds: ['other'], entries: [{ rid: 'other', plan: { kind: 'up' } }] },
      ],
    }, { plan })
    expect(result).toMatchObject({ due: false, sessions: 0 })
  })

  it('reinicia el periodo de progreso después de confirmar la reevaluación', () => {
    const result = progressReassessmentStatus(state([
      workout('2026-01-05'), workout('2026-01-20'),
    ]), { plan, reevaluation: { lastAt: '2026-01-21T12:00:00.000Z' } })
    expect(result).toMatchObject({ due: false, sessions: 0 })
  })
})
