import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  getAdminModeState: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, insert: hoisted.dbInsert },
}))
vi.mock('../services/adminMode.service', () => ({
  getAdminModeState: hoisted.getAdminModeState,
}))
vi.mock('@/db/schema', () => ({
  users: { id: 'users.id' },
  clubs: { id: 'clubs.id' },
  masaiverseLeaderboard: {},
}))

/** select().from().where().limit() */
const limitChain = (rows: unknown) => ({
  from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
})

let insertedValues: unknown
function mockInsert(insertId: number) {
  hoisted.dbInsert.mockReturnValue({
    values: (value: unknown) => {
      insertedValues = value
      return Promise.resolve([{ insertId }])
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  insertedValues = undefined
  hoisted.getAdminModeState.mockResolvedValue({ isAdmin: true, enabled: true })
})

async function load() {
  return (await import('../services/awardManualPoints.service'))
    .awardManualPoints
}

describe('awardManualPoints', () => {
  it('rejects a non-admin with 403 and never touches the db', async () => {
    const awardManualPoints = await load()
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: false,
      enabled: false,
    })
    await expect(
      awardManualPoints(1, { targetUserId: 2, points: 10, clubId: null }),
    ).rejects.toMatchObject({ status: 403 })
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })

  it('rejects an invalid target user id', async () => {
    const awardManualPoints = await load()
    await expect(
      awardManualPoints(1, {
        targetUserId: Number.NaN,
        points: 10,
        clubId: null,
      }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_USER_ID' })
  })

  it('rejects zero, non-integer, and out-of-range points', async () => {
    const awardManualPoints = await load()
    for (const points of [0, 1.5, 2_000_000]) {
      await expect(
        awardManualPoints(1, { targetUserId: 2, points, clubId: null }),
      ).rejects.toMatchObject({ status: 400, code: 'INVALID_POINTS' })
    }
  })

  it('404s when the target user does not exist', async () => {
    const awardManualPoints = await load()
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))
    await expect(
      awardManualPoints(1, { targetUserId: 2, points: 10, clubId: null }),
    ).rejects.toMatchObject({ status: 404, code: 'USER_NOT_FOUND' })
  })

  it('rejects an invalid club id and 404s a missing club', async () => {
    const awardManualPoints = await load()
    hoisted.dbSelect.mockReturnValueOnce(limitChain([{ id: 2 }]))
    await expect(
      awardManualPoints(1, { targetUserId: 2, points: 10, clubId: -3 }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_CLUB_ID' })

    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ id: 2 }]))
      .mockReturnValueOnce(limitChain([]))
    await expect(
      awardManualPoints(1, { targetUserId: 2, points: 10, clubId: 9 }),
    ).rejects.toMatchObject({ status: 404, code: 'CLUB_NOT_FOUND' })
  })

  it('inserts a community-wide manual award and returns its id', async () => {
    const awardManualPoints = await load()
    hoisted.dbSelect.mockReturnValueOnce(limitChain([{ id: 2 }]))
    mockInsert(77)

    await expect(
      awardManualPoints(5, { targetUserId: 2, points: 50, clubId: null }),
    ).resolves.toEqual({ id: '77' })
    expect(insertedValues).toEqual({
      userId: 2,
      createdBy: 5,
      reason: 'manual',
      points: 50,
      clubId: null,
    })
  })

  it('inserts a club-scoped manual award when the club exists', async () => {
    const awardManualPoints = await load()
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ id: 2 }]))
      .mockReturnValueOnce(limitChain([{ id: 9 }]))
    mockInsert(88)

    await expect(
      awardManualPoints(5, { targetUserId: 2, points: -20, clubId: 9 }),
    ).resolves.toEqual({ id: '88' })
    expect(insertedValues).toMatchObject({ clubId: 9, points: -20 })
  })
})
