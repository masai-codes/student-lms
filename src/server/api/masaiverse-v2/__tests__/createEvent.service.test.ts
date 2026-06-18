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

describe('createMasaiverseEvent', () => {
  it('rejects a non-admin with a 403 and never inserts', async () => {
    const { createMasaiverseEvent } =
      await import('../services/createEvent.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: false,
      enabled: false,
    })

    await expect(createMasaiverseEvent(1, NOW)).rejects.toMatchObject({
      status: 403,
      code: 'MASAIVERSE_ADMIN_FORBIDDEN',
    })
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })

  it('inserts an unpublished draft owned by the admin and returns the id', async () => {
    const { createMasaiverseEvent } =
      await import('../services/createEvent.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({
      isAdmin: true,
      enabled: true,
    })
    const values = vi.fn().mockResolvedValue([{ insertId: 77 }])
    hoisted.dbInsert.mockReturnValue({ values })

    await expect(createMasaiverseEvent(9, NOW)).resolves.toEqual({ id: '77' })

    const inserted = values.mock.calls[0][0]
    expect(inserted.createdBy).toBe(9)
    expect(inserted.title).toBe('New Event (Draft)')
    expect(inserted.category).toBe('meetup')
    expect(inserted.imageLink).toContain('picsum.photos')
    expect(inserted.meta.isPublished).toBe(false)
    expect(inserted.meta.lastEditedBy).toBe(9)
    expect(inserted.meta.lastEditedAt).toBe(NOW.toISOString())
    expect(inserted.meta.hostedBy).toHaveLength(1)
  })
})
