// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExpandableTabContent } from '../ExpandableTabContent'

type ResizeObserverCallback = (entries: ReadonlyArray<unknown>) => void

class StubResizeObserver {
  static instances: Array<StubResizeObserver> = []
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    StubResizeObserver.instances.push(this)
  }
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  trigger() {
    this.callback([])
  }
}

function setScrollHeight(element: HTMLElement | null, value: number) {
  if (!element) return
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    get: () => value,
  })
}

const COLLAPSED_HEIGHT = 240

function flushObserver() {
  act(() => {
    StubResizeObserver.instances.forEach((instance) => instance.trigger())
  })
}

function renderWithScrollHeight(scrollHeight: number) {
  const utils = render(
    <ExpandableTabContent>
      <p>tab body content</p>
    </ExpandableTabContent>,
  )
  const body = screen.getByTestId('expandable-tab-content-body')
  setScrollHeight(body, scrollHeight)
  flushObserver()
  return { ...utils, body }
}

beforeEach(() => {
  StubResizeObserver.instances = []
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
  window.scrollTo = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ExpandableTabContent', () => {
  it('does not render the toggle or fade when content fits the cap', () => {
    renderWithScrollHeight(COLLAPSED_HEIGHT - 50)

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByTestId('expandable-tab-content-fade')).toBeNull()
  })

  it('clamps overflowing content and shows a Show more toggle', () => {
    const { body } = renderWithScrollHeight(COLLAPSED_HEIGHT * 4)

    expect(screen.getByRole('button', { name: 'Show more' })).toBeTruthy()
    expect(screen.getByTestId('expandable-tab-content-fade')).toBeTruthy()
    expect(body.style.maxHeight).toBe(`${COLLAPSED_HEIGHT}px`)
    expect(body.style.overflow).toBe('hidden')
  })

  it('expands to full height when toggled and collapses again on click', () => {
    const { body } = renderWithScrollHeight(COLLAPSED_HEIGHT * 4)

    fireEvent.click(screen.getByRole('button', { name: 'Show more' }))

    expect(body.style.maxHeight).toBe('')
    expect(screen.queryByTestId('expandable-tab-content-fade')).toBeNull()
    expect(screen.getByRole('button', { name: 'Show less' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }))

    expect(body.style.maxHeight).toBe(`${COLLAPSED_HEIGHT}px`)
    expect(screen.getByRole('button', { name: 'Show more' })).toBeTruthy()
  })

  it('respects a custom collapsedHeightPx', () => {
    render(
      <ExpandableTabContent collapsedHeightPx={120}>
        <p>tab body content</p>
      </ExpandableTabContent>,
    )
    const body = screen.getByTestId('expandable-tab-content-body')
    setScrollHeight(body, 300)
    flushObserver()

    expect(body.style.maxHeight).toBe('120px')
    expect(screen.getByRole('button', { name: 'Show more' })).toBeTruthy()
  })

  it('preserves window scroll position across toggles', () => {
    renderWithScrollHeight(COLLAPSED_HEIGHT * 4)

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 420 })
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 0
      })

    fireEvent.click(screen.getByRole('button', { name: 'Show more' }))

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 420,
      left: 0,
      behavior: 'instant',
    })
    requestAnimationFrameSpy.mockRestore()
  })
})
