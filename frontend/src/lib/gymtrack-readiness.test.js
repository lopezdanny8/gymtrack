import { describe, expect, it } from 'vitest'
import { gymTrackReadiness } from './gymtrack-readiness.js'

const safe = { fatigueMax: 0, sleepHours: 8, painLevel: 0, parqComplete: true, parqPositive: false }

describe('semáforo GymTrack', () => {
  it('devuelve verde solo cuando los factores están completos y sin alertas', () => {
    expect(gymTrackReadiness(safe)).toMatchObject({ color: 'green', label: 'Verde' })
  })

  it.each([
    ['PAR-Q positivo', { parqPositive: true }, 'yellow'],
    ['dolor leve', { painLevel: 4 }, 'yellow'],
    ['recuperación pendiente', { fatigueMax: 0.3 }, 'yellow'],
    ['sueño corto', { sleepHours: 6.5 }, 'yellow'],
  ])('usa amarillo para %s', (_name, patch, color) => {
    expect(gymTrackReadiness({ ...safe, ...patch }).color).toBe(color)
  })

  it.each([
    ['PAR-Q incompleto', { parqComplete: false }],
    ['dolor intenso', { painLevel: 7 }],
    ['fatiga alta', { fatigueMax: 0.51 }],
    ['menos de seis horas', { sleepHours: 5.5 }],
  ])('usa rojo para %s', (_name, patch) => {
    expect(gymTrackReadiness({ ...safe, ...patch }).color).toBe('red')
  })

  it('explica los datos faltantes en vez de asumir que todo está bien', () => {
    const result = gymTrackReadiness({ parqComplete: true })
    expect(result.color).toBe('yellow')
    expect(result.reasons.join(' ')).toContain('dolor')
    expect(result.reasons.join(' ')).toContain('sueño')
  })
})
