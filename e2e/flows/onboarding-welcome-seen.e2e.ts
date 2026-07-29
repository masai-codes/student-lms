import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import type { AgentHand } from '../agenthand'
import { launchBrowser, openSession } from '../agenthand'

/**
 * Flow: `onboarding-welcome-seen`
 * Same as `onboarding-welcome-modal` EXCEPT the welcome modal was already
 * dismissed — so it must NOT appear; the tour opens directly. Program tab
 * locked (fees unpaid) with a fee-payment timer.
 */
const FLOW_ID = 'onboarding-welcome-seen'

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

  it('does NOT show the welcome modal', async () => {
    expect(await hand.hasTestId('welcome-modal')).toBe(false)
  })

  it('opens the LMS tour directly with a locked program tab', async () => {
    expect(await hand.hasTestId('guided-tour-video')).toBe(true)
    expect(await hand.hasTestId('guided-tour-tab-program-lock')).toBe(true)
    expect(await hand.attrOf('guided-tour-tab-program', 'data-locked')).toBe(
      'true',
    )
  })

  it('shows a fee-payment timer banner (not overdue)', async () => {
    expect(
      await hand.attrOf('dashboard-fee-payment-banner', 'data-variant'),
    ).toBe('timer')
  })
})
