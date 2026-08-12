// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useHasLayoutBox } from '../useHasLayoutBox'

/**
 * An element whose box count the test drives directly. jsdom does no layout, so
 * a real `display: none` can't be exercised — but the hook only ever reads
 * `getClientRects().length`, which is exactly what layout would decide.
 */
function makeRef(initialBoxes: number) {
  const element = document.createElement('div')
  const state = { boxes: initialBoxes }
  element.getClientRects = () =>
    ({ length: state.boxes }) as unknown as DOMRectList
  return { ref: { current: element }, state }
}

describe('useHasLayoutBox', () => {
  afterEach(() => {
    cleanup()
  })

  it('is false for an element with no layout box', () => {
    const { ref } = makeRef(0)
    const { result } = renderHook(() => useHasLayoutBox(ref))
    expect(result.current).toBe(false)
  })

  it('is true for an element that generates a box', () => {
    const { ref } = makeRef(1)
    const { result } = renderHook(() => useHasLayoutBox(ref))
    expect(result.current).toBe(true)
  })

  it('is false when the ref is empty', () => {
    const { result } = renderHook(() =>
      useHasLayoutBox({ current: null as HTMLElement | null }),
    )
    expect(result.current).toBe(false)
  })

  it('re-measures on resize — the hero rows swap at a breakpoint', () => {
    const { ref, state } = makeRef(0)
    const { result } = renderHook(() => useHasLayoutBox(ref))
    expect(result.current).toBe(false)

    state.boxes = 1
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(true)
  })

  it('re-measures on fullscreen change', () => {
    const { ref, state } = makeRef(1)
    const { result } = renderHook(() => useHasLayoutBox(ref))
    expect(result.current).toBe(true)

    // Entering fullscreen on the *other* row hides this one.
    state.boxes = 0
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'))
    })
    expect(result.current).toBe(false)
  })

  it('stops listening once unmounted', () => {
    const { ref, state } = makeRef(0)
    const { result, unmount } = renderHook(() => useHasLayoutBox(ref))
    unmount()

    // No update (and no act warning) should come out of this.
    state.boxes = 1
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(false)
  })
})
