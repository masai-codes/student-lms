import { describe, expect, it } from 'vitest'

import { LECTURE_RAIL_MEDIA_QUERY } from '../lectureSplitLayout'

describe('lectureSplitLayout', () => {
  it('treats laptop/desktop widths as the resizable rail', () => {
    // Must stay in Tailwind's `lg` unit (64rem), not the px equivalent, so the
    // mounted surface and the `lg:` classes can never disagree.
    expect(LECTURE_RAIL_MEDIA_QUERY).toBe('(min-width: 64rem)')
  })
})
