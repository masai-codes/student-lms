import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import { launchBrowser, openSession } from '../agenthand'
import { getFlowState } from '../agenthand/seedState'

/**
 * Flow: `login-and-join-lecture`
 * Seeded world: one live lecture scheduled ~now (join window open), student
 * enrolled. Asserts the student can reach the lecture from the learn listing
 * and sees an active "Join live" CTA on the detail page.
 */
const FLOW_ID = 'login-and-join-lecture'

describe(FLOW_ID, () => {
  let browser: Browser
  const state = getFlowState(FLOW_ID)
  const lectureId = state.entityIds.lectureId

  beforeAll(async () => {
    browser = await launchBrowser()
  })
  afterAll(async () => {
    await browser?.close()
  })

  it('shows the live lecture in the learn listing with a Join Live CTA', async () => {
    const hand = await openSession(browser)
    try {
      await hand.loginAs(FLOW_ID, '/learn')
      await hand.waitForTestId('learn-content-list')
      const rows = await hand.countTestId('lecture-list-item')
      expect(rows).toBeGreaterThan(0)
      expect(await hand.hasTestId('learn-listing-join-live-cta')).toBe(true)
    } finally {
      await hand.close()
    }
  })

  it('shows an active Join Live session card on the lecture detail page', async () => {
    expect(lectureId, 'seed-state must carry lectureId').toBeTruthy()
    const hand = await openSession(browser)
    try {
      await hand.loginAs(FLOW_ID, `/lectures/${lectureId}`)
      await hand.waitForTestId('lecture-join-live-card')
      const cta = await hand.waitForTestId('lecture-join-live-cta')
      // Active CTA is an anchor to the zoom link (disabled state renders a span).
      const tag = await cta.evaluate((el) => el.tagName.toLowerCase())
      expect(tag).toBe('a')
      const href = await cta.evaluate((el) => el.getAttribute('href'))
      expect(href).toContain('zoom')
    } finally {
      await hand.close()
    }
  })
})
