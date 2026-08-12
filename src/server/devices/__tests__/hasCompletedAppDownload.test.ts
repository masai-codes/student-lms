import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  hasAppLoginTracked,
  hasCompletedAppDownload,
} from '../hasCompletedAppDownload'

const hoisted = vi.hoisted(() => ({ select: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.select } }))
vi.mock('@/db/schema', () => ({
  userDeviceTokens: { id: 'id', userId: 'user_id' },
  users: { id: 'id', meta: 'meta' },
}))

/**
 * Queues the two parallel reads in evaluation order: device tokens, then the
 * user row.
 */
function queue(
  tokenRows: Array<{ id: number }>,
  userRows: Array<{ meta: unknown }>,
) {
  for (const rows of [tokenRows, userRows]) {
    hoisted.select.mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => rows }) }),
    })
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('hasAppLoginTracked', () => {
  it('is true when the meta key is present, as an object or a JSON string', () => {
    expect(
      hasAppLoginTracked({
        firstAppLoginTrackedAt: '2026-08-01T10:00:00+05:30',
      }),
    ).toBe(true)
    expect(
      hasAppLoginTracked(
        '{"firstAppLoginTrackedAt":"2026-08-01T10:00:00+05:30"}',
      ),
    ).toBe(true)
  })

  it('is false for absent, null, or unparseable meta', () => {
    expect(hasAppLoginTracked({ showWelcomeModal: true })).toBe(false)
    expect(hasAppLoginTracked({ firstAppLoginTrackedAt: null })).toBe(false)
    expect(hasAppLoginTracked(null)).toBe(false)
    expect(hasAppLoginTracked(undefined)).toBe(false)
    expect(hasAppLoginTracked('not json')).toBe(false)
  })
})

describe('hasCompletedAppDownload', () => {
  it('is complete on a device-token row alone', async () => {
    queue([{ id: 7 }], [{ meta: {} }])
    await expect(hasCompletedAppDownload(101)).resolves.toBe(true)
  })

  it('is complete on a tracked app login with no device token', async () => {
    queue(
      [],
      [{ meta: { firstAppLoginTrackedAt: '2026-08-01T10:00:00+05:30' } }],
    )
    await expect(hasCompletedAppDownload(102)).resolves.toBe(true)
  })

  it('is incomplete with neither signal', async () => {
    queue([], [{ meta: { showWelcomeModal: true } }])
    await expect(hasCompletedAppDownload(103)).resolves.toBe(false)
  })

  it('is incomplete when the user row is missing entirely', async () => {
    queue([], [])
    await expect(hasCompletedAppDownload(104)).resolves.toBe(false)
  })
})
