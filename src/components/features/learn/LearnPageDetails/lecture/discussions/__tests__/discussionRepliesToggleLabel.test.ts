import { describe, expect, it } from 'vitest'

import { getDiscussionRepliesToggleLabel } from '../discussionRepliesToggleLabel'

describe('getDiscussionRepliesToggleLabel', () => {
  it('shows Reply when collapsed with zero replies', () => {
    expect(getDiscussionRepliesToggleLabel(false, 0)).toBe('Reply')
  })

  it('shows Hide replies when expanded', () => {
    expect(getDiscussionRepliesToggleLabel(true, 0)).toBe('Hide replies')
    expect(getDiscussionRepliesToggleLabel(true, 3)).toBe('Hide replies')
  })

  it('shows view reply counts when collapsed with replies', () => {
    expect(getDiscussionRepliesToggleLabel(false, 1)).toBe('View 1 reply')
    expect(getDiscussionRepliesToggleLabel(false, 4)).toBe('View 4 replies')
  })
})
