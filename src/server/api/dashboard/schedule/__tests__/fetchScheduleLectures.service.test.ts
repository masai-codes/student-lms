import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
}))

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

describe('fetchScheduleLectures', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns [] without querying when there are no sections', async () => {
    hoisted.rows = [{ id: 1 }]
    const { fetchScheduleLectures } =
      await import('../fetchScheduleLectures.service')
    expect(await fetchScheduleLectures([], '2026-07-02', '2026-07-09')).toEqual(
      [],
    )
  })

  it('returns the queried rows', async () => {
    hoisted.rows = [{ id: 1, title: 'Workshop' }]
    const { fetchScheduleLectures } =
      await import('../fetchScheduleLectures.service')
    const result = await fetchScheduleLectures([5], '2026-07-02', '2026-07-09')
    expect(result).toEqual([{ id: 1, title: 'Workshop' }])
  })
})
