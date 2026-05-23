import { describe, expect, it } from 'vitest'

import { getResourcePhaseCopy } from '../resourcePhaseCopy'

describe('getResourcePhaseCopy', () => {
  it('returns pre-read copy for each phase', () => {
    expect(getResourcePhaseCopy('pre-read', 'before').title).toContain('Pre-read')
    expect(getResourcePhaseCopy('pre-read', 'during').title).toContain('available')
  })

  it('returns notes copy', () => {
    expect(getResourcePhaseCopy('notes', 'after').description).toContain('review')
  })

  it('returns material copy', () => {
    expect(getResourcePhaseCopy('material', 'before').title).toContain('not available')
  })
})
