// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

import { getIsMobileViewport } from '../useIsMobileViewport'

/**
 * Point the viewport at a device. `touch` drives `pointer: coarse` through
 * `navigator.maxTouchPoints` (see the matchMedia polyfill in `vitest.setup.ts`).
 */
function setViewport(width: number, height: number, touch = false) {
  for (const [key, value] of [
    ['innerWidth', width],
    ['innerHeight', height],
  ] as const) {
    Object.defineProperty(window, key, {
      value,
      configurable: true,
      writable: true,
    })
  }
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: touch ? 5 : 0,
    configurable: true,
  })
}

describe('getIsMobileViewport', () => {
  afterEach(() => {
    // jsdom's defaults, so a leaked viewport can't bleed into another file.
    setViewport(1024, 768)
  })

  it('matches a phone in portrait', () => {
    setViewport(390, 844, true)
    expect(getIsMobileViewport()).toBe(true)
  })

  it('matches a phone in landscape', () => {
    // The regression this guards: fullscreen locks the screen to landscape, so
    // a phone reports an 844px width and used to read as a desktop.
    setViewport(844, 390, true)
    expect(getIsMobileViewport()).toBe(true)
  })

  it('leaves a short desktop window on the desktop surface', () => {
    // Same height as the landscape phone above — only the pointer differs.
    setViewport(1440, 390)
    expect(getIsMobileViewport()).toBe(false)
  })

  it('leaves a tablet on the desktop surface in either rotation', () => {
    setViewport(768, 1024, true)
    expect(getIsMobileViewport()).toBe(false)
    setViewport(1024, 768, true)
    expect(getIsMobileViewport()).toBe(false)
  })

  it('does not match a desktop', () => {
    setViewport(1440, 900)
    expect(getIsMobileViewport()).toBe(false)
  })
})
