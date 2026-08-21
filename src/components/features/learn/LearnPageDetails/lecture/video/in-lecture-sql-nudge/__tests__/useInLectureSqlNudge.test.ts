// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useInLectureSqlNudge } from '../useInLectureSqlNudge'
import type { InLecturePopupSqlSandboxElement } from '@/server/learn/lectureDetailTypes'

const ENTRIES: Array<InLecturePopupSqlSandboxElement> = [
  {
    id: 1,
    query: 'select * from a',
    status: 'success',
    error: null,
    executedAtSec: 100,
  },
  {
    id: 2,
    query: 'select * from b',
    status: 'success',
    error: null,
    executedAtSec: 300,
  },
]

type Props = {
  progressSeconds: number
  enabled?: boolean
}

function renderNudge(
  initial: Props,
  sqlSandbox: Array<InLecturePopupSqlSandboxElement> = ENTRIES,
) {
  return renderHook(
    ({ progressSeconds, enabled = true }: Props) =>
      useInLectureSqlNudge({
        sqlSandbox,
        progressSeconds,
        enabled,
      }),
    { initialProps: initial },
  )
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

beforeEach(() => {
  vi.useFakeTimers()
})

describe('useInLectureSqlNudge', () => {
  it('activates when playback enters the window', () => {
    const { result, rerender } = renderNudge({ progressSeconds: 50 })
    expect(result.current.activeEntry).toBeNull()

    act(() => rerender({ progressSeconds: 101 }))
    expect(result.current.activeEntry?.id).toBe(1)
  })

  it('auto-dismisses once playback leaves the window', () => {
    const { result, rerender } = renderNudge({ progressSeconds: 101 })
    expect(result.current.activeEntry?.id).toBe(1)

    act(() => rerender({ progressSeconds: 125 })) // 100 + 20s → gone
    expect(result.current.activeEntry).toBeNull()
  })

  it('auto-dismisses after 7 seconds even while still inside the window', () => {
    const { result, rerender } = renderNudge({ progressSeconds: 101 })
    expect(result.current.activeEntry?.id).toBe(1)

    act(() => rerender({ progressSeconds: 105 })) // still inside
    act(() => vi.advanceTimersByTime(7_000))
    expect(result.current.activeEntry).toBeNull()
  })

  it('opens a second entry after leaving the first (no stuck activeEntry)', () => {
    const { result, rerender } = renderNudge({ progressSeconds: 101 })
    expect(result.current.activeEntry?.id).toBe(1)

    act(() => rerender({ progressSeconds: 301 }))
    expect(result.current.activeEntry?.id).toBe(2)
  })

  it('dismissNudge closes it and does not immediately re-open inside the window', () => {
    const { result, rerender } = renderNudge({ progressSeconds: 101 })
    act(() => result.current.dismissNudge())
    expect(result.current.activeEntry).toBeNull()

    act(() => rerender({ progressSeconds: 105 })) // still inside
    expect(result.current.activeEntry).toBeNull()
  })

  it('re-arms after leaving the window post-dismiss', () => {
    const { result, rerender } = renderNudge({ progressSeconds: 101 })
    act(() => result.current.dismissNudge())
    act(() => rerender({ progressSeconds: 50 })) // leaves window
    act(() => rerender({ progressSeconds: 102 })) // re-enters
    expect(result.current.activeEntry?.id).toBe(1)
  })

  it('never activates when disabled (the non-owning dual-mounted instance)', () => {
    const { result, rerender } = renderNudge({
      progressSeconds: 50,
      enabled: false,
    })
    act(() => rerender({ progressSeconds: 101, enabled: false }))
    expect(result.current.activeEntry).toBeNull()
  })

  it('closes an active card when enabled flips to false', () => {
    const { result, rerender } = renderNudge({ progressSeconds: 101 })
    expect(result.current.activeEntry?.id).toBe(1)

    act(() => rerender({ progressSeconds: 101, enabled: false }))
    expect(result.current.activeEntry).toBeNull()
  })

  it('ignores entries with a null executedAtSec', () => {
    const entries: Array<InLecturePopupSqlSandboxElement> = [
      {
        id: 3,
        query: 'select 1',
        status: 'pending',
        error: null,
        executedAtSec: null,
      },
    ]
    const { result, rerender } = renderNudge({ progressSeconds: 0 }, entries)
    act(() => rerender({ progressSeconds: 500 }))
    expect(result.current.activeEntry).toBeNull()
  })
})
