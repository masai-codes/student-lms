import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import type { AgentHand } from '../agenthand'
import { DEFAULT_TIMEOUT, launchBrowser, openSession } from '../agenthand'
import { getFlowState } from '../agenthand/seedState'
import {
  clickTabByLabel,
  clickVideoPlayPause,
  installJoinLiveClickInterceptor,
  pageHasText,
  seekVideoInSection,
  waitForInterceptedJoinUrls,
  waitForTabPanelText,
} from './liveLecturePhasesHelpers'

/**
 * Flow: `live-lecture-phases`
 * Seeded world: one student enrolled across sections with the full matrix of
 * live/video lecture phases. Parity with the Stagehand flow covering:
 *  - before-unlock / during-join / after (no recording / attendance OFF / ON)
 *  - optional live variants
 *  - video mandatory/optional + play/seek
 *  - lecture detail tabs (notes / AI summary / transcript / associated)
 *  - learn listing → detail navigation
 *  - bookmark toggle + bookmarks page persistence
 *  - dashboard "Upcoming lecture" navbar banner
 */
const FLOW_ID = 'live-lecture-phases'

describe(FLOW_ID, () => {
  let browser: Browser
  let hand: AgentHand
  const ids = getFlowState(FLOW_ID).entityIds

  beforeAll(async () => {
    browser = await launchBrowser()
    hand = await openSession(browser)
    // Single session — all lectures belong to the same seeded student.
    // Guided-tour steps are pre-completed in this seed, so `/` has no overlay.
    await hand.loginAs(FLOW_ID, '/')
  })
  afterAll(async () => {
    await hand?.close()
    await browser?.close()
  })

  // --- Existing phase smoke checks ------------------------------------------

  it('before-unlock live lecture shows the "hasn\'t started" panel + countdown', async () => {
    await hand.goto(`/lectures/${ids.beforeUnlockLectureId}`)
    const title = await hand.textOf('lecture-state-panel')
    expect(title.toLowerCase()).toContain("hasn't started")
    expect(await hand.hasTestId('lecture-starts-in-countdown')).toBe(true)
  })

  it('during-join live lecture shows an active Join Live card', async () => {
    await hand.goto(`/lectures/${ids.duringJoinLectureId}`)
    await hand.waitForTestId('lecture-join-live-card')
    const cta = await hand.waitForTestId('lecture-join-live-cta')
    expect(await cta.evaluate((el) => el.tagName.toLowerCase())).toBe('a')
  })

  it('opens a Zoom tab when Join Live is clicked on during-join lecture', async () => {
    await hand.goto(`/lectures/${ids.duringJoinLectureId}`)
    await hand.waitForTestId('lecture-join-live-cta')

    const href = await hand.attrOf('lecture-join-live-cta', 'href')
    expect(href).toContain('zoom')

    await installJoinLiveClickInterceptor(hand)
    await hand.clickTestIdDirect('lecture-join-live-cta')
    const opened = await waitForInterceptedJoinUrls(hand)
    expect(opened.some((url) => url.toLowerCase().includes('zoom'))).toBe(true)
  })

  it('mandatory video lecture mounts the recording player', async () => {
    await hand.goto(`/lectures/${ids.videoMandatoryLectureId}`)
    expect(await hand.hasTestId('lecture-video-section')).toBe(true)
  })

  it('optional video lecture mounts the recording player', async () => {
    await hand.goto(`/lectures/${ids.videoOptionalLectureId}`)
    expect(await hand.hasTestId('lecture-video-section')).toBe(true)
  })

  it('after live with no recording shows the "not available" panel', async () => {
    await hand.goto(`/lectures/${ids.afterNoRecordingLectureId}`)
    const title = await hand.textOf('lecture-state-panel')
    expect(title.toLowerCase()).toContain('not available')
    expect(await hand.hasTestId('lecture-video-section')).toBe(false)
  })

  it('after live + recording (attendance OFF) shows the live-only banner', async () => {
    await hand.goto(`/lectures/${ids.afterWithRecordingAttendanceOffLectureId}`)
    expect(await hand.hasTestId('lecture-attendance-banner-live-only')).toBe(
      true,
    )
    expect(await hand.hasTestId('lecture-attendance-banner-video-counts')).toBe(
      false,
    )
  })

  it('after live + recording (attendance ON) shows the video-counts banner', async () => {
    await hand.goto(`/lectures/${ids.afterWithRecordingAttendanceOnLectureId}`)
    expect(await hand.hasTestId('lecture-attendance-banner-video-counts')).toBe(
      true,
    )
  })

  // --- Optional live variants -----------------------------------------------

  it('optional live before unlock shows hasn\'t-started panel + Recommended chip', async () => {
    expect(
      ids.optionalLiveBeforeUnlockLectureId,
      'seed-state must carry optionalLiveBeforeUnlockLectureId',
    ).toBeTruthy()
    await hand.goto(`/lectures/${ids.optionalLiveBeforeUnlockLectureId}`)
    const title = await hand.textOf('lecture-state-panel')
    expect(title.toLowerCase()).toContain("hasn't started")
    expect(await pageHasText(hand, 'Recommended')).toBe(true)
  })

  it('optional live during join shows active Join Live + Recommended chip', async () => {
    expect(
      ids.optionalLiveDuringJoinLectureId,
      'seed-state must carry optionalLiveDuringJoinLectureId',
    ).toBeTruthy()
    await hand.goto(`/lectures/${ids.optionalLiveDuringJoinLectureId}`)
    await hand.waitForTestId('lecture-join-live-card')
    const cta = await hand.waitForTestId('lecture-join-live-cta')
    expect(await cta.evaluate((el) => el.tagName.toLowerCase())).toBe('a')
    expect(await pageHasText(hand, 'Recommended')).toBe(true)
  })

  // --- Learn listing --------------------------------------------------------

  it('learn listing shows lecture rows and navigates to during-join detail', async () => {
    await hand.goto('/learn')
    await hand.waitForTestId('learn-content-list')
    const rows = await hand.countTestId('lecture-list-item')
    expect(rows).toBeGreaterThan(0)

    // During-join lecture should expose an active Join Live CTA on its card.
    const duringJoinId = String(ids.duringJoinLectureId)
    const hasJoinOnRow = await hand.page.$eval(
      `[data-testid="lecture-list-item"][data-content-id="${duringJoinId}"]`,
      (row) =>
        Boolean(row.querySelector('[data-testid="learn-listing-join-live-cta"]')),
    )
    expect(hasJoinOnRow).toBe(true)

    // Click the card (not the CTA) to open the detail page.
    await hand.page.$eval(
      `[data-testid="lecture-list-item"][data-content-id="${duringJoinId}"] a`,
      (el) => (el as HTMLElement).click(),
    )
    await hand.page.waitForFunction(
      (id) => window.location.pathname === `/lectures/${id}`,
      { timeout: DEFAULT_TIMEOUT },
      duringJoinId,
    )
    await hand.waitForTestId('lecture-join-live-card')
  })

  // --- Video play / seek ----------------------------------------------------

  it('mandatory video lecture play toggles and seek updates the slider', async () => {
    await hand.goto(`/lectures/${ids.videoMandatoryLectureId}`)
    await hand.waitForTestId('lecture-video-section')

    // Ensure the video element is ready before interacting with controls.
    await hand.page.waitForFunction(
      () => {
        const root = document.querySelector(
          '[data-testid="lecture-video-section"]',
        )
        const video = root?.querySelector('video') as HTMLVideoElement | null
        return Boolean(video && video.readyState >= 1)
      },
      { timeout: DEFAULT_TIMEOUT },
    )

    // Hover / activity may be needed to reveal glass controls — click Play.
    await clickVideoPlayPause(hand, 'Play')
    await hand.page.waitForFunction(
      () =>
        Boolean(
          document.querySelector(
            '[data-testid="lecture-video-section"] button[aria-label="Pause"]',
          ),
        ),
      { timeout: DEFAULT_TIMEOUT },
    )

    await seekVideoInSection(hand, 'lecture-video-section', 5)

    await hand.page.waitForFunction(
      () => {
        const slider = document.querySelector(
          '[data-testid="lecture-video-section"] [role="slider"][aria-label="Seek"]',
        )
        if (!slider) return false
        const now = Number(slider.getAttribute('aria-valuenow') ?? '0')
        return now >= 4
      },
      { timeout: DEFAULT_TIMEOUT },
    )
  })

  it('optional video lecture mounts and play toggles to Pause', async () => {
    await hand.goto(`/lectures/${ids.videoOptionalLectureId}`)
    await hand.waitForTestId('lecture-video-section')

    await hand.page.waitForFunction(
      () => {
        const root = document.querySelector(
          '[data-testid="lecture-video-section"]',
        )
        const video = root?.querySelector('video') as HTMLVideoElement | null
        return Boolean(video && video.readyState >= 1)
      },
      { timeout: DEFAULT_TIMEOUT },
    )

    await clickVideoPlayPause(hand, 'Play')
    await hand.page.waitForFunction(
      () =>
        Boolean(
          document.querySelector(
            '[data-testid="lecture-video-section"] button[aria-label="Pause"]',
          ),
        ),
      { timeout: DEFAULT_TIMEOUT },
    )
  })

  // --- Lecture detail tabs --------------------------------------------------

  it('attendance-ON recording tabs show notes, AI summary, transcript, associated', async () => {
    await hand.goto(
      `/lectures/${ids.afterWithRecordingAttendanceOnLectureId}`,
    )
    await hand.waitForTestId('lecture-video-section')

    // Description (default) — seeded notes.
    await waitForTabPanelText(hand, 'Closures and lexical scope')

    await clickTabByLabel(hand, 'AI Summary')
    await waitForTabPanelText(hand, 'Key takeaways')

    await clickTabByLabel(hand, 'Transcript')
    await waitForTabPanelText(hand, 'Welcome back')

    await clickTabByLabel(hand, 'Associated Content')
    await hand.waitForTestId('learn-associated-content-list')
    expect(await pageHasText(hand, 'follow-up: async JS')).toBe(true)
    expect(await pageHasText(hand, 'closures cheat sheet')).toBe(true)
    expect(await pageHasText(hand, 'array methods drill')).toBe(true)
  })

  it('attendance-OFF recording Associated Content shows the DOM APIs follow-up', async () => {
    await hand.goto(
      `/lectures/${ids.afterWithRecordingAttendanceOffLectureId}`,
    )
    await hand.waitForTestId('lecture-video-section')

    await clickTabByLabel(hand, 'Associated Content')
    await hand.waitForTestId('learn-associated-content-list')
    expect(await pageHasText(hand, 'follow-up: DOM APIs')).toBe(true)
  })

  // --- Bookmark -------------------------------------------------------------

  it('bookmark toggle persists the lecture on the Bookmarks page', async () => {
    await hand.goto(`/lectures/${ids.videoMandatoryLectureId}`)
    await hand.waitForTestId('lecture-video-section')

    // Ensure we start from an unbookmarked state if a prior run left it on.
    const removeBtn = await hand.page.$(
      'button[aria-label="Remove bookmark"]',
    )
    if (removeBtn) {
      await removeBtn.evaluate((el) => (el as HTMLElement).click())
      await hand.page.waitForSelector('button[aria-label="Add bookmark"]', {
        timeout: DEFAULT_TIMEOUT,
      })
    }

    await hand.page.waitForSelector('button[aria-label="Add bookmark"]', {
      timeout: DEFAULT_TIMEOUT,
    })
    await hand.page.$eval('button[aria-label="Add bookmark"]', (el) =>
      (el as HTMLElement).click(),
    )
    await hand.page.waitForSelector('button[aria-label="Remove bookmark"]', {
      timeout: DEFAULT_TIMEOUT,
    })

    // Skip fragile profile dropdown — navigate directly to bookmarks.
    await hand.goto('/bookmarks?tab=lectures')
    await hand.page.waitForFunction(
      () =>
        document.querySelectorAll('[data-testid^="bookmarks-item-"]').length >
        0,
      { timeout: DEFAULT_TIMEOUT },
    )

    const hasBookmarkedLecture = await hand.page.evaluate(() => {
      const items = Array.from(
        document.querySelectorAll('[data-testid^="bookmarks-item-"]'),
      )
      return items.some((item) =>
        (item.textContent ?? '')
          .toLowerCase()
          .includes('video lecture — mandatory'),
      )
    })
    expect(hasBookmarkedLecture).toBe(true)
  })

  // --- Dashboard upcoming-lecture banner ------------------------------------

  it('dashboard Upcoming lecture banner links to a joinable lecture', async () => {
    await hand.goto('/')
    await hand.waitForTestId('next-action-banner')

    const href = await hand.attrOf('next-action-banner', 'href')
    expect(href).toBeTruthy()
    const match = href!.match(/\/lectures\/(\d+)/)
    expect(match).toBeTruthy()
    const bannerLectureId = Number(match![1])

    const joinableIds = [
      ids.duringJoinLectureId,
      ids.optionalLiveDuringJoinLectureId,
      ids.beforeUnlockLectureId,
      ids.optionalLiveBeforeUnlockLectureId,
    ].filter((id): id is number => typeof id === 'number')
    expect(joinableIds).toContain(bannerLectureId)

    // Title lives in a Radix tooltip (not inline). Headless hover is flaky, so
    // open via focus + pointerenter — Radix treats both as open triggers.
    await hand.page.$eval('[data-testid="next-action-banner"]', (el) => {
      ;(el as HTMLElement).focus()
      el.dispatchEvent(
        new PointerEvent('pointerenter', { bubbles: true, cancelable: true }),
      )
      el.dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true, cancelable: true }),
      )
    })
    await hand.page.waitForFunction(
      () => {
        const tip = document.querySelector(
          '[data-testid="next-action-banner-title"]',
        )
        return Boolean(tip && (tip.textContent ?? '').trim().length > 0)
      },
      { timeout: DEFAULT_TIMEOUT },
    )
    const tooltip = await hand.page.$eval(
      '[data-testid="next-action-banner-title"]',
      (el) => (el.textContent ?? '').trim(),
    )
    expect(tooltip.length).toBeGreaterThan(0)

    await hand.clickTestIdDirect('next-action-banner')
    await hand.page.waitForFunction(
      (id) => window.location.pathname === `/lectures/${id}`,
      { timeout: DEFAULT_TIMEOUT },
      String(bannerLectureId),
    )
  })
})
