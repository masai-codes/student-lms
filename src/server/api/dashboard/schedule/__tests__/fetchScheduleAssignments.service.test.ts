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

describe('fetchScheduleAssignments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns [] without querying when there are no sections', async () => {
    hoisted.rows = [{ id: 1 }]
    const { fetchScheduleAssignments } = await import('../fetchScheduleAssignments.service')
    expect(await fetchScheduleAssignments([], '2026-07-02', '2026-07-09')).toEqual([])
  })

  it('normalises rows with null module and zoomLink (assignments have neither)', async () => {
    hoisted.rows = [{ id: 1, title: 'Assignment', sectionId: 5 }]
    const { fetchScheduleAssignments } = await import('../fetchScheduleAssignments.service')
    const [assignment] = await fetchScheduleAssignments([5], '2026-07-02', '2026-07-09')
    expect(assignment).toMatchObject({ id: 1, title: 'Assignment', module: null, zoomLink: null })
  })
})
