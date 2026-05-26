import { describe, expect, it } from 'vitest'

import { learnDiscussionsEmptyStateNoun } from '../discussionsEmptyStateCopy'

describe('learnDiscussionsEmptyStateNoun', () => {
  it('returns the entity noun for each context', () => {
    expect(learnDiscussionsEmptyStateNoun('lecture')).toBe('lecture')
    expect(learnDiscussionsEmptyStateNoun('assignment')).toBe('assignment')
    expect(learnDiscussionsEmptyStateNoun('resource')).toBe('resource')
  })
})
