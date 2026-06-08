import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  getAdminModeState: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('@/db/schema', () => ({
  clubs: { id: 'clubs.id', name: 'clubs.name', meta: 'clubs.meta' },
}))
vi.mock('@/server/api/masaiverse-v2/services/adminMode.service', () => ({
  getAdminModeState: hoisted.getAdminModeState,
}))

function selectChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getClubEditData', () => {
  it('rejects a non-admin with a 403', async () => {
    const { getClubEditData } = await import('../services/getClubEditData.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: false, enabled: false })
    await expect(getClubEditData(1, 5)).rejects.toMatchObject({
      status: 403,
      code: 'MASAIVERSE_ADMIN_FORBIDDEN',
    })
  })

  it('404s when the club is missing', async () => {
    const { getClubEditData } = await import('../services/getClubEditData.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: true })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))
    await expect(getClubEditData(1, 99)).rejects.toMatchObject({
      status: 404,
      code: 'CLUB_NOT_FOUND',
    })
  })

  it('returns the raw name + meta for an admin', async () => {
    const { getClubEditData } = await import('../services/getClubEditData.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: true })
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([{ id: 5, name: 'Code Club', meta: { description: 'd', cardDescription: 'cd' } }]),
    )
    await expect(getClubEditData(1, 5)).resolves.toEqual({
      id: '5',
      name: 'Code Club',
      meta: { description: 'd', cardDescription: 'cd' },
    })
  })

  it('returns an empty meta object when the column is null', async () => {
    const { getClubEditData } = await import('../services/getClubEditData.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: true })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([{ id: 6, name: 'X', meta: null }]))
    await expect(getClubEditData(1, 6)).resolves.toEqual({
      id: '6',
      name: 'X',
      meta: {},
    })
  })
})
