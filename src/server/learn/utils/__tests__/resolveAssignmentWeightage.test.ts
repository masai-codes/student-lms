import { describe, expect, it } from 'vitest'

import { resolveAssignmentWeightage } from '../resolveAssignmentWeightage'

describe('resolveAssignmentWeightage', () => {
  it('reads a numeric weightagePercentage', () => {
    expect(resolveAssignmentWeightage({ weightagePercentage: 20 })).toBe(20)
  })

  it('coerces a numeric string', () => {
    expect(resolveAssignmentWeightage({ weightagePercentage: '7.5' })).toBe(7.5)
  })

  it('returns null for missing, empty, zero, negative or non-numeric values', () => {
    expect(resolveAssignmentWeightage(null)).toBeNull()
    expect(resolveAssignmentWeightage(undefined)).toBeNull()
    expect(resolveAssignmentWeightage('{}')).toBeNull()
    expect(resolveAssignmentWeightage({})).toBeNull()
    for (const weightagePercentage of [0, -5, 'abc', null]) {
      expect(resolveAssignmentWeightage({ weightagePercentage })).toBeNull()
    }
  })
})
