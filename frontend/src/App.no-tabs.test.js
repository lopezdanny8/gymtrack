// The Android app's first-launch card ("How do you want to use GymTrack?") showed the tab bar under
// it, and a tap on a tab changed the route behind the card and stacked history entries for back to
// walk through. Shell is not rendered in a test, so this reads the condition from the source.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8')
const summary = readFileSync(new URL('./views/GymTrackSummary.jsx', import.meta.url), 'utf8')
const routes = JSON.parse(readFileSync(new URL('../public/manus-routes.json', import.meta.url), 'utf8'))

describe('the tab bar', () => {
  it('stays away from the first-launch onboarding', () => {
    const cond = app.match(/const noTabs = ([^\n]+)/)?.[1] || ''
    expect(cond).toContain('needsMobileOnboarding')
    expect(app).toMatch(/\{!noTabs && <TabBar /)
  })

  it('exposes the GymTrack weekly routine only on Web and links to it from the summary', () => {
    const cond = app.match(/const noTabs = ([^\n]+)/)?.[1] || ''
    expect(app).toContain('{!MOBILE && <Route path="/gymtrack/routine" element={<GymTrackRoutine />} />}')
    expect(cond).toContain("loc.pathname === '/gymtrack/routine'")
    expect(summary).toContain("navigate('/gymtrack/routine')")
    expect(summary).toContain('!MOBILE')
    expect(routes.routes.map(route => route.path)).toContain('/gymtrack/routine')
  })
})
