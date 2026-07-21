import { describe, expect, it } from 'vitest'

import {
  buildAssignmentProblemListItems,
  resolveProblemStatusChip,
} from '../buildAssignmentProblemListItems'

describe('resolveProblemStatusChip', () => {
  it('returns null for missing/empty status', () => {
    expect(resolveProblemStatusChip(null)).toBeNull()
    expect(resolveProblemStatusChip(undefined)).toBeNull()
    expect(resolveProblemStatusChip('   ')).toBeNull()
  })

  it('maps submitted to a completed chip', () => {
    expect(resolveProblemStatusChip('submitted')).toEqual({
      tone: 'completed',
      label: 'Completed',
    })
  })

  it('maps in-progress to an in-progress chip', () => {
    expect(resolveProblemStatusChip('in-progress')).toEqual({
      tone: 'in-progress',
      label: 'In Progress',
    })
  })

  it('maps any other status to a capitalized pending chip', () => {
    expect(resolveProblemStatusChip('pending')).toEqual({
      tone: 'pending',
      label: 'Pending',
    })
  })
})

describe('buildAssignmentProblemListItems', () => {
  const rows = [
    { elementId: 1, problemId: 11, title: 'Two Sum' },
    { elementId: 2, problemId: 12, title: 'Reverse List' },
  ]

  it('attaches the per-problem status chip from the solutions map', () => {
    const items = buildAssignmentProblemListItems(
      rows,
      new Map<number, string | null>([
        [11, 'submitted'],
        [12, 'pending'],
      ]),
    )

    expect(items).toEqual([
      {
        elementId: 1,
        problemId: 11,
        title: 'Two Sum',
        statusChip: { tone: 'completed', label: 'Completed' },
      },
      {
        elementId: 2,
        problemId: 12,
        title: 'Reverse List',
        statusChip: { tone: 'pending', label: 'Pending' },
      },
    ])
  })

  it('uses a null chip when a problem has no solution status', () => {
    const items = buildAssignmentProblemListItems(rows, new Map())

    expect(items.every((item) => item.statusChip === null)).toBe(true)
  })
})
