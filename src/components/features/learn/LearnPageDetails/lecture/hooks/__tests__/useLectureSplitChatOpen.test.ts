// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useLectureSplitChatOpen } from '../useLectureSplitChatOpen'

describe('useLectureSplitChatOpen', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('auto-opens on the rail viewport on mount', () => {
    const { result } = renderHook(() => useLectureSplitChatOpen())

    expect(result.current.isOpen).toBe(true)
  })

  it('ignores a previously stored closed preference and still opens on reload', () => {
    // We intentionally do not persist the open state anymore: every reload
    // re-surfaces the AI chat to remind returning users it exists.
    window.localStorage.setItem('lecture-split-chat-open', 'false')

    const { result } = renderHook(() => useLectureSplitChatOpen())

    expect(result.current.isOpen).toBe(true)
  })

  it('toggles open and close without persisting to storage', () => {
    const { result } = renderHook(() => useLectureSplitChatOpen())

    act(() => {
      result.current.close()
    })
    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)

    // The open/closed state is never written to localStorage.
    expect(window.localStorage.getItem('lecture-split-chat-open')).toBeNull()
  })
})
