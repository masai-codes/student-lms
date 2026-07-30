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

  it('with requireReady, does not seek or latch while the player is not ready', () => {
    const seekTo = vi.fn()
    const getCurrentTime = vi.fn(() => 0)
    // ReactPlayer.getDuration() returns null until the internal player is ready.
    const getDuration = vi.fn(() => null)
    const videoRef = {
      current: {
        seekTo,
        getCurrentTime,
        getDuration,
      } as unknown as LectureChromePlayerRef,
    }
    const resumeAppliedRef = { current: false }
    const onApplied = vi.fn()

    applyResumeIfNeeded({
      videoRef,
      resumeSeconds: 25,
      resumeAppliedRef,
      onApplied,
      requireReady: true,
    })

    // Latch must stay unset so the onReady-driven call can apply the resume.
    expect(seekTo).not.toHaveBeenCalled()
    expect(resumeAppliedRef.current).toBe(false)
    expect(onApplied).not.toHaveBeenCalled()
  })

  it('with requireReady, seeks once the player reports a duration', () => {
    const seekTo = vi.fn()
    const getCurrentTime = vi.fn(() => 0)
    const getDuration = vi.fn(() => 600)
    const videoRef = {
      current: {
        seekTo,
        getCurrentTime,
        getDuration,
      } as unknown as LectureChromePlayerRef,
    }
    const resumeAppliedRef = { current: false }
    const onApplied = vi.fn()

    applyResumeIfNeeded({
      videoRef,
      resumeSeconds: 25,
      resumeAppliedRef,
      onApplied,
      requireReady: true,
    })

    expect(seekTo).toHaveBeenCalledWith(25, 'seconds')
    expect(resumeAppliedRef.current).toBe(true)
    expect(onApplied).toHaveBeenCalledWith(25)
  })

  it('does not resume into the final seconds of a fully-watched video', () => {
    const seekTo = vi.fn()
    const getCurrentTime = vi.fn(() => 0)
    const getDuration = vi.fn(() => 971)
    const videoRef = {
      current: {
        seekTo,
        getCurrentTime,
        getDuration,
      } as unknown as LectureChromePlayerRef,
    }
    const resumeAppliedRef = { current: false }
    const onApplied = vi.fn()

    // Watched to the end (971s of 971s): resuming there would make the first
    // play instantly fire `ended` and stop.
    applyResumeIfNeeded({
      videoRef,
      resumeSeconds: 971,
      resumeAppliedRef,
      onApplied,
    })

    expect(seekTo).not.toHaveBeenCalled()
    expect(onApplied).not.toHaveBeenCalled()
    // Latched so no later call (onReady / MANIFEST_PARSED) re-seeks either.
    expect(resumeAppliedRef.current).toBe(true)
  })
})
