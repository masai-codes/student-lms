import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import type { AgentHand } from '../agenthand'
import { launchBrowser, openSession } from '../agenthand'

/**
 * Flow: `onboarding-welcome-modal`
 * New-journey student who has NOT seen the welcome modal. Distinguishing state:
 * the welcome modal is shown on first login. Behind it, the full LMS tour is
 * active with the program tab locked (fees unpaid) and a fee-payment timer.
 */
const FLOW_ID = 'onboarding-welcome-modal'

describe(FLOW_ID, () => {
  let browser: Browser
  let hand: AgentHand

  beforeAll(async () => {
    browser = await launchBrowser()
    hand = await openSession(browser)
    await hand.loginAs(FLOW_ID, '/')
  })
  afterAll(async () => {
    await hand?.close()
    await browser?.close()
  })

  it('shows the welcome modal on first login', async () => {
    await hand.waitForTestId('welcome-modal')
    expect(await hand.hasTestId('welcome-modal-get-started')).toBe(true)
  })

  it('has the LMS tour with videos and a locked program tab behind the modal', async () => {
    expect(await hand.hasTestId('guided-tour-overlay')).toBe(true)
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
    expect(
      (await hand.textOf('dashboard-fee-payment-days')).toLowerCase(),
    ).toContain('remaining')
  })
})
