// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api.js', () => ({ api: vi.fn() }))

import GymTrackRoutine from './GymTrackRoutine.jsx'
import { api } from '../lib/api.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let root, host

const assessment = {
  level: 'intermediate', levelStatus: 'scored', levelPoints: 4,
  eligibility: { status: 'eligible', eligible: true, missing: [], reasons: [] },
  parqSummary: { complete: true, hasPositive: false, missing: [] },
  planEntryGate: { status: 'passed', passed: true, blockingReasons: [], requiresLimitedIntensity: false },
}
const weeks = [
  { week: 1, phase: 'base', label: 'Base', volumePercent: 100, note: 'Técnica controlada.' },
  { week: 2, phase: 'progression', label: 'Progresión', volumePercent: 100, note: 'Añade repeticiones.' },
  { week: 3, phase: 'intensification', label: 'Intensificación', volumePercent: 100, note: 'Sube carga si cumple el criterio.' },
  { week: 4, phase: 'deload', label: 'Descarga', volumePercent: 60, note: 'Reduce el volumen.' },
]
const plan = overrides => ({
  id: 'gtp_test', schemaVersion: 1, status: 'ready', reviewRequired: false, activationAllowed: true,
  level: 'intermediate', levelStatus: 'scored', levelPoints: 4, objective: 'hypertrophy',
  daysPerWeek: 3, days: [1, 3, 5], sessionMinutes: 60, equipment: ['dumbbell'],
  template: { id: 'gymtrack-v1-3-intermediate-hypertrophy', split: 'full-body', exact: true, changes: [] },
  prescription: { setsPerExercise: { min: 3, max: 3 }, reps: { min: 8, max: 12 }, targetRpeMax: 8, progressionEnabled: true },
  routines: [
    { id: 'r1', name: 'Cuerpo completo A', ex: [{ id: '3948', sets: 3, reps: 12, weight: 0 }] },
    { id: 'r2', name: 'Cuerpo completo B', ex: [{ id: '3948', sets: 3, reps: 12, weight: 0 }] },
    { id: 'r3', name: 'Cuerpo completo C', ex: [{ id: '3948', sets: 3, reps: 12, weight: 0 }] },
  ],
  schedule: [
    { day: 1, dayName: 'lunes', routineId: 'r1' },
    { day: 3, dayName: 'miércoles', routineId: 'r2' },
    { day: 5, dayName: 'viernes', routineId: 'r3' },
  ],
  adaptations: { swapped: 1, dropped: 0, details: [{ type: 'substituted', routineName: 'Cuerpo completo A', exerciseId: '0025', replacementId: '3948' }] },
  cycle: { status: 'ready', progressionRule: { note: 'Sube carga solo tras dos sesiones en el tope con RPE ≤ 8.' }, weeks },
  notes: ['Rutina inicial GymTrack v1.'],
  ...overrides,
})

function button(label) {
  return [...host.querySelectorAll('button')].find(element => element.textContent.trim() === label)
}

async function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  await act(async () => {
    root.render(<MemoryRouter initialEntries={['/gymtrack/routine']}><GymTrackRoutine /></MemoryRouter>)
    await Promise.resolve()
  })
}

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => {
  if (root) act(() => root.unmount())
  host?.remove()
  root = null
  host = null
})

