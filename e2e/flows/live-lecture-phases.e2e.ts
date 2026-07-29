import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'puppeteer'

import type { AgentHand } from '../agenthand'
import { launchBrowser, openSession } from '../agenthand'
import { getFlowState } from '../agenthand/seedState'

/**
 * Flow: `live-lecture-phases`
 * Seeded world: one student enrolled across sections with the full matrix of
 * live/video lecture phases. Each lecture id is a distinct detail-page state:
 *  - before-unlock live      → "hasn't started yet" panel + countdown
 *  - during-join live        → active Join Live card
 *  - video (mandatory/opt.)  → recording player mounted
 *  - after live, no recording→ "Recording not available yet" panel
 *  - after live + recording, attendance OFF → live-only attendance banner
 *  - after live + recording, attendance ON  → video-counts attendance banner
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
    await hand.loginAs(FLOW_ID, '/')
  })
  afterAll(async () => {
    await hand?.close()
    await browser?.close()
  })

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
})
