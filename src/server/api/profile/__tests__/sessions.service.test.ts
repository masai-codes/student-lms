import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getSessions,
  removeOtherSessions,
  removeSession,
} from '@/server/api/profile/sessions.service'

const select = vi.hoisted(() => vi.fn())
const deleteWhere = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: {
    select: (...args: Array<unknown>) => select(...args),
    delete: () => ({
      where: (...args: Array<unknown>) => deleteWhere(...args),
    }),
  },
}))

/** `getSessions` chain: select→from→where→orderBy. */
function withSessionRows(rows: Array<Record<string, unknown>>) {
  select.mockReturnValue({
    from: () => ({
      where: () => ({ orderBy: () => Promise.resolve(rows) }),
    }),
  })
}

/** Ownership-lookup chain: select→from→where→limit. */
function withOwnershipRows(rows: Array<Record<string, unknown>>) {
  select.mockReturnValue({
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  })
}

/** `removeOtherSessions` chain: select→from→where (no limit/orderBy). */
function withRevocableRows(rows: Array<Record<string, unknown>>) {
  select.mockReturnValue({
    from: () => ({ where: () => Promise.resolve(rows) }),
  })
}

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

beforeEach(() => {
  vi.clearAllMocks()
  deleteWhere.mockReturnValue(Promise.resolve(undefined))
})

describe('getSessions', () => {
  it('humanises the user agent and flags the caller’s own session', async () => {
    withSessionRows([
      { id: 'sess-a', userAgent: CHROME_MAC, lastActivity: 1_700_000_000 },
      { id: 'sess-b', userAgent: null, lastActivity: 1_699_000_000 },
    ])

    await expect(getSessions(7, 'sess-a')).resolves.toEqual([
      {
        id: 'sess-a',
        device: 'Chrome 120 on macOS',
        deviceKind: 'laptop',
        lastActiveAt: 1_700_000_000,
        isCurrent: true,
      },
      {
        id: 'sess-b',
        device: 'Unknown device',
        deviceKind: 'laptop',
        lastActiveAt: 1_699_000_000,
        isCurrent: false,
      },
    ])
  })

  it('returns an empty list when the student has no sessions', async () => {
    withSessionRows([])
    await expect(getSessions(7, 'sess-a')).resolves.toEqual([])
  })

  it('flags nothing as current when the session id is unknown', async () => {
    withSessionRows([{ id: 'sess-a', userAgent: null, lastActivity: 1 }])
    const [session] = await getSessions(7, null)
    expect(session.isCurrent).toBe(false)
  })
})

describe('removeSession', () => {
  it('deletes a session the caller owns', async () => {
    withOwnershipRows([{ id: 'sess-b' }])
    await expect(removeSession(7, 'sess-b', 'sess-a')).resolves.toBeUndefined()
    expect(deleteWhere).toHaveBeenCalledTimes(1)
  })

  it('rejects an empty session id', async () => {
    await expect(removeSession(7, '', 'sess-a')).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_SESSION_ID',
    })
    expect(deleteWhere).not.toHaveBeenCalled()
  })

  it('refuses to revoke the caller’s own session', async () => {
    await expect(removeSession(7, 'sess-a', 'sess-a')).rejects.toMatchObject({
      status: 409,
      code: 'CANNOT_REVOKE_CURRENT_SESSION',
    })
    expect(deleteWhere).not.toHaveBeenCalled()
  })

  it('404s (rather than deleting) a session belonging to someone else', async () => {
    withOwnershipRows([])
    await expect(removeSession(7, 'other', 'sess-a')).rejects.toMatchObject({
      status: 404,
      code: 'SESSION_NOT_FOUND',
    })
    expect(deleteWhere).not.toHaveBeenCalled()
  })
})

describe('removeOtherSessions', () => {
  it('revokes every other session and reports the count', async () => {
    withRevocableRows([{ id: 'sess-b' }, { id: 'sess-c' }])
    await expect(removeOtherSessions(7, 'sess-a')).resolves.toBe(2)
    expect(deleteWhere).toHaveBeenCalledTimes(1)
  })

  it('is a no-op when there is nothing else to revoke', async () => {
    withRevocableRows([])
    await expect(removeOtherSessions(7, 'sess-a')).resolves.toBe(0)
    expect(deleteWhere).not.toHaveBeenCalled()
  })

  it('revokes all sessions when the current one cannot be identified', async () => {
    withRevocableRows([{ id: 'sess-a' }])
    await expect(removeOtherSessions(7, null)).resolves.toBe(1)
    expect(deleteWhere).toHaveBeenCalledTimes(1)
  })
})
