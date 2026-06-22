import { describe, expect, it } from 'vitest'

import { isValidSubmissionUrl } from './isValidSubmissionUrl'

describe('isValidSubmissionUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isValidSubmissionUrl('https://github.com/x/y')).toBe(true)
    expect(isValidSubmissionUrl('http://example.com')).toBe(true)
    expect(isValidSubmissionUrl('  https://x.test  ')).toBe(true)
  })

  it('rejects empty, non-url, and non-http protocols', () => {
    expect(isValidSubmissionUrl('')).toBe(false)
    expect(isValidSubmissionUrl('   ')).toBe(false)
    expect(isValidSubmissionUrl('not a url')).toBe(false)
    expect(isValidSubmissionUrl('ftp://example.com')).toBe(false)
    expect(isValidSubmissionUrl('javascript:alert(1)')).toBe(false)
  })
})
