import type { AgentHand } from '../agenthand'
import { DEFAULT_TIMEOUT } from '../agenthand'

/**
 * Shared helpers for the `live-lecture-phases` e2e flow. Prefer stable
 * role / aria-label selectors already present in the app — no new testids.
 */

/** Click a lecture-detail tab by its visible label (e.g. "AI Summary"). */
export async function clickTabByLabel(
  hand: AgentHand,
  label: string,
): Promise<void> {
  await hand.page.waitForFunction(
    (tabLabel) => {
      const tabs = Array.from(
        document.querySelectorAll(
          '[role="tablist"][aria-label="Lecture details"] [role="tab"]',
        ),
      )
      return tabs.some((tab) => (tab.textContent ?? '').trim() === tabLabel)
    },
    { timeout: DEFAULT_TIMEOUT },
    label,
  )

  const clicked = await hand.page.evaluate((tabLabel) => {
    const tabs = Array.from(
      document.querySelectorAll(
        '[role="tablist"][aria-label="Lecture details"] [role="tab"]',
      ),
    )
    const match = tabs.find(
      (tab) => (tab.textContent ?? '').trim() === tabLabel,
    )
    if (!(match instanceof HTMLElement)) return false
    match.click()
    return true
  }, label)

  if (!clicked) {
    throw new Error(`Lecture tab with label "${label}" not found`)
  }
}

/** Wait until a lecture-detail tabpanel contains the given substring. */
export async function waitForTabPanelText(
  hand: AgentHand,
  substring: string,
  timeout = DEFAULT_TIMEOUT,
): Promise<void> {
  await hand.page.waitForFunction(
    (text) => {
      const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'))
      return panels.some((panel) =>
        (panel.textContent ?? '').toLowerCase().includes(text.toLowerCase()),
      )
    },
    { timeout },
    substring,
  )
}

/** True if document body currently contains `text` (case-insensitive). */
export async function pageHasText(
  hand: AgentHand,
  text: string,
): Promise<boolean> {
  return hand.page.evaluate((needle) => {
    return (document.body.innerText ?? '')
      .toLowerCase()
      .includes(needle.toLowerCase())
  }, text)
}

/**
 * Wait for a `<video>` under a container testid to be ready, then seek it to
 * `seconds` and fire `timeupdate` so the seek slider / watch progress update.
 */
export async function seekVideoInSection(
  hand: AgentHand,
  containerTestId: string,
  seconds: number,
): Promise<void> {
  const selector = `[data-testid="${containerTestId}"]`
  await hand.waitForTestId(containerTestId)

  await hand.page.waitForFunction(
    (sel) => {
      const root = document.querySelector(sel)
      const video = root?.querySelector('video') as HTMLVideoElement | null
      return Boolean(video && video.readyState >= 1)
    },
    { timeout: DEFAULT_TIMEOUT },
    selector,
  )

  await hand.page.$eval(
    `${selector} video`,
    (video, targetSeconds) => {
      const duration =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : targetSeconds + 1
      video.currentTime = Math.min(targetSeconds, Math.max(0, duration - 0.25))
      video.dispatchEvent(new Event('timeupdate'))
    },
    seconds,
  )
}

/** Click Play (or Pause) inside the lecture video section by aria-label. */
export async function clickVideoPlayPause(
  hand: AgentHand,
  label: 'Play' | 'Pause',
): Promise<void> {
  await hand.page.waitForFunction(
    (ariaLabel) =>
      Boolean(
        document.querySelector(
          `[data-testid="lecture-video-section"] button[aria-label="${ariaLabel}"]`,
        ),
      ),
    { timeout: DEFAULT_TIMEOUT },
    label,
  )

  await hand.page.$eval(
    `[data-testid="lecture-video-section"] button[aria-label="${label}"]`,
    (el) => (el as HTMLElement).click(),
  )
}

/**
 * Intercept clicks on `lecture-join-live-cta` so we can assert the Zoom URL
 * without relying on Puppeteer's flaky `popup` event in headless Chrome.
 */
export async function installJoinLiveClickInterceptor(
  hand: AgentHand,
): Promise<void> {
  await hand.page.evaluate(() => {
    ;(window as unknown as { __e2eJoinUrls: string[] }).__e2eJoinUrls = []
    document.addEventListener(
      'click',
      (event) => {
        const target = event.target as Element | null
        const anchor = target?.closest?.(
          '[data-testid="lecture-join-live-cta"]',
        ) as HTMLAnchorElement | null
        if (!anchor) return
        event.preventDefault()
        event.stopPropagation()
        ;(window as unknown as { __e2eJoinUrls: string[] }).__e2eJoinUrls.push(
          anchor.href,
        )
      },
      true,
    )
  })
}

export async function waitForInterceptedJoinUrls(
  hand: AgentHand,
  timeout = 10_000,
): Promise<string[]> {
  await hand.page.waitForFunction(
    () =>
      ((window as unknown as { __e2eJoinUrls?: string[] }).__e2eJoinUrls ?? [])
        .length > 0,
    { timeout },
  )
  return hand.page.evaluate(
    () => (window as unknown as { __e2eJoinUrls: string[] }).__e2eJoinUrls,
  )
}
