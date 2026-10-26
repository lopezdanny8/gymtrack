import { beforeEach, describe, expect, it } from 'vitest'
import { clearGymTrackDraft, readGymTrackDraft, writeGymTrackDraft } from './gymtrack-onboarding-draft.js'

describe('borradores locales de onboarding GymTrack', () => {
  beforeEach(() => {
    const values = new Map()
    globalThis.localStorage = {
      getItem: key => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: key => values.delete(key),
      clear: () => values.clear(),
    }
  })

  it('guarda y mezcla el borrador con los valores iniciales', () => {
    writeGymTrackDraft('profile', { weightKg: 82 })
    expect(readGymTrackDraft('profile', { biologicalSex: 'male', weightKg: '' })).toEqual({ biologicalSex: 'male', weightKg: 82 })
  })

  it('ignora JSON corrupto y estructuras que no son objetos', () => {
    globalThis.localStorage.setItem('gymtrack_onboarding_draft_v1:experience', '{bad')
    expect(readGymTrackDraft('experience', { months: '' })).toEqual({ months: '' })
    globalThis.localStorage.setItem('gymtrack_onboarding_draft_v1:experience', '[]')
    expect(readGymTrackDraft('experience', { months: '' })).toEqual({ months: '' })
  })

  it('limpia solo la pantalla solicitada', () => {
    writeGymTrackDraft('profile', { weightKg: 80 })
    writeGymTrackDraft('parq', { dizziness: false })
    clearGymTrackDraft('profile')
    expect(readGymTrackDraft('profile', {})).toEqual({})
    expect(readGymTrackDraft('parq', {})).toEqual({ dizziness: false })
  })
})
