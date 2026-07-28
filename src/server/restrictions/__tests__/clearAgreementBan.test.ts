// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAgreementBan } from '../clearAgreementBan'

const hoisted = vi.hoisted(() => ({
  rows: [] as Array<{ id: number; meta: string | null }>,
  writes: [] as string[],
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({ where: () => Promise.resolve(hoisted.rows) }),
    }),
    update: () => ({
      set: (v: { meta: string }) => {
        hoisted.writes.push(v.meta)
        return { where: () => Promise.resolve() }
      },
    }),
  },
}))

/** Same flatten the read path (getUserBatchRestrictions) uses. */
function flatten(meta: string): Record<string, unknown> {
  const parsed = JSON.parse(meta)
  if (Array.isArray(parsed)) {
    return parsed.reduce<Record<string, unknown>>((acc, item) => {
      if (item && typeof item === 'object' && !Array.isArray(item))
        Object.assign(acc, item)
      return acc
    }, {})
  }
  return parsed
}

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.rows = []
  hoisted.writes = []
})

describe('clearAgreementBan', () => {
  it('clears an object-shaped ban', async () => {
    hoisted.rows = [
      { id: 1, meta: JSON.stringify({ aggrementBanned: true, aggrementBannedDate: '2026-07-03' }) },
    ]
    await clearAgreementBan(10, 5)
    expect(hoisted.writes).toHaveLength(1)
    expect(flatten(hoisted.writes[0]).aggrementBanned).not.toBe(true)
  })

  it('clears a single-element array ban and preserves other keys', async () => {
    hoisted.rows = [
      { id: 1, meta: JSON.stringify([{ Freshmen: '2021-11-15', aggrementBanned: true }]) },
    ]
    await clearAgreementBan(10, 5)
    const written = flatten(hoisted.writes[0])
    expect(written.aggrementBanned).not.toBe(true)
    expect(written.Freshmen).toBe('2021-11-15')
  })

  it('is a no-op when not banned', async () => {
    hoisted.rows = [{ id: 1, meta: JSON.stringify([{ Freshmen: '2021-11-15' }]) }]
    await clearAgreementBan(10, 5)
    expect(hoisted.writes).toHaveLength(0)
  })

  it('clears a ban stored in a later array element', async () => {
    // Read + detection flatten ALL elements, so the user reads as banned. The
    // unban must survive the same flatten.
    hoisted.rows = [
      { id: 1, meta: JSON.stringify([{ a: 1 }, { aggrementBanned: true }]) },
    ]
    await clearAgreementBan(10, 5)
    expect(hoisted.writes).toHaveLength(1)
    expect(flatten(hoisted.writes[0]).aggrementBanned).not.toBe(true)
  })
})
