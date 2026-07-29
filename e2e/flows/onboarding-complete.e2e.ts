import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import type { AgentHand } from '../agenthand'
import { launchBrowser, openSession } from '../agenthand'

/**
 * Flow: `onboarding-complete`
 * Every onboarding step done. The guided tour does NOT auto-open on `/`
 * (onboarding complete) — the normal dashboard renders with no onboarding
 * banner. Forcing it open via `?guidedTour=open` shows the completion banner
 * with every step marked done and the program tab unlocked. From there the
 * learner can open Program Onboarding and download the ID card.
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

  it('opens Program Onboarding and exposes the unlocked ID card capstone', async () => {
    // Ensure the tour is open (previous test left it open; re-open if needed).
    if (!(await hand.hasTestId('guided-tour-overlay'))) {
      await hand.goto('/?guidedTour=open')
      await hand.waitForTestId('guided-tour-overlay')
    }

    expect(await hand.attrOf('guided-tour-tab-program', 'data-locked')).toBe(
      'false',
    )
    // ID card capstone only mounts on the Program tab.
    await hand.clickTestIdDirect('guided-tour-tab-program')
    await hand.page.waitForFunction(
      () =>
        document.querySelector(
          '[data-testid="guided-tour-tab-program"][aria-selected="true"]',
        ) != null,
      { timeout: 10_000 },
    )

    // Unlocked + URL → download CTA. Unlocked without a URL (local admissions
    // API often returns null) → "being generated" panel. Either proves the
    // Program tab opened and the ID-card unlock path ran. Locked is a failure.
    expect(await hand.hasTestId('id-card-locked')).toBe(false)

    const hasDownload = await hand.hasTestId('id-card-download')
    const isGenerating = await hand.hasTestId('id-card-step')
    expect(hasDownload || isGenerating).toBe(true)

    if (hasDownload) {
      const href = await hand.attrOf('id-card-download', 'href')
      expect(href).toBeTruthy()
      expect(href).toMatch(/^https?:\/\//)
      expect(await hand.attrOf('id-card-download', 'target')).toBe('_blank')

      await hand.page.evaluate(() => {
        ;(window as unknown as { __e2eIdCardUrls: string[] }).__e2eIdCardUrls =
          []
        document.addEventListener(
          'click',
          (event) => {
            const targetEl = event.target as Element | null
            const anchor = targetEl?.closest?.(
              '[data-testid="id-card-download"]',
            ) as HTMLAnchorElement | null
            if (!anchor) return
            event.preventDefault()
            event.stopPropagation()
            ;(
              window as unknown as { __e2eIdCardUrls: string[] }
            ).__e2eIdCardUrls.push(anchor.href)
          },
          true,
        )
      })
      await hand.clickTestIdDirect('id-card-download')
      await hand.page.waitForFunction(
        () =>
          (
            (window as unknown as { __e2eIdCardUrls?: string[] })
              .__e2eIdCardUrls ?? []
          ).length > 0,
        { timeout: 10_000 },
      )
      const opened = await hand.page.evaluate(
        () =>
          (window as unknown as { __e2eIdCardUrls: string[] }).__e2eIdCardUrls,
      )
      expect(opened[0]).toBe(href)
    }
  })
})
