import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import type { AgentHand } from '../agenthand'
import { launchBrowser, openSession } from '../agenthand'

/**
 * Flow: `onboarding-fees-overdue`
 * Fee deadline passed without full payment. The tour opens (LMS incomplete),
 * the program tab is locked, and the fee-payment banner is in the OVERDUE
 * (red) variant with "N days overdue" copy.
 */
const FLOW_ID = 'onboarding-fees-overdue'

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

  it('shows the fee-payment banner in the OVERDUE variant', async () => {
    expect(
      await hand.attrOf('dashboard-fee-payment-banner', 'data-variant'),
    ).toBe('overdue')
    expect(
      (await hand.textOf('dashboard-fee-payment-days')).toLowerCase(),
    ).toContain('overdue')
    expect(await hand.hasTestId('dashboard-fee-payment-cta')).toBe(true)
  })

  it('keeps the program tab locked', async () => {
    expect(await hand.hasTestId('guided-tour-tab-program-lock')).toBe(true)
    expect(await hand.attrOf('guided-tour-tab-program', 'data-locked')).toBe(
      'true',
    )
  })
})
