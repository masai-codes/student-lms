// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useLectureChatWidth } from '../useLectureChatWidth'

function containerRef(clientWidth: number) {
  return { current: { clientWidth } as HTMLElement }
}

describe('useLectureChatWidth', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('defaults to a readable width and persists keyboard nudges', () => {
    const { result } = renderHook(() => useLectureChatWidth(containerRef(1600)))

    expect(result.current.width).toBe(440)

    act(() => result.current.nudge(24))
    expect(result.current.width).toBe(464)
    expect(window.localStorage.getItem('lecture-chat-width')).toBe('464')
  })

  it('clamps to the minimum chat width', () => {
    const { result } = renderHook(() => useLectureChatWidth(containerRef(1600)))

    act(() => result.current.nudge(-1000))
    expect(result.current.width).toBe(320)
  })

  it('clamps so the video keeps its minimum width', () => {
    // 900px container leaves at most 900 - 475 = 425 for the chat.
    const { result } = renderHook(() => useLectureChatWidth(containerRef(900)))

    act(() => result.current.nudge(1000))
    expect(result.current.width).toBe(425)
  })

  it('restores a stored width on mount', () => {
    window.localStorage.setItem('lecture-chat-width', '500')
    const { result } = renderHook(() => useLectureChatWidth(containerRef(1600)))

    expect(result.current.width).toBe(500)
  })
})
