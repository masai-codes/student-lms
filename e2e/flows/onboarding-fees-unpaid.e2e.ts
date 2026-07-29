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
 * Flow: `onboarding-fees-unpaid`
 * LMS Walkthrough test bed: 3 playable videos + profile photo + download app,
 * none pre-ticked; program tab locked (fees unpaid) with a payment countdown.
 *
 * Full interaction parity with the Stagehand flow: play all videos, capture a
 * profile photo, close the panel, assert dashboard nudge banners, then Finish
 * Now to reopen the tour.
 */
const FLOW_ID = 'onboarding-fees-unpaid'

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

  it('opens the LMS Walkthrough tour with a video step and segments', async () => {
    // Lectures load async after the overlay mounts.
    await hand.waitForTestId('guided-tour-video')
    expect(await hand.hasTestId('guided-tour-video-segments')).toBe(true)
    const videoSteps = await hand.countTestIdStartsWith(
      'guided-tour-step-lecture-',
    )
    // 3 steps + any already-done markers from a prior partial run.
    expect(videoSteps).toBeGreaterThanOrEqual(3)
  })

  it('has profile-photo + download-app steps, none pre-completed', async () => {
    expect(await hand.hasTestId('guided-tour-step-profile-photo')).toBe(true)
    expect(await hand.hasTestId('guided-tour-step-download-app')).toBe(true)
    expect(await hand.hasTestId('guided-tour-step-download-app-done')).toBe(
      false,
    )
  })

  it('locks the program tab and shows a fee-payment timer', async () => {
    expect(await hand.hasTestId('guided-tour-tab-program-lock')).toBe(true)
    expect(
      await hand.attrOf('dashboard-fee-payment-banner', 'data-variant'),
    ).toBe('timer')
  })

  it('plays all 3 walkthrough videos, completes profile photo, then Finish Now returns to the tour', async () => {
    await completeAllWalkthroughVideos(hand)
    await completeProfilePhotoStep(hand)

    // Download-app is still incomplete (no device token in this seed).
    expect(await hand.hasTestId('guided-tour-step-download-app-done')).toBe(
      false,
    )

    await closeGuidedTour(hand)
    await hand.waitForTestId('dashboard-root')

    // Payment nudge + onboarding steps banner on the plain dashboard.
    expect(
      await hand.attrOf('dashboard-fee-payment-banner', 'data-variant'),
    ).toBe('timer')
    await hand.waitForTestId('dashboard-onboarding-banner')
    expect(await hand.hasTestId('dashboard-onboarding-banner-resume')).toBe(
      true,
    )

    // "Finish Now" reopens the guided tour.
    await hand.clickTestIdDirect('dashboard-onboarding-banner-resume')
    await hand.waitForTestId('guided-tour-overlay')
  }, 180_000)
})
