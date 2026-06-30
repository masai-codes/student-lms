// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedCommit } from '../useDebouncedCommit'

describe('useDebouncedCommit', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('updates the local value instantly and commits once after the delay', () => {
    const commit = vi.fn()
    const { result } = renderHook(() =>
      useDebouncedCommit<string>('', commit, 300),
    )

    act(() => result.current[1]('react'))
    expect(result.current[0]).toBe('react') // instant
    expect(commit).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(300))
    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith('react')
  })

  it('coalesces rapid updates into a single commit', () => {
    const commit = vi.fn()
    const { result } = renderHook(() =>
      useDebouncedCommit<Array<string>>([], commit, 300),
    )

    act(() => result.current[1](['a']))
    act(() => result.current[1](['a', 'b']))
    act(() => vi.advanceTimersByTime(300))

    expect(commit).toHaveBeenCalledTimes(1)
    expect(commit).toHaveBeenCalledWith(['a', 'b'])
  })

  it('keeps a local edit when committed changes by reference but not by value', () => {
    const { result, rerender } = renderHook(
      ({ committed }) => useDebouncedCommit(committed, vi.fn(), 300),
      { initialProps: { committed: ['a'] as Array<string> } },
    )

    act(() => result.current[1](['a', 'b']))
    rerender({ committed: ['a'] }) // new array, same contents
    expect(result.current[0]).toEqual(['a', 'b'])
  })

  it('re-syncs when the committed value genuinely changes', () => {
    const { result, rerender } = renderHook(
      ({ committed }) => useDebouncedCommit(committed, vi.fn(), 300),
      { initialProps: { committed: ['a'] as Array<string> } },
    )

    rerender({ committed: ['x'] })
    expect(result.current[0]).toEqual(['x'])
  })
})
