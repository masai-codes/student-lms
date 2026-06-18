import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  dbDelete: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.dbSelect,
    insert: hoisted.dbInsert,
    delete: hoisted.dbDelete,
  },
}))

vi.mock('@/db/schema', () => ({
  clubs: { id: 'clubs.id' },
  clubMembers: {
    clubId: 'club_members.club_id',
    userId: 'club_members.user_id',
  },
}))

/** `db.select().from().where().limit()` */
function limitChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}
/** `db.select().from().where()` */
function whereChain(rows: unknown) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('setClubMembership', () => {
  it('rejects a non-finite club id', async () => {
    const { setClubMembership } =
      await import('../services/setClubMembership.service')
    await expect(setClubMembership(1, Number.NaN, true)).rejects.toThrow(
      'INVALID_CLUB_ID',
    )
  })

  it('rejects when the club does not exist', async () => {
    const { setClubMembership } =
      await import('../services/setClubMembership.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))
    await expect(setClubMembership(1, 5, true)).rejects.toThrow(
      'CLUB_NOT_FOUND',
    )
  })

  it('joins idempotently, stamps lastVisitedAt and returns the new count', async () => {
    const { setClubMembership } =
      await import('../services/setClubMembership.service')
    const onDuplicateKeyUpdate = vi.fn().mockResolvedValue(undefined)
    const values = vi.fn().mockReturnValue({ onDuplicateKeyUpdate })
    hoisted.dbInsert.mockReturnValue({ values })
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ id: 5 }]))
      .mockReturnValueOnce(whereChain([{ memberCount: 235 }]))

    const now = new Date('2026-06-07T10:00:00.000Z')
    await expect(setClubMembership(1, 5, true, now)).resolves.toEqual({
      isJoined: true,
      memberCount: 235,
    })
    expect(hoisted.dbInsert).toHaveBeenCalledTimes(1)
    // The join stamps `lastVisitedAt` so the new member counts as active
    // immediately, both on a fresh insert and on a re-join (duplicate key).
    const meta = { lastVisitedAt: now.toISOString() }
    expect(values).toHaveBeenCalledWith({ userId: 1, clubId: 5, meta })
    expect(onDuplicateKeyUpdate).toHaveBeenCalledWith({ set: { meta } })
    expect(hoisted.dbDelete).not.toHaveBeenCalled()
  })

  it('leaves the club and returns the decremented count', async () => {
    const { setClubMembership } =
      await import('../services/setClubMembership.service')
    const where = vi.fn().mockResolvedValue(undefined)
    hoisted.dbDelete.mockReturnValue({ where })
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ id: 5 }]))
      .mockReturnValueOnce(whereChain([{ memberCount: 233 }]))

    await expect(setClubMembership(1, 5, false)).resolves.toEqual({
      isJoined: false,
      memberCount: 233,
    })
    expect(hoisted.dbDelete).toHaveBeenCalledTimes(1)
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })
})
