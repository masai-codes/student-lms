// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useInLectureQuiz } from '../useInLectureQuiz'
import { loadLectureQuizStatuses } from '../inLectureQuizStorage'
import type { InLecturePopupQuiz } from '@/server/learn/lectureDetailTypes'

const LECTURE_ID = 999
const QUIZZES: Array<InLecturePopupQuiz> = [
  { timeStamp: { start: '00:03:35', end: '00:05:57' }, assessmentTemplate: 'a' }, // 215–357
  { timeStamp: { start: '00:07:43', end: '00:08:32' }, assessmentTemplate: 'b' }, // 463–512
]

type Props = { progressSeconds: number; seekSignal?: number }

function renderQuiz(
  initial: Props,
  onSeekToSeconds: (s: number) => void = vi.fn(),
) {
  return renderHook(
    ({ progressSeconds, seekSignal = 0 }: Props) =>
      useInLectureQuiz({
        lectureId: LECTURE_ID,
        quizzes: QUIZZES,
        progressSeconds,
        totalDuration: 1000,
        seekSignal,
        onSeekToSeconds,
      }),
    { initialProps: initial },
  )
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('useInLectureQuiz', () => {
  it('opens the quiz when playback enters the window', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 100 })
    expect(result.current.activeQuiz).toBeNull()

    act(() => rerender({ progressSeconds: 216 }))
    expect(result.current.activeQuiz?.assessmentTemplate).toBe('a')
  })

  it('auto-submitted: persists and never re-opens', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 100 })
    act(() => rerender({ progressSeconds: 216 }))
    act(() => result.current.resolveQuiz('auto_submitted'))
    act(() => result.current.closeQuiz())
    expect(result.current.activeQuiz).toBeNull()
    expect(loadLectureQuizStatuses(LECTURE_ID)['a@215']).toBe('auto_submitted')

    // Re-enter the same window → stays closed.
    act(() => rerender({ progressSeconds: 100 }))
    act(() => rerender({ progressSeconds: 220 }))
    expect(result.current.activeQuiz).toBeNull()
  })

  it('stopped: persists but re-opens on re-entry', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 100 })
    act(() => rerender({ progressSeconds: 216 }))
    act(() => result.current.resolveQuiz('stopped'))
    act(() => result.current.closeQuiz())
    expect(result.current.activeQuiz).toBeNull()
    expect(loadLectureQuizStatuses(LECTURE_ID)['a@215']).toBe('stopped')

    // Re-enter the same window → re-opens (re-armed after leaving the window).
    act(() => rerender({ progressSeconds: 100 }))
    act(() => rerender({ progressSeconds: 220 }))
    expect(result.current.activeQuiz?.assessmentTemplate).toBe('a')
  })

  it('submitted (webhook-confirmed): persists and never re-opens', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 100 })
    act(() => rerender({ progressSeconds: 216 }))
    act(() => result.current.resolveQuiz('submitted'))
    act(() => result.current.closeQuiz())
    expect(result.current.activeQuiz).toBeNull()
    expect(loadLectureQuizStatuses(LECTURE_ID)['a@215']).toBe('submitted')

    act(() => rerender({ progressSeconds: 100 }))
    act(() => rerender({ progressSeconds: 220 }))
    expect(result.current.activeQuiz).toBeNull()
  })

  it('dismissQuiz closes without seeking', () => {
    const onSeek = vi.fn()
    const { result, rerender } = renderQuiz({ progressSeconds: 100 }, onSeek)
    act(() => rerender({ progressSeconds: 216 }))
    act(() => result.current.resolveQuiz('submitted'))
    act(() => result.current.dismissQuiz())
    expect(onSeek).not.toHaveBeenCalled()
    expect(result.current.activeQuiz).toBeNull()
  })

  it('closeQuiz seeks to the window end', () => {
    const onSeek = vi.fn()
    const { result, rerender } = renderQuiz({ progressSeconds: 100 }, onSeek)
    act(() => rerender({ progressSeconds: 216 }))
    act(() => result.current.resolveQuiz('auto_submitted'))
    act(() => result.current.closeQuiz())
    expect(onSeek).toHaveBeenCalledWith(357)
  })

  it('marks a window missed when scrubbed clean over it', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 100 })
    act(() => rerender({ progressSeconds: 400 })) // jumps over 215–357
    expect(result.current.activeQuiz).toBeNull()
    act(() => rerender({ progressSeconds: 220 })) // back into "a" → stays closed
    expect(result.current.activeQuiz).toBeNull()
  })

  it('closes the popup when the user drags out of the window', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 100 })
    act(() => rerender({ progressSeconds: 216 }))
    expect(result.current.activeQuiz?.assessmentTemplate).toBe('a')

    // Seek (nonce bump) to a position outside the window → dismissed.
    act(() => rerender({ progressSeconds: 600, seekSignal: 1 }))
    expect(result.current.activeQuiz).toBeNull()
  })

  it('keeps the popup open on a seek that stays inside the window', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 100 })
    act(() => rerender({ progressSeconds: 216 }))
    act(() => rerender({ progressSeconds: 300, seekSignal: 1 }))
    expect(result.current.activeQuiz?.assessmentTemplate).toBe('a')
  })

  it('does not close on natural playback rolling past the window (no seek)', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 216 })
    expect(result.current.activeQuiz?.assessmentTemplate).toBe('a')
    // progress moves past endSec but seekSignal is unchanged → stays open.
    act(() => rerender({ progressSeconds: 400 }))
    expect(result.current.activeQuiz?.assessmentTemplate).toBe('a')
  })

  it('opens when the user scrubs directly into a window', () => {
    const { result, rerender } = renderQuiz({ progressSeconds: 600 })
    act(() => rerender({ progressSeconds: 300 }))
    expect(result.current.activeQuiz?.assessmentTemplate).toBe('a')
  })

  it('seeds from localStorage: auto_submitted/submitted never open, stopped still opens', () => {
    window.localStorage.setItem(
      `masai:in-lecture-quiz:${LECTURE_ID}`,
      JSON.stringify({ 'a@215': 'submitted', 'b@463': 'stopped' }),
    )

    const { result, rerender } = renderQuiz({ progressSeconds: 100 })
    // "a" is submitted (webhook-confirmed) → does not open
    act(() => rerender({ progressSeconds: 216 }))
    expect(result.current.activeQuiz).toBeNull()
    // "b" is stopped → still opens
    act(() => rerender({ progressSeconds: 470 }))
    expect(result.current.activeQuiz?.assessmentTemplate).toBe('b')
  })
})
