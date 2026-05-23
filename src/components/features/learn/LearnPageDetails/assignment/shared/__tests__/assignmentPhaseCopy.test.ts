import { describe, expect, it } from 'vitest'

import { getAssignmentPhaseCopy } from '../assignmentPhaseCopy'

describe('getAssignmentPhaseCopy', () => {
  it('returns practice-specific copy for each phase', () => {
    expect(getAssignmentPhaseCopy('practice', 'before').title).toContain('Practice')
    expect(getAssignmentPhaseCopy('practice', 'during').title).toContain('open')
    expect(getAssignmentPhaseCopy('practice', 'after').description).toContain('not counted')
  })

  it('returns evaluation-specific copy', () => {
    expect(getAssignmentPhaseCopy('evaluation', 'during').title).toContain('Evaluation')
    expect(getAssignmentPhaseCopy('evaluation', 'after').description).toContain('closed')
  })

  it('returns assignment-specific copy for regular assignments', () => {
    expect(getAssignmentPhaseCopy('assignment', 'before').title).toContain('not open')
    expect(getAssignmentPhaseCopy('assignment', 'during').title).toContain('open')
  })
})
