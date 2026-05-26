import { describe, expect, it, vi } from 'vitest'

import { applyResumeIfNeeded, seekPlayerToSeconds } from '../lectureVideoResume'
import type { LectureChromePlayerRef } from '../../controls/lectureVideoChrome.utils'

describe('lectureVideoResume', () => {
  it('seeks via react player ref', () => {
    const seekTo = vi.fn()
    const videoRef = {
      current: { seekTo } as unknown as LectureChromePlayerRef,
    }

    expect(seekPlayerToSeconds(videoRef, 30)).toBe(true)
    expect(seekTo).toHaveBeenCalledWith(30, 'seconds')
  })

  it('applies resume only once', () => {
    const seekTo = vi.fn()
    const getCurrentTime = vi.fn(() => 0)
    const videoRef = {
      current: { seekTo, getCurrentTime } as unknown as LectureChromePlayerRef,
    }
    const resumeAppliedRef = { current: false }
    const onApplied = vi.fn()

    applyResumeIfNeeded({
      videoRef,
      resumeSeconds: 25,
      resumeAppliedRef,
      onApplied,
    })

    expect(seekTo).toHaveBeenCalledWith(25, 'seconds')
    expect(resumeAppliedRef.current).toBe(true)
    expect(onApplied).toHaveBeenCalledWith(25)
  })
})
