import type { AgentHand } from '../agenthand'
import { DEFAULT_TIMEOUT } from '../agenthand'

/**
 * Shared helpers for interactive LMS Walkthrough e2e flows
 * (`onboarding-fees-unpaid`, `onboarding-fees-unpaid-with-app-download`).
 */

/** Wait until at least `count` lecture steps carry a `-done` marker. */
export async function waitForLectureStepsDone(
  hand: AgentHand,
  count: number,
  timeout = DEFAULT_TIMEOUT,
): Promise<void> {
  await hand.page.waitForFunction(
    (expected) =>
      document.querySelectorAll(
        '[data-testid^="guided-tour-step-lecture-"][data-testid$="-done"]',
      ).length >= expected,
    { timeout },
    count,
  )
}

/**
 * Force-complete the currently playing guided-tour video (seek past the 10s
 * completion threshold + fire `ended` for auto-advance).
 */
export async function completeCurrentWalkthroughVideo(
  hand: AgentHand,
): Promise<void> {
  await hand.waitForTestId('guided-tour-video')
  // Missing-video placeholder has no <video> — fail clearly.
  if (await hand.hasTestId('guided-tour-video-missing')) {
    throw new Error('Guided-tour video is missing — cannot complete step')
  }
  await hand.playVideoIn('guided-tour-video', {
    fireEnded: true,
    minWatchSeconds: 11,
  })
}

/** Play all 3 LMS walkthrough videos through to completion (auto-advance). */
export async function completeAllWalkthroughVideos(
  hand: AgentHand,
): Promise<void> {
  const alreadyDone = await hand.page.$$eval(
    '[data-testid^="guided-tour-step-lecture-"][data-testid$="-done"]',
    (nodes) => nodes.length,
  )

  for (let i = alreadyDone + 1; i <= 3; i++) {
    // If the active panel isn't a video (e.g. prior run left us on photo), jump
    // to the first incomplete lecture step.
    if (!(await hand.hasTestId('guided-tour-video'))) {
      const jumped = await hand.page.evaluate(() => {
        const steps = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-testid^="guided-tour-step-lecture-"]',
          ),
        ).filter((el) => {
          const id = el.getAttribute('data-testid') ?? ''
          return !id.endsWith('-done')
        })
        for (const step of steps) {
          const id = step.getAttribute('data-testid') ?? ''
          const done = document.querySelector(`[data-testid="${id}-done"]`)
          if (!done) {
            step.click()
            return true
          }
        }
        return false
      })
      if (!jumped) {
        throw new Error(
          `Expected an incomplete lecture step to play (need ${i}/3 done)`,
        )
      }
    }
    await completeCurrentWalkthroughVideo(hand)
    await waitForLectureStepsDone(hand, i)
  }
}

/** Install a canvas-based getUserMedia mock on the *current* document. */
async function installLiveCameraMock(hand: AgentHand): Promise<void> {
  await hand.page.evaluate(() => {
    const nav = navigator as Navigator & { mediaDevices?: MediaDevices }
    if (!nav.mediaDevices) {
      Object.defineProperty(nav, 'mediaDevices', {
        configurable: true,
        value: {},
      })
    }
    const mediaDevices = nav.mediaDevices as MediaDevices
    mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#6a5acd'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(320, 200, 90, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillRect(220, 300, 200, 140)
        ctx.fillStyle = '#1f2937'
        ctx.font = 'bold 28px sans-serif'
        ctx.fillText('Mock DP', 255, 430)
      }
      return canvas.captureStream(30)
    }
  })
}

/** Enable camera → capture → submit on the profile-photo step. */
export async function completeProfilePhotoStep(hand: AgentHand): Promise<void> {
  // After the last video ends the tour does NOT auto-advance to photo — jump
  // via the step list (or Next).
  if (!(await hand.hasTestId('guided-tour-panel-profile-photo'))) {
    if (await hand.hasTestId('guided-tour-step-next')) {
      await hand.clickTestIdDirect('guided-tour-step-next')
    } else {
      await hand.clickTestIdDirect('guided-tour-step-profile-photo')
    }
  }
  await hand.waitForTestId('guided-tour-panel-profile-photo')

  await installLiveCameraMock(hand)
  await hand.clickTestIdDirect('guided-tour-profile-photo-enable')
  // Wrapper has dimensions even before the stream paints; capture CTA appears
  // as soon as cameraEnabled flips true.
  await hand.waitForTestId('guided-tour-profile-photo-webcam')
  await hand.waitForTestId('guided-tour-profile-photo-capture')

  // Give the mock stream a frame so getScreenshot() returns a data URL.
  await hand.page.waitForFunction(
    () => {
      const root = document.querySelector(
        '[data-testid="guided-tour-profile-photo-webcam"]',
      )
      const video = root?.querySelector('video') as HTMLVideoElement | null
      return Boolean(video && video.readyState >= 2 && video.videoWidth > 0)
    },
    { timeout: DEFAULT_TIMEOUT },
  )

  await hand.clickTestIdDirect('guided-tour-profile-photo-capture')
  await hand.waitForTestId('guided-tour-profile-photo-preview')
  await hand.clickTestIdDirect('guided-tour-profile-photo-submit')
  await hand.waitForTestId('guided-tour-profile-photo-done')
  await hand.waitForTestId('guided-tour-step-profile-photo-done')
}

/** Close the guided-tour overlay via the X / "See dashboard" control. */
export async function closeGuidedTour(hand: AgentHand): Promise<void> {
  await hand.clickTestIdDirect('guided-tour-see-dashboard')
  await hand.page.waitForFunction(
    () => !document.querySelector('[data-testid="guided-tour-overlay"]'),
    { timeout: DEFAULT_TIMEOUT },
  )
}
