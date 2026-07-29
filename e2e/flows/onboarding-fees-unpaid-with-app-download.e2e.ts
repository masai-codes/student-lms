import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import type { AgentHand } from '../agenthand'
import { launchBrowser, openSession } from '../agenthand'
import {
  closeGuidedTour,
  completeAllWalkthroughVideos,
  completeProfilePhotoStep,
} from './onboardingWalkthroughHelpers'

/**
 * Flow: `onboarding-fees-unpaid-with-app-download`
 * Same as fees-unpaid, but download-app is pre-completed via a seeded device
 * token. After videos + profile photo, every LMS Walkthrough step is done and
 * the onboarding reminder banner is gone from the dashboard.
 */
const FLOW_ID = 'onboarding-fees-unpaid-with-app-download'

describe(FLOW_ID, () => {
  let browser: Browser
  let hand: AgentHand

  beforeAll(async () => {
    browser = await launchBrowser()
    hand = await openSession(browser)
    await hand.loginAs(FLOW_ID, '/')
    await hand.waitForTestId('guided-tour-overlay')
  }, 120_000)

  afterAll(async () => {
    await hand?.close()
    await browser?.close()
  })

  it('opens the tour with download-app already marked done', async () => {
    await hand.waitForTestId('guided-tour-video')
    expect(await hand.hasTestId('guided-tour-step-download-app-done')).toBe(
      true,
    )
    expect(await hand.hasTestId('guided-tour-tab-program-lock')).toBe(true)
  })

  it('completes videos + photo, then the onboarding banner is gone from the dashboard', async () => {
    await completeAllWalkthroughVideos(hand)
    await completeProfilePhotoStep(hand)

    // All LMS steps should now carry a -done marker (3 videos + photo + app).
    const done = await hand.page.$$eval(
      '[data-testid^="guided-tour-step-"][data-testid$="-done"]',
      (nodes) => nodes.length,
    )
    expect(done).toBeGreaterThanOrEqual(5)

    await closeGuidedTour(hand)
    await hand.waitForTestId('dashboard-root')

    // Payment timer may still show (fees unpaid), but onboarding steps banner
    // should be gone — nothing left to finish on the LMS walkthrough.
    expect(await hand.isTestIdAbsent('dashboard-onboarding-banner', 3000)).toBe(
      true,
    )
    expect(
      await hand.attrOf('dashboard-fee-payment-banner', 'data-variant'),
    ).toBe('timer')
  }, 180_000)
})
