import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>> }))

vi.mock('@/db', () => {
  const chain: Record<string, unknown> = {
    select: () => chain,
    from: () => chain,
    leftJoin: () => chain,
    innerJoin: () => chain,
    where: () => chain,
    orderBy: () => Promise.resolve(hoisted.rows),
  }
  return { db: chain }
})

describe('fetchPendingAssignments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns [] without querying when there are no sections', async () => {
    hoisted.rows = [{ id: 1 }]
    const { fetchPendingAssignments } = await import('../fetchPendingAssignments')
    expect(await fetchPendingAssignments([], '2026-07-02 12:00:00')).toEqual([])
  })

  it('normalises rows with null module/zoomLink', async () => {
    hoisted.rows = [{ id: 1, title: 'A', sectionId: 5 }]
    const { fetchPendingAssignments } = await import('../fetchPendingAssignments')
    const [assignment] = await fetchPendingAssignments([5], '2026-07-02 12:00:00')
    expect(assignment).toMatchObject({ id: 1, module: null, zoomLink: null })
  })
})

describe('fetchPendingLectures', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns [] without querying when there are no sections', async () => {
    hoisted.rows = [{ id: 1 }]
    const { fetchPendingLectures } = await import('../fetchPendingLectures')
    expect(await fetchPendingLectures([], '2026-07-02 12:00:00')).toEqual([])
  })

  it('returns the queried lecture rows', async () => {
    hoisted.rows = [{ id: 10, title: 'Lecture', sectionId: 5 }]
    const { fetchPendingLectures } = await import('../fetchPendingLectures')
    expect(await fetchPendingLectures([5], '2026-07-02 12:00:00')).toEqual([
      { id: 10, title: 'Lecture', sectionId: 5 },
    ])
  })
})
