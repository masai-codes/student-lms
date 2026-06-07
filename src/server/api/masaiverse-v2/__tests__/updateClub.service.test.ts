import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
  getAdminModeState: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))
vi.mock('@/db/schema', () => ({ clubs: { id: 'clubs.id', meta: 'clubs.meta' }, events: {} }))
vi.mock('@/server/api/masaiverse-v2/services/adminMode.service', () => ({
  getAdminModeState: hoisted.getAdminModeState,
}))

function selectChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

const NOW = new Date('2026-06-07T10:00:00.000Z')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('updateMasaiverseClub', () => {
  it('rejects a non-admin with a 403 and never updates', async () => {
    const { updateMasaiverseClub } = await import('../services/updateClub.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: false, enabled: false })

    await expect(
      updateMasaiverseClub(1, { clubId: 5, column: { name: 'X' } }, NOW),
    ).rejects.toMatchObject({ status: 403, code: 'MASAIVERSE_ADMIN_FORBIDDEN' })
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })

  it('404s when the club does not exist', async () => {
    const { updateMasaiverseClub } = await import('../services/updateClub.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: true })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))

    await expect(
      updateMasaiverseClub(1, { clubId: 99, column: { name: 'X' } }, NOW),
    ).rejects.toMatchObject({ status: 404, code: 'CLUB_NOT_FOUND' })
  })

  it('updates whitelisted columns + merges meta, stamping the editor', async () => {
    const { updateMasaiverseClub } = await import('../services/updateClub.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: true })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([{ meta: { isPublished: false } }]))
    const where = vi.fn().mockResolvedValue(undefined)
    const set = vi.fn().mockReturnValue({ where })
    hoisted.dbUpdate.mockReturnValue({ set })

    await expect(
      updateMasaiverseClub(
        4,
        {
          clubId: 5,
          column: { name: 'Renamed', secret: 'ignored' },
          meta: { description: 'About', notAllowed: 'ignored' },
        },
        NOW,
      ),
    ).resolves.toEqual({ success: true })

    const payload = set.mock.calls[0][0]
    expect(payload.name).toBe('Renamed')
    expect(payload.secret).toBeUndefined()
    expect(payload.meta).toMatchObject({
      isPublished: false,
      description: 'About',
      lastEditedBy: 4,
      lastEditedAt: NOW.toISOString(),
    })
    expect(payload.meta.notAllowed).toBeUndefined()
  })
})
