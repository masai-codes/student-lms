import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbInsert: vi.fn(),
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
  dbDelete: vi.fn(),
  getAdminModeState: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    insert: hoisted.dbInsert,
    select: hoisted.dbSelect,
    update: hoisted.dbUpdate,
    delete: hoisted.dbDelete,
  },
}))
vi.mock('@/db/schema', () => ({
  masaiverseBanners: {
    id: 'masaiverse_banners.id',
    meta: 'masaiverse_banners.meta',
  },
  clubs: { meta: 'clubs.meta' },
  events: { meta: 'events.meta' },
}))
vi.mock('@/server/api/masaiverse-v2/services/adminMode.service', () => ({
  getAdminModeState: hoisted.getAdminModeState,
}))

function selectChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

const NOW = new Date('2026-06-08T10:00:00.000Z')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createMasaiverseBanner', () => {
  it('rejects a non-admin with a 403', async () => {
    const { createMasaiverseBanner } =
      await import('../services/createBanner.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: false,
      enabled: false,
    })
    await expect(createMasaiverseBanner(1, NOW)).rejects.toMatchObject({
      status: 403,
    })
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })

  it('inserts an unpublished draft owned by the admin', async () => {
    const { createMasaiverseBanner } =
      await import('../services/createBanner.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    const values = vi.fn().mockResolvedValue([{ insertId: 12 }])
    hoisted.dbInsert.mockReturnValue({ values })

    await expect(createMasaiverseBanner(7, NOW)).resolves.toEqual({ id: '12' })
    const inserted = values.mock.calls[0][0]
    expect(inserted.createdBy).toBe(7)
    expect(inserted.lastEditedBy).toBe(7)
    expect(inserted.meta).toEqual({ isPublished: false })
  })
})

describe('updateMasaiverseBanner', () => {
  it('rejects a non-admin with a 403', async () => {
    const { updateMasaiverseBanner } =
      await import('../services/updateBanner.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: false,
      enabled: false,
    })
    await expect(
      updateMasaiverseBanner(1, { bannerId: 5, column: { title: 'X' } }, NOW),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('404s when the banner is missing', async () => {
    const { updateMasaiverseBanner } =
      await import('../services/updateBanner.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))
    await expect(
      updateMasaiverseBanner(1, { bannerId: 99, column: { title: 'X' } }, NOW),
    ).rejects.toMatchObject({ status: 404, code: 'BANNER_NOT_FOUND' })
  })

  it('whitelists columns + meta, merges meta and stamps the editor', async () => {
    const { updateMasaiverseBanner } =
      await import('../services/updateBanner.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([{ meta: { keep: 1 } }]))
    const where = vi.fn().mockResolvedValue(undefined)
    const set = vi.fn().mockReturnValue({ where })
    hoisted.dbUpdate.mockReturnValue({ set })

    await expect(
      updateMasaiverseBanner(
        4,
        {
          bannerId: 5,
          column: { title: 'New', secret: 'ignored' },
          meta: { isPublished: true, bogus: 'ignored' },
        },
        NOW,
      ),
    ).resolves.toEqual({ success: true })

    const payload = set.mock.calls[0][0]
    expect(payload.title).toBe('New')
    expect(payload.secret).toBeUndefined()
    expect(payload.lastEditedBy).toBe(4)
    expect(payload.meta).toEqual({ keep: 1, isPublished: true })
  })
})

describe('deleteMasaiverseBanner', () => {
  it('rejects a non-admin with a 403', async () => {
    const { deleteMasaiverseBanner } =
      await import('../services/deleteBanner.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: false,
      enabled: false,
    })
    await expect(deleteMasaiverseBanner(1, 5)).rejects.toMatchObject({
      status: 403,
    })
    expect(hoisted.dbDelete).not.toHaveBeenCalled()
  })

  it('deletes the banner for an admin', async () => {
    const { deleteMasaiverseBanner } =
      await import('../services/deleteBanner.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    const where = vi.fn().mockResolvedValue(undefined)
    hoisted.dbDelete.mockReturnValue({ where })
    await expect(deleteMasaiverseBanner(1, 5)).resolves.toEqual({
      success: true,
    })
    expect(hoisted.dbDelete).toHaveBeenCalledTimes(1)
  })
})
