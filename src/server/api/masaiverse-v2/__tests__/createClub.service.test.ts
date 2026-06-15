import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbInsert: vi.fn(),
  getAdminModeState: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { insert: hoisted.dbInsert } }))
vi.mock('@/db/schema', () => ({ events: {}, clubs: {} }))
vi.mock('@/server/api/masaiverse-v2/services/adminMode.service', () => ({
  getAdminModeState: hoisted.getAdminModeState,
}))

const NOW = new Date('2026-06-07T10:00:00.000Z')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createMasaiverseClub', () => {
  it('rejects a non-admin with a 403 and never inserts', async () => {
    const { createMasaiverseClub } = await import(
      '../services/createClub.service'
    )
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: false, enabled: false })

    await expect(createMasaiverseClub(1, NOW)).rejects.toMatchObject({
      status: 403,
      code: 'MASAIVERSE_ADMIN_FORBIDDEN',
    })
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })

  it('inserts an unpublished draft owned by the admin and returns the id', async () => {
    const { createMasaiverseClub } = await import(
      '../services/createClub.service'
    )
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: true })
    const values = vi.fn().mockResolvedValue([{ insertId: 31 }])
    hoisted.dbInsert.mockReturnValue({ values })

    await expect(createMasaiverseClub(4, NOW)).resolves.toEqual({ id: '31' })

    const inserted = values.mock.calls[0][0]
    expect(inserted.createdBy).toBe(4)
    expect(inserted.name).toBe('New Club (Draft)')
    expect(inserted.image).toContain('picsum.photos')
    expect(inserted.meta.isPublished).toBe(false)
    expect(inserted.meta.lastEditedBy).toBe(4)
    expect(inserted.meta.lastEditedAt).toBe(NOW.toISOString())
    expect(inserted.meta.galleryImages).toHaveLength(4)
  })
})
