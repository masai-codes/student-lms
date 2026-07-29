import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import type { AgentHand } from '../agenthand'
import { launchBrowser, openSession } from '../agenthand'

/**
 * Flow: `onboarding-fees-paid`
 * Full fees paid → Program Onboarding tab UNLOCKED and no fee-payment banner.
 *
 * Note: the Documents / Student-Kit / ID-card steps are driven by the external
 * onward admissions API (`ADMISSIONS_API_BASE_URL`/`_KEY`), which is unset in a
 * plain `seed:all` dev setup, so those sub-steps do not render here. This spec
 * asserts the observable "fees paid" difference (unlocked program tab, no fee
 * banner); the docs/kit/id-card states are covered by unit tests.
 */
const FLOW_ID = 'onboarding-fees-paid'

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

  it('unlocks the Program Onboarding tab', async () => {
    expect(await hand.attrOf('guided-tour-tab-program', 'data-locked')).toBe(
      'false',
    )
    expect(await hand.hasTestId('guided-tour-tab-program-lock')).toBe(false)
  })

  it('shows no fee-payment banner (fees are paid)', async () => {
    expect(await hand.hasTestId('dashboard-fee-payment-banner')).toBe(false)
  })

  it('still has the LMS walkthrough with videos', async () => {
    expect(await hand.hasTestId('guided-tour-video')).toBe(true)
    const videoSteps = await hand.countTestIdStartsWith(
      'guided-tour-step-lecture-',
    )
    expect(videoSteps).toBeGreaterThanOrEqual(1)
  })
})
