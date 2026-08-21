// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

import { measureViewportBottomInset } from '../useViewportBottomInset'

function mountWithRect(tag: string, rect: Partial<DOMRect>) {
  const element = document.createElement(tag)
  element.dataset.testid = 'chrome'
  element.getBoundingClientRect = () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  })
  document.body.appendChild(element)
  return element
}

describe('measureViewportBottomInset', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('returns viewport space below the element top edge', () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    })
    mountWithRect('footer', { top: 680, bottom: 800, height: 120 })

    expect(measureViewportBottomInset('[data-testid="chrome"]')).toBe(120)
  })

  it('reserves nothing when the element is missing', () => {
    expect(measureViewportBottomInset('[data-testid="missing"]')).toBe(0)
  })

  it('reserves nothing for a hidden (zero-height) element', () => {
    // e.g. the mobile tab bar under `lg:hidden` on desktop reports a 0x0 rect.
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    })
    mountWithRect('nav', { top: 0, bottom: 0, height: 0 })

    expect(measureViewportBottomInset('[data-testid="chrome"]')).toBe(0)
  })
})
