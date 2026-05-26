import { describe, expect, it } from 'vitest'

import { buildLearnDetailPresentation } from '../buildLearnDetailPresentation'

describe('buildLearnDetailPresentation', () => {
  it('uses Resource instead of Reading for reading lecture type tags', () => {
    const core = buildLearnDetailPresentation({
      id: 1,
      title: 'Pre-read',
      category: 'pre-read',
      type: 'reading',
      optional: 0,
      schedule: '2026-05-20T10:00:00.000Z',
      week: 1,
      module: null,
      hostName: 'Ravi Kumar',
    })

    expect(core.tags[0]).toBe('Resource')
    expect(core.tags[1]).toBe('Pre-Read')
  })

  it('keeps lecture type tags unchanged for non-reading types', () => {
    const core = buildLearnDetailPresentation({
      id: 2,
      title: 'DSA',
      category: 'coding',
      type: 'live',
      optional: 0,
      schedule: '2026-05-20T10:00:00.000Z',
      week: 2,
      module: 'week-2',
      hostName: 'Instructor',
    })

    expect(core.tags[0]).toBe('Live')
    expect(core.tags[1]).toBe('Coding')
  })
})
