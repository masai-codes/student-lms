// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useInLecturePoll } from '../useInLecturePoll'
import type { InLecturePopupPollElement } from '@/server/learn/lectureDetailTypes'

const POLLS: Array<InLecturePopupPollElement> = [
  {
    id: 1,
    question: 'a?',
    options: ['Yes', 'No'],
    status: 'active',
    startSec: 215,
    endSec: 357,
    submittedAt: null,
  },
  {
    id: 2,
    question: 'b?',
    options: ['Yes', 'No'],
    status: 'active',
    startSec: 463,
    endSec: 512,
    submittedAt: null,
  },
]

type Props = { progressSeconds: number }

function renderPoll(
  initial: Props,
  onSkipToSeconds: (from: number, to: number) => void = vi.fn(),
) {
  return renderHook(
    ({ progressSeconds }: Props) =>
      useInLecturePoll({
        polls: POLLS,
        progressSeconds,
        totalDuration: 1000,
        onSkipToSeconds,
      }),
    { initialProps: initial },
  )
}

afterEach(() => {
  cleanup()
})

describe('useInLecturePoll', () => {
  it('opens the poll when playback enters the window', () => {
    const { result, rerender } = renderPoll({ progressSeconds: 100 })
    expect(result.current.activePoll).toBeNull()

    act(() => rerender({ progressSeconds: 216 }))
    expect(result.current.activePoll?.question).toBe('a?')
  })

  it('opens a second window after leaving the first (no stuck activePoll)', () => {
    const { result, rerender } = renderPoll({ progressSeconds: 100 })
    act(() => rerender({ progressSeconds: 216 })) // enter "a"
    expect(result.current.activePoll?.question).toBe('a?')

    act(() => rerender({ progressSeconds: 470 })) // jump to inside "b"
    expect(result.current.activePoll?.question).toBe('b?')
  })

  it('closes when playback leaves the window (natural or seek)', () => {
    const { result, rerender } = renderPoll({ progressSeconds: 216 })
    expect(result.current.activePoll?.question).toBe('a?')
    act(() => rerender({ progressSeconds: 400 })) // past endSec 357 → closes
    expect(result.current.activePoll).toBeNull()
  })

  it('keeps the popup open while playback stays inside the window', () => {
    const { result, rerender } = renderPoll({ progressSeconds: 216 })
    act(() => rerender({ progressSeconds: 300 }))
    expect(result.current.activePoll?.question).toBe('a?')
  })

  it('does not instantly re-open after dismiss while still inside the window', () => {
    const { result, rerender } = renderPoll({ progressSeconds: 216 })
    act(() => result.current.dismissPoll())
    expect(result.current.activePoll).toBeNull()
    // Still inside the window → stays closed.
    act(() => rerender({ progressSeconds: 220 }))
    expect(result.current.activePoll).toBeNull()
  })

  it('re-opens on re-entry after dismiss', () => {
    const { result, rerender } = renderPoll({ progressSeconds: 100 })
    act(() => rerender({ progressSeconds: 216 }))
    act(() => result.current.dismissPoll())
    expect(result.current.activePoll).toBeNull()

    // Leave the window, then re-enter → re-opens.
    act(() => rerender({ progressSeconds: 100 }))
    act(() => rerender({ progressSeconds: 220 }))
    expect(result.current.activePoll?.question).toBe('a?')
  })

  it('dismissPoll closes without seeking', () => {
    const onSeek = vi.fn()
    const { result, rerender } = renderPoll({ progressSeconds: 100 }, onSeek)
    act(() => rerender({ progressSeconds: 216 }))
    act(() => result.current.dismissPoll())
    expect(onSeek).not.toHaveBeenCalled()
    expect(result.current.activePoll).toBeNull()
  })

  it('closePoll seeks to the window end and reports the skipped range', () => {
    const onSeek = vi.fn()
    const { result, rerender } = renderPoll({ progressSeconds: 100 }, onSeek)
    act(() => rerender({ progressSeconds: 216 }))
    act(() => result.current.closePoll())
    expect(onSeek).toHaveBeenCalledWith(215, 357)
  })

  it('opens when the user scrubs directly into a window', () => {
    const { result, rerender } = renderPoll({ progressSeconds: 600 })
    act(() => rerender({ progressSeconds: 300 }))
    expect(result.current.activePoll?.question).toBe('a?')
  })
})
