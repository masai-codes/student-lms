import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))

vi.mock('@/db/schema', () => ({
  clubMembers: {
    id: 'club_members.id',
    clubId: 'club_members.club_id',
    userId: 'club_members.user_id',
    meta: 'club_members.meta',
  },
}))

/** `db.select().from().where().limit()` */
function limitChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

function captureUpdate() {
  const setArgs: Array<unknown> = []
  hoisted.dbUpdate.mockReturnValueOnce({
    set: (value: unknown) => {
      setArgs.push(value)
      return { where: () => Promise.resolve(undefined) }
    },
  })
  return setArgs
}

const NOW = new Date('2026-06-04T10:00:00.000Z')

describe('recordClubVisit service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false for a non-finite club id without touching the db', async () => {
    const { recordClubVisit } = await import('../services/recordClubVisit.service')
    await expect(recordClubVisit(1, Number.NaN, NOW)).resolves.toBe(false)
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('does not write when the user is not a member', async () => {
    const { recordClubVisit } = await import('../services/recordClubVisit.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))

    await expect(recordClubVisit(1, 5, NOW)).resolves.toBe(false)
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })

  it('stamps lastVisitedAt while preserving sibling meta keys', async () => {
    const { recordClubVisit } = await import('../services/recordClubVisit.service')
    hoisted.dbSelect.mockReturnValueOnce(
      limitChain([{ id: 11, meta: { role: 'lead' } }]),
    )
    const setArgs = captureUpdate()

    await expect(recordClubVisit(1, 5, NOW)).resolves.toBe(true)
    expect(setArgs[0]).toEqual({
      meta: { role: 'lead', lastVisitedAt: '2026-06-04T10:00:00.000Z' },
    })
  })

  it('initializes meta when the column is null', async () => {
    const { recordClubVisit } = await import('../services/recordClubVisit.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([{ id: 7, meta: null }]))
    const setArgs = captureUpdate()

    await recordClubVisit(2, 9, NOW)
    expect(setArgs[0]).toEqual({
      meta: { lastVisitedAt: '2026-06-04T10:00:00.000Z' },
    })
  })
})