describe('GymTrackRoutine', () => {
  it('muestra la rutina, el ciclo de cuatro semanas y los ajustes, sin aplicar a la semana activa', async () => {
    api.mockImplementation(path => Promise.resolve(path.endsWith('/assessment') ? { assessment } : { plan: plan(), stale: false }))
    await mount()
    expect(host.textContent).toContain('Semana personalizada')
    expect(host.textContent).toContain('lunes')
    expect(host.textContent).toContain('Base')
    expect(host.textContent).toContain('Progresión')
    expect(host.textContent).toContain('Intensificación')
    expect(host.textContent).toContain('Descarga')
    expect(host.textContent).toContain('3 series × 8–12 repeticiones')
    expect(host.textContent).toContain('Ajustes por equipamiento')
    expect(host.textContent).toContain('no modifica tu semana activa')
    expect(button('Aplicar Plan')).toBeUndefined()
  })

  it('señala PAR-Q positivo como borrador de baja intensidad sin acción para activarlo', async () => {
    const reviewAssessment = {
      ...assessment,
      parqSummary: { complete: true, hasPositive: true, missing: [] },
      planEntryGate: { ...assessment.planEntryGate, requiresLimitedIntensity: true, consultationRecommended: true },
    }
    const reviewPlan = plan({
      status: 'review_required', reviewRequired: true, activationAllowed: false,
      prescription: { setsPerExercise: { min: 1, max: 2 }, reps: { min: 10, max: 15 }, targetRpeMax: 5, progressionEnabled: false },
      cycle: { status: 'review_required', progressionRule: null, weeks: [{ week: 1, phase: 'review', label: 'Revisión', volumePercent: 50, note: 'Requiere revisión profesional.' }] },
    })
    api.mockImplementation(path => Promise.resolve(path.endsWith('/assessment') ? { assessment: reviewAssessment } : { plan: reviewPlan, stale: false }))
    await mount()
    expect(host.querySelector('[data-gt-review]')?.textContent).toContain('borrador de baja intensidad')
    expect(host.textContent).toContain('revisión profesional')
    expect(host.textContent).toContain('RPE máximo 5')
    expect(host.textContent).toContain('Revisión')
    expect(host.textContent).not.toContain('Intensificación')
    expect(button('Aplicar Plan')).toBeUndefined()
  })

  it('solo crea el primer plan tras una acción explícita de la persona', async () => {
    api.mockImplementation((path, options) => {
      if (path.endsWith('/assessment')) return Promise.resolve({ assessment })
      if (options?.method === 'POST') return Promise.resolve({ plan: plan(), stale: false, created: true })
      return Promise.resolve({ plan: null, stale: false })
    })
    await mount()
    expect(button('Generar mi rutina')).toBeTruthy()
    expect(api).toHaveBeenCalledWith('/api/gymtrack/plan')
    expect(api.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false)
    await act(async () => { button('Generar mi rutina').click(); await Promise.resolve(); await Promise.resolve() })
    expect(api).toHaveBeenCalledWith('/api/gymtrack/plan', { method: 'POST' })
    expect(host.textContent).toContain('Semana personalizada')
  })

  it('solo regenera un plan obsoleto tras confirmar con regenerate=true', async () => {
    api.mockImplementation((path, options) => {
      if (path.endsWith('/assessment')) return Promise.resolve({ assessment })
      if (options?.method === 'POST') return Promise.resolve({ plan: plan({ id: 'gtp_new' }), stale: false, created: true })
      return Promise.resolve({ plan: plan(), stale: true })
    })
    await mount()
    expect(host.querySelector('[data-gt-stale]')).toBeTruthy()
    expect(button('Regenerar rutina')).toBeTruthy()
    expect(api.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false)
    await act(async () => { button('Regenerar rutina').click(); await Promise.resolve(); await Promise.resolve() })
    expect(api).toHaveBeenCalledWith('/api/gymtrack/plan', { method: 'POST', body: JSON.stringify({ regenerate: true }) })
    expect(host.querySelector('[data-gt-stale]')).toBeNull()
  })

  it('bloquea generación cuando PAR-Q/eligibilidad no pasan y enlaza a corregir los datos', async () => {
    const blocked = {
      ...assessment,
      eligibility: { status: 'ineligible', eligible: false, missing: [], reasons: ['training-duration-under-6-months'] },
      parqSummary: { complete: false, hasPositive: false, missing: ['medication'] },
      planEntryGate: { status: 'blocked', passed: false, blockingReasons: ['training-duration-under-6-months', 'parq-incomplete'], requiresLimitedIntensity: false },
    }
    api.mockImplementation(path => Promise.resolve(path.endsWith('/assessment') ? { assessment: blocked } : { plan: null, stale: false }))
    await mount()
    expect(host.textContent).toContain('Necesitas al menos 6 meses')
    expect(host.textContent).toContain('Completa todas las preguntas del PAR-Q')
    expect(button('Completar PAR-Q')).toBeTruthy()
    expect(button('Revisar experiencia')).toBeTruthy()
    expect(button('Generar mi rutina')).toBeUndefined()
    expect(api.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false)
  })

  it('presenta el error del servidor por calendario/equipo y permite corregir disponibilidad', async () => {
    api.mockImplementation((path, options) => {
      if (path.endsWith('/assessment')) return Promise.resolve({ assessment })
      if (options?.method === 'POST') return Promise.reject(Object.assign(new Error('incompatible'), {
        status: 422,
        data: { code: 'no-compatible-template', error: 'Los días elegidos no permiten espaciar los músculos por 48 horas.' },
      }))
      return Promise.resolve({ plan: null, stale: false })
    })
    await mount()
    await act(async () => { button('Generar mi rutina').click(); await Promise.resolve(); await Promise.resolve() })
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Los días elegidos no permiten espaciar')
    expect(button('Ajustar disponibilidad o equipo')).toBeTruthy()
  })
})
