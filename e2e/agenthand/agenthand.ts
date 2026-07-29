import puppeteer from 'puppeteer'
import type { Browser, BrowserContext, ElementHandle, Page } from 'puppeteer'

import {
  BASE_URL,
  DEFAULT_TIMEOUT,
  DESKTOP_VIEWPORT,
  HEADFUL,
  SECRET_LOGIN_TOKEN,
  SLOWMO,
} from './config'
import { getStudent } from './seedState'

/**
 * agenthand — the project's Puppeteer-based automation driver. It drives the
 * *running* app (dev server on :3002) and selects elements by `data-testid`
 * only (repo convention — never id/class). This wrapper keeps specs terse and
 * deterministic: prefer `waitForTestId` over fixed sleeps.
 */

const testidSelector = (testid: string): string => `[data-testid="${testid}"]`

export class AgentHand {
  readonly page: Page
  private readonly context: BrowserContext

  constructor(page: Page, context: BrowserContext) {
    this.page = page
    this.context = context
  }

  // --- navigation -----------------------------------------------------------

  /** Absolute-or-relative navigation against the dev server base URL. */
  async goto(path: string): Promise<void> {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
    await this.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: DEFAULT_TIMEOUT,
    })
  }

  /**
   * Establish a real session for a seeded student via the dev-only
   * secret-login backdoor, then land on `landingPath` (default `/`).
   * The token is never logged.
   */
  async loginAs(flowId: string, landingPath = '/'): Promise<void> {
    if (!SECRET_LOGIN_TOKEN) {
      throw new Error(
        'SECRET_LOGIN_TOKEN is not set. Add it to .env.local before running e2e.',
      )
    }
    const { email } = getStudent(flowId)
    const loginUrl =
      `${BASE_URL}/api/secret-login` +
      `?token=${encodeURIComponent(SECRET_LOGIN_TOKEN)}` +
      `&email=${encodeURIComponent(email)}`
    // secret-login 302s to `/`; follow it, then go to the target route.
    await this.page.goto(loginUrl, {
      waitUntil: 'networkidle2',
      timeout: DEFAULT_TIMEOUT,
    })
    await this.goto(landingPath)
  }

  // --- selectors ------------------------------------------------------------

  /** Wait for a testid to appear (visible). Returns its handle. */
  async waitForTestId(
    testid: string,
    options: { timeout?: number; visible?: boolean } = {},
  ): Promise<ElementHandle<Element>> {
    const handle = await this.page.waitForSelector(testidSelector(testid), {
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
      visible: options.visible ?? true,
    })
    if (!handle) throw new Error(`Timed out waiting for testid "${testid}"`)
    return handle
  }

  /** First element for a testid, or null. Does not wait. */
  async queryTestId(testid: string): Promise<ElementHandle<Element> | null> {
    return this.page.$(testidSelector(testid))
  }

  /** All elements for a testid. */
  async queryAllTestId(testid: string): Promise<ElementHandle<Element>[]> {
    return this.page.$$(testidSelector(testid))
  }

  /** True if at least one element with the testid currently exists in the DOM. */
  async hasTestId(testid: string): Promise<boolean> {
    return (await this.queryTestId(testid)) !== null
  }

  /** Count of elements with the testid. */
  async countTestId(testid: string): Promise<number> {
    return (await this.queryAllTestId(testid)).length
  }

  /**
   * Count elements whose testid STARTS WITH `prefix`. Use for rows keyed by a
   * dynamic suffix (e.g. `dashboard-schedule-day-<date>`,
   * `dashboard-announcement-item-<source>-<id>`).
   */
  async countTestIdStartsWith(prefix: string): Promise<number> {
    return this.page.$$eval(
      `[data-testid^="${prefix}"]`,
      (nodes) => nodes.length,
    )
  }

  /**
   * Assert a testid does NOT appear within `timeout`. Resolves true if it never
   * shows, false if it appears. Use for edge-case exclusions / absent states.
   */
  async isTestIdAbsent(testid: string, timeout = 2000): Promise<boolean> {
    try {
      await this.page.waitForSelector(testidSelector(testid), {
        timeout,
        visible: true,
      })
      return false
    } catch {
      return true
    }
  }

  // --- reads ----------------------------------------------------------------

  /** Trimmed innerText of the first element with the testid. */
  async textOf(testid: string): Promise<string> {
    const handle = await this.waitForTestId(testid)
    const text = await handle.evaluate((el) => el.textContent ?? '')
    return text.trim()
  }

  /** A DOM attribute of the first element with the testid. */
  async attrOf(testid: string, attribute: string): Promise<string | null> {
    const handle = await this.waitForTestId(testid)
    return handle.evaluate((el, attr) => el.getAttribute(attr), attribute)
  }

  /** All `data-content-id` values under a container testid (listing rows). */
  async contentIdsUnder(
    containerTestId: string,
    itemTestId: string,
  ): Promise<string[]> {
    await this.waitForTestId(containerTestId)
    return this.page.$$eval(
      `${testidSelector(containerTestId)} ${testidSelector(itemTestId)}`,
      (nodes) =>
        nodes
          .map((n) => n.getAttribute('data-content-id'))
          .filter((v): v is string => v != null),
    )
  }

  // --- interactions ---------------------------------------------------------

  async clickTestId(testid: string): Promise<void> {
    const handle = await this.waitForTestId(testid)
    await handle.click()
  }

  /**
   * Dispatch a DOM-level click on the element (bypasses coordinate hit-testing).
   * Use for controls sitting under a transparent full-viewport wrapper (e.g. the
   * guided-tour "See dashboard" close button) where a positional click misses.
   */
  async clickTestIdDirect(testid: string): Promise<void> {
    const handle = await this.waitForTestId(testid)
    await handle.evaluate((el) => (el as HTMLElement).click())
  }

  async setViewport(viewport: {
    width: number
    height: number
  }): Promise<void> {
    await this.page.setViewport(viewport)
  }

  // --- lifecycle ------------------------------------------------------------

  async close(): Promise<void> {
    await this.context.close()
  }
}

/** Launch a single browser for a spec file. */
export async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: !HEADFUL,
    slowMo: SLOWMO,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  })
}

/**
 * Open an isolated browser context (fresh cookies) and return an AgentHand.
 * Isolation matters: each flow logs in as a different student, so contexts
 * must not share the session cookie.
 */
export async function openSession(
  browser: Browser,
  viewport = DESKTOP_VIEWPORT,
): Promise<AgentHand> {
  const context = await browser.createBrowserContext()
  const page = await context.newPage()
  await page.setViewport(viewport)
  page.setDefaultTimeout(DEFAULT_TIMEOUT)
  return new AgentHand(page, context)
}

export { testidSelector }
