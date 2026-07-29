import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import type { AgentHand } from '../agenthand'
import { launchBrowser, openSession } from '../agenthand'

/**
 * Flow: `onboarding-complete`
 * Every onboarding step done. The guided tour does NOT auto-open on `/`
 * (onboarding complete) — the normal dashboard renders with no onboarding
 * banner. Forcing it open via `?guidedTour=open` shows the completion banner
 * with every step marked done and the program tab unlocked.
 */
const FLOW_ID = 'onboarding-complete'

describe(FLOW_ID, () => {
  let browser: Browser
  let hand: AgentHand

  beforeAll(async () => {
    browser = await launchBrowser()
    hand = await openSession(browser)
  })
  afterAll(async () => {
    await hand?.close()
    await browser?.close()
  })

  it('renders the dashboard (no auto-opened tour, no onboarding banner) on /', async () => {
    await hand.loginAs(FLOW_ID, '/')
    await hand.waitForTestId('dashboard-root')
    expect(await hand.hasTestId('guided-tour-overlay')).toBe(false)
    expect(await hand.hasTestId('dashboard-onboarding-banner')).toBe(false)
  })

  it('shows the completion banner with all steps done when forced open', async () => {
    await hand.goto('/?guidedTour=open')
    await hand.waitForTestId('guided-tour-overlay')
    expect(await hand.hasTestId('guided-tour-complete-banner')).toBe(true)
    expect(await hand.hasTestId('guided-tour-complete-cta')).toBe(true)
    // Program tab unlocked; every step carries a "-done" marker.
    expect(await hand.attrOf('guided-tour-tab-program', 'data-locked')).toBe(
      'false',
    )
    const doneMarkers = await hand.countTestIdStartsWith('guided-tour-step-')
    const done = await hand.page.$$eval(
      '[data-testid^="guided-tour-step-"][data-testid$="-done"]',
      (nodes) => nodes.length,
    )
    expect(doneMarkers).toBeGreaterThan(0)
    expect(done).toBeGreaterThanOrEqual(3)
  })
})
