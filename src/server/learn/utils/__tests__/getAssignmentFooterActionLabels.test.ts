import { describe, expect, it } from 'vitest'

import { getAssignmentFooterActionLabels } from '../getAssignmentFooterActionLabels'

describe('getAssignmentFooterActionLabels', () => {
  it('uses evaluation wording for evaluation kind', () => {
    expect(getAssignmentFooterActionLabels('evaluation')).toEqual({
      start: 'Start Evaluation',
      continue: 'Continue Evaluation',
    })
  })

  it('uses assignment wording for regular assignments', () => {
    expect(getAssignmentFooterActionLabels('assignment').start).toBe(
      'Start Assignment',
    )
  })

  it('uses practice wording for practice kind', () => {
    expect(getAssignmentFooterActionLabels('practice').start).toBe(
      'Start practice',
    )
  })
})
