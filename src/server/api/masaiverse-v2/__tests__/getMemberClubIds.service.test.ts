import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('@/db/schema', () => ({
  clubMembers: {
    userId: 'club_members.user_id',
    clubId: 'club_members.club_id',
  },
}))

/** Resolves a `select(...).from(...).where(...)` chain. */
function selectChain(rows: unknown) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getMemberClubIds', () => {
  it('returns the numeric club ids the user has joined', async () => {
    const { getMemberClubIds } = await import(
      '../services/getMemberClubIds.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([{ clubId: 7 }, { clubId: 3 }]),
    )
    await expect(getMemberClubIds(1)).resolves.toEqual([7, 3])
  })

  it('returns an empty array when the user is in no clubs', async () => {
    const { getMemberClubIds } = await import(
      '../services/getMemberClubIds.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))
    await expect(getMemberClubIds(1)).resolves.toEqual([])
  })
})
