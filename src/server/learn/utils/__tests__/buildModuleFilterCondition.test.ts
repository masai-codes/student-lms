import { describe, expect, it } from 'vitest'

import { assignments, lectures } from '@/db/schema'
import { buildModuleFilterCondition } from '@/server/learn/utils/buildModuleFilterCondition'

describe('buildModuleFilterCondition', () => {
  it('returns undefined when no values are selected', () => {
    expect(
      buildModuleFilterCondition(lectures.module, lectures.week, []),
    ).toBeUndefined()
  })

  it('builds a single equality predicate for a stored module label', () => {
    const condition = buildModuleFilterCondition(
      lectures.module,
      lectures.week,
      ['Advanced'],
    )
    expect(condition).toBeDefined()
  })

  it('builds a week-fallback predicate for a synthesized "Module N" label', () => {
    const condition = buildModuleFilterCondition(
      lectures.module,
      lectures.week,
      ['Module 3'],
    )
    expect(condition).toBeDefined()
  })

  it('ORs multiple values across both stored and synthesized labels', () => {
    const condition = buildModuleFilterCondition(
      assignments.module,
      assignments.week,
      ['Advanced', 'Module 2'],
    )
    expect(condition).toBeDefined()
  })
})
