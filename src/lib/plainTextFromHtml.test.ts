import { describe, expect, it } from 'vitest'

import { plainTextFromHtml } from '@/lib/plainTextFromHtml'

describe('plainTextFromHtml', () => {
  it('strips tags and collapses whitespace', () => {
    expect(plainTextFromHtml('<p>a</p><p>b</p>')).toBe('a b')
  })
})
