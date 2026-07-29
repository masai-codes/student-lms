import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import type { AgentHand } from '../agenthand'
import { launchBrowser, openSession } from '../agenthand'

/**
 * Flow: `onboarding-fees-unpaid`
 * LMS Walkthrough test bed: 3 playable videos + profile photo + download app,
 * none pre-ticked; program tab locked (fees unpaid) with a payment countdown.
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
  })
  afterAll(async () => {
    await hand?.close()
    await browser?.close()
  })

  it('opens the LMS Walkthrough tour with a video step and segments', async () => {
    expect(await hand.hasTestId('guided-tour-video')).toBe(true)
    expect(await hand.hasTestId('guided-tour-video-segments')).toBe(true)
    // 3 seeded LMS videos → 3 lecture step entries.
    const videoSteps = await hand.countTestIdStartsWith(
      'guided-tour-step-lecture-',
    )
    expect(videoSteps).toBe(3)
  })

  it('has profile-photo + download-app steps, none pre-completed', async () => {
    expect(await hand.hasTestId('guided-tour-step-profile-photo')).toBe(true)
    expect(await hand.hasTestId('guided-tour-step-download-app')).toBe(true)
    // Nothing ticked yet — no per-step "-done" markers.
    expect(
      await hand.countTestIdStartsWith('guided-tour-step-'),
    ).toBeGreaterThan(0)
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
})
