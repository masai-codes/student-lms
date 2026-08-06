import { describe, expect, it } from 'vitest'

import { isIvsZoomRedirection } from '../isIvsZoomRedirection'

describe('isIvsZoomRedirection', () => {
  it('detects ivs from a parsed object', () => {
    expect(isIvsZoomRedirection({ redirectionType: 'ivs' })).toBe(true)
  })

  it('detects ivs from a JSON string column', () => {
    expect(isIvsZoomRedirection('{"redirectionType":"ivs"}')).toBe(true)
  })

  it('is false for zoom redirection and for missing details', () => {
    expect(isIvsZoomRedirection({ redirectionType: 'zoom' })).toBe(false)
    expect(isIvsZoomRedirection({})).toBe(false)
    expect(isIvsZoomRedirection(null)).toBe(false)
    expect(isIvsZoomRedirection(undefined)).toBe(false)
  })

  it('is false for malformed JSON rather than throwing', () => {
    expect(isIvsZoomRedirection('{not json')).toBe(false)
  })
})
