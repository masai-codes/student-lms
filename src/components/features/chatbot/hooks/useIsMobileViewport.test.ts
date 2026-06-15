// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getIsMobileViewport,
  useIsMobileViewport,
} from '@/components/features/chatbot/hooks/useIsMobileViewport'

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>()
  const mediaQuery = {
    matches,
    addEventListener: (_event: string, listener: () => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_event: string, listener: () => void) => {
      listeners.delete(listener)
    },
    dispatchChange: (nextMatches: boolean) => {
      mediaQuery.matches = nextMatches
      listeners.forEach((listener) => listener())
    },
    media: '(max-width: 767px)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }

  vi.spyOn(window, 'matchMedia').mockImplementation(
    () => mediaQuery as unknown as MediaQueryList,
  )
  return mediaQuery
}

describe('useIsMobileViewport', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('returns true when viewport is below md breakpoint', () => {
    mockMatchMedia(true)
    expect(getIsMobileViewport()).toBe(true)

    const { result } = renderHook(() => useIsMobileViewport())
    expect(result.current).toBe(true)
  })

  it('returns false when viewport is at or above md breakpoint', () => {
    mockMatchMedia(false)
    expect(getIsMobileViewport()).toBe(false)

    const { result } = renderHook(() => useIsMobileViewport())
    expect(result.current).toBe(false)
  })

  it('updates when the media query changes', () => {
    const mediaQuery = mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobileViewport())

    expect(result.current).toBe(false)

    act(() => {
      mediaQuery.dispatchChange(true)
    })

    expect(result.current).toBe(true)
  })
})
