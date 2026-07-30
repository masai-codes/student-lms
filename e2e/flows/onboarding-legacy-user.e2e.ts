import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import type { AgentHand } from '../agenthand'
import { launchBrowser, openSession } from '../agenthand'

/**
 * Flow: `onboarding-legacy-user`
 * Enrolled student with NO admission row. The current app treats this as the
 * *lite* guided tour: profile-photo + download-app only, program tab unlocked,
 * no LMS videos, no welcome modal, no fee banner.
 */
const FLOW_ID = 'onboarding-legacy-user'

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

  it('opens the lite guided tour with an unlocked program tab', async () => {
    expect(await hand.hasTestId('guided-tour-tab-lms')).toBe(true)
    expect(await hand.hasTestId('guided-tour-tab-program')).toBe(true)
    expect(await hand.attrOf('guided-tour-tab-program', 'data-locked')).toBe(
      'false',
    )
    expect(await hand.hasTestId('guided-tour-tab-program-lock')).toBe(false)
  })

  it('shows only profile-photo + download-app steps (no LMS videos)', async () => {
    expect(await hand.hasTestId('guided-tour-step-profile-photo')).toBe(true)
    expect(await hand.hasTestId('guided-tour-step-download-app')).toBe(true)
    expect(await hand.hasTestId('guided-tour-video')).toBe(false)
  })

  it('shows no welcome modal and no fee-payment banner', async () => {
    expect(await hand.hasTestId('welcome-modal')).toBe(false)
    expect(await hand.hasTestId('dashboard-fee-payment-banner')).toBe(false)
  })
})
