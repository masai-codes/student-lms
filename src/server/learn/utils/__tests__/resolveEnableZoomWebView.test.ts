import { describe, expect, it } from 'vitest'

import { resolveEnableZoomWebView } from '../resolveEnableZoomWebView'

describe('resolveEnableZoomWebView', () => {
  it('returns true only when the flag is strictly boolean true', () => {
    expect(resolveEnableZoomWebView({ enableZoomWebView: true })).toBe(true)
  })

  it('returns false when the flag is false, missing, or truthy-but-not-true', () => {
    expect(resolveEnableZoomWebView({ enableZoomWebView: false })).toBe(false)
    expect(resolveEnableZoomWebView({ enableZoomWebView: 1 })).toBe(false)
    expect(resolveEnableZoomWebView({ enableZoomWebView: 'true' })).toBe(false)
    expect(resolveEnableZoomWebView({ otherKey: 1 })).toBe(false)
    expect(resolveEnableZoomWebView({})).toBe(false)
  })

  it('returns false for non-object settings (null/undefined/primitive)', () => {
    expect(resolveEnableZoomWebView(null)).toBe(false)
    expect(resolveEnableZoomWebView(undefined)).toBe(false)
    expect(resolveEnableZoomWebView('enableZoomWebView')).toBe(false)
    expect(resolveEnableZoomWebView(42)).toBe(false)
  })
})
