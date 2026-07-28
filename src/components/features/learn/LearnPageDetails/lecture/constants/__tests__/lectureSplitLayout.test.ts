import { describe, expect, it } from 'vitest'

import { LECTURE_RAIL_MEDIA_QUERY } from '../lectureSplitLayout'

describe('lectureSplitLayout', () => {
  it('treats laptop/desktop widths as the resizable rail', () => {
    expect(LECTURE_RAIL_MEDIA_QUERY).toBe('(min-width: 1024px)')
  })
})
