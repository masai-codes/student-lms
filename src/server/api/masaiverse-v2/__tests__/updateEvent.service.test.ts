import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toMysqlUtc } from '@/lib/dateRanges'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
  getAdminModeState: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))
vi.mock('@/db/schema', () => ({ events: { id: 'events.id', meta: 'events.meta' }, clubs: {} }))
vi.mock('@/server/api/masaiverse-v2/services/adminMode.service', () => ({
  getAdminModeState: hoisted.getAdminModeState,
}))

function selectChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

function captureUpdate() {
  const where = vi.fn().mockResolvedValue(undefined)
  const set = vi.fn().mockReturnValue({ where })
  hoisted.dbUpdate.mockReturnValue({ set })
  return set
}

const NOW = new Date('2026-06-07T10:00:00.000Z')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('updateMasaiverseEvent', () => {
  it('rejects a non-admin with a 403 and never updates', async () => {
    const { updateMasaiverseEvent } = await import('../services/updateEvent.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: false, enabled: false })

    await expect(
      updateMasaiverseEvent(1, { eventId: 5, column: { title: 'X' } }, NOW),
    ).rejects.toMatchObject({ status: 403, code: 'MASAIVERSE_ADMIN_FORBIDDEN' })
    expect(hoisted.dbUpdate).not.toHaveBeenCalled()
  })

  it('404s when the event does not exist', async () => {
    const { updateMasaiverseEvent } = await import('../services/updateEvent.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: true })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))

    await expect(
      updateMasaiverseEvent(1, { eventId: 99, column: { title: 'X' } }, NOW),
    ).rejects.toMatchObject({ status: 404, code: 'EVENT_NOT_FOUND' })
  })

  it('updates whitelisted columns + merges meta, stamping the editor', async () => {
    const { updateMasaiverseEvent } = await import('../services/updateEvent.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: true })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([{ meta: { isPublished: true, keep: 1 } }]))
    const set = captureUpdate()

    await expect(
      updateMasaiverseEvent(
        9,
        {
          eventId: 5,
          column: { title: 'New title', notAllowed: 'ignored' },
          meta: { aboveTitle: 'Above', bogusMeta: 'ignored' },
        },
        NOW,
      ),
    ).resolves.toEqual({ success: true })

    const payload = set.mock.calls[0][0]
    expect(payload.title).toBe('New title')
    expect(payload.notAllowed).toBeUndefined()
    expect(payload.meta).toMatchObject({
      isPublished: true,
      keep: 1,
      aboveTitle: 'Above',
      lastEditedBy: 9,
      lastEditedAt: NOW.toISOString(),
    })
    expect(payload.meta.bogusMeta).toBeUndefined()
  })

  it('converts date columns to a MySQL UTC timestamp', async () => {
    const { updateMasaiverseEvent } = await import('../services/updateEvent.service')
    hoisted.getAdminModeState.mockResolvedValueOnce({ isAdmin: true, enabled: true })
    hoisted.dbSelect.mockReturnValueOnce(selectChain([{ meta: null }]))
    const set = captureUpdate()

    const iso = '2026-06-10T09:00:00.000Z'
    await updateMasaiverseEvent(9, { eventId: 5, column: { startTime: iso } }, NOW)

    const payload = set.mock.calls[0][0]
    expect(payload.startTime).toBe(toMysqlUtc(new Date(iso)))
  })
})
