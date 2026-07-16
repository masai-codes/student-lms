import { describe, expect, it } from 'vitest'

import { deriveDiscussionTitleFromMessage } from '../deriveDiscussionTitleFromMessage'

describe('deriveDiscussionTitleFromMessage', () => {
  it('uses the first line of plain text as title', () => {
    expect(
      deriveDiscussionTitleFromMessage('<p>First line here</p><p>Second</p>'),
    ).toBe('First line here')
  })

  it('returns empty string for empty body', () => {
    expect(deriveDiscussionTitleFromMessage('<p></p>')).toBe('')
  })
})
