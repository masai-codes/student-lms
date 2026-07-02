import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>> }))

vi.mock('@/db', () => {
  const chain: Record<string, unknown> = {
    select: () => chain,
    from: () => chain,
    where: () => Promise.resolve(hoisted.rows),
  }
  return { db: chain }
})

describe('fetchAssignmentStartState', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns an empty set without querying for no assignment ids', async () => {
    hoisted.rows = [{ assignmentId: 1, started: 1, data: null }]
    const { fetchAssignmentStartState } = await import('../fetchAssignmentStartState')
    expect((await fetchAssignmentStartState(42, [])).size).toBe(0)
  })

  it('marks an assignment begun when started = 1 or the assess link was clicked', async () => {
    hoisted.rows = [
      { assignmentId: 1, started: 1, data: null },
      { assignmentId: 2, started: 0, data: { assess_platform_link_clicked: true } },
      { assignmentId: 3, started: 0, data: { other: 'x' } }, // untouched → NOT begun
      { assignmentId: 4, started: 0, data: null }, // draft row → NOT begun
    ]
    const { fetchAssignmentStartState } = await import('../fetchAssignmentStartState')

    const begun = await fetchAssignmentStartState(42, [1, 2, 3, 4])
    expect([...begun].sort()).toEqual([1, 2])
  })
})
