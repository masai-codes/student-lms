// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useInLectureQuiz } from '../useInLectureQuiz'
import type { InLecturePopupQuizElement } from '@/server/learn/lectureDetailTypes'

const LECTURE_ID = 999
const QUIZZES: Array<InLecturePopupQuizElement> = [
  { id: 1, assessmentId: 'a', status: 'active', startSec: 215, endSec: 357 },
  { id: 2, assessmentId: 'b', status: 'active', startSec: 463, endSec: 512 },
]

type Props = { progressSeconds: number; seekSignal?: number }

function renderQuiz(
  initial: Props,
  onSkipToSeconds: (from: number, to: number) => void = vi.fn(),
) {
  return renderHook(
    ({ progressSeconds, seekSignal = 0 }: Props) =>
      useInLectureQuiz({
        lectureId: LECTURE_ID,
        quizzes: QUIZZES,
        progressSeconds,
        totalDuration: 1000,
        seekSignal,
        onSkipToSeconds,
      }),
    { initialProps: initial },
  )
}

afterEach(() => {
  cleanup()
})

describe('useInLectureQuiz', () => {
  it('opens the quiz when playback enters the window', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 100 })
    expect(result.current.activeQuiz).toBeNull()

    act(() => rerender({ progressSeconds: 216 }))
    expect(result.current.activeQuiz?.assessmentId).toBe('a')
  })

  it('opens a second window after leaving the first (no stuck activeQuiz)', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 100 })
    act(() => rerender({ progressSeconds: 216 })) // enter "a"
    expect(result.current.activeQuiz?.assessmentId).toBe('a')

    act(() => rerender({ progressSeconds: 470 })) // jump to inside "b"
    expect(result.current.activeQuiz?.assessmentId).toBe('b')
  })

  it('closes when playback leaves the window (natural or seek)', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 216 })
    expect(result.current.activeQuiz?.assessmentId).toBe('a')
    act(() => rerender({ progressSeconds: 400 })) // past endSec 357 → closes
    expect(result.current.activeQuiz).toBeNull()
  })

  it('keeps the popup open while playback stays inside the window', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 216 })
    act(() => rerender({ progressSeconds: 300 }))
    expect(result.current.activeQuiz?.assessmentId).toBe('a')
  })

  it('re-opens on re-entry after resolving (no persistence/suppression)', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 100 })
    act(() => rerender({ progressSeconds: 216 }))
    act(() => result.current.resolveQuiz('auto_submitted'))
    act(() => result.current.dismissQuiz())
    expect(result.current.activeQuiz).toBeNull()

    // Leave the window, then re-enter → re-opens.
    act(() => rerender({ progressSeconds: 100 }))
    act(() => rerender({ progressSeconds: 220 }))
    expect(result.current.activeQuiz?.assessmentId).toBe('a')
  })

  it('does not instantly re-open after dismiss while still inside the window', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 216 })
    act(() => result.current.dismissQuiz())
    expect(result.current.activeQuiz).toBeNull()
    // Still inside the window → stays closed.
    act(() => rerender({ progressSeconds: 220 }))
    expect(result.current.activeQuiz).toBeNull()
  })

  it('dismissQuiz closes without seeking', () => {
    const onSeek = vi.fn()
    const { result, rerender } = renderQuiz({ progressSeconds: 100 }, onSeek)
    act(() => rerender({ progressSeconds: 216 }))
    act(() => result.current.dismissQuiz())
    expect(onSeek).not.toHaveBeenCalled()
    expect(result.current.activeQuiz).toBeNull()
  })

  it('closeQuiz seeks to the window end and reports the skipped range', () => {
    const onSeek = vi.fn()
    const { result, rerender } = renderQuiz({ progressSeconds: 100 }, onSeek)
    act(() => rerender({ progressSeconds: 216 }))
    act(() => result.current.closeQuiz())
    expect(onSeek).toHaveBeenCalledWith(215, 357)
  })

  it('opens when the user scrubs directly into a window', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 600 })
    act(() => rerender({ progressSeconds: 300 }))
    expect(result.current.activeQuiz?.assessmentId).toBe('a')
  })
})
