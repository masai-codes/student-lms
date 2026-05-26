import { describe, expect, it } from 'vitest'

import { resolveAssignmentListingStatusChip } from '../resolveAssignmentListingStatusChip'

describe('resolveAssignmentListingStatusChip', () => {
  it('returns practice-mode for overdue practice assignments', () => {
    expect(resolveAssignmentListingStatusChip('overdue', 'practice')).toBe('practice-mode')
  })

  it('hides chip for overdue evaluation assignments', () => {
    expect(resolveAssignmentListingStatusChip('overdue', 'evaluation')).toBeNull()
  })

  it('shows in-progress status when applicable', () => {
    expect(resolveAssignmentListingStatusChip('in-progress', 'coding')).toBe('in-progress')
  })
})
