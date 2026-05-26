import { describe, expect, it } from 'vitest'

import { getAssignmentNotStartedBannerCopy } from '../getAssignmentNotStartedBannerCopy'

describe('getAssignmentNotStartedBannerCopy', () => {
  it('returns assignment copy for regular assignments', () => {
    expect(getAssignmentNotStartedBannerCopy('assignment')).toEqual({
      title: "Assignment hasn't started yet",
      description: 'Assignment will be unlocked and available at',
    })
  })

  it('returns practice copy for practice assignments', () => {
    expect(getAssignmentNotStartedBannerCopy('practice').title).toContain('Practice')
  })

  it('returns evaluation copy for evaluations', () => {
    expect(getAssignmentNotStartedBannerCopy('evaluation').title).toContain('Evaluation')
  })
})
