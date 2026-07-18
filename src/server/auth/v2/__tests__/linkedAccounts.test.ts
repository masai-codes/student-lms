import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

function mockSessionsThenUsers(
  peerSessions: Array<{ id: string; userId: number | null }>,
  userRows: Array<{
    id: number
    name: string
    email: string
    mobile: string | null
    role: string | null
  }>,
) {
  hoisted.dbSelect
    .mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(peerSessions) }),
    })
    .mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve(userRows) }),
    })
}

describe('getLinkedAccountsForPayload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only accounts whose session row still exists, marking the active one', async () => {
    const { getLinkedAccountsForPayload } = await import('../linkedAccounts')

    const payload = {
      sessionId: 'session-a',
      sessions: [
        { sessionId: 'session-a', exp: 1, absExp: 1, stepHours: 72 },
        { sessionId: 'session-b', exp: 1, absExp: 1, stepHours: 72 },
        // session-c is in the token but was revoked elsewhere (row deleted).
      ],
    }
    // Only session-a and session-b rows still exist in the DB.
    mockSessionsThenUsers(
      [
        { id: 'session-a', userId: 1 },
        { id: 'session-b', userId: 2 },
      ],
      [
        { id: 1, name: 'Primary', email: 'a@x.com', mobile: null, role: 'student' },
        { id: 2, name: 'Secondary', email: 'b@x.com', mobile: null, role: 'student' },
      ],
    )

    const accounts = await getLinkedAccountsForPayload(payload)
    expect(accounts).toHaveLength(2)
    expect(accounts.find((a) => a.sessionId === 'session-a')?.isActive).toBe(
      true,
    )
    expect(accounts.find((a) => a.sessionId === 'session-b')?.isActive).toBe(
      false,
    )
  })

  it('returns an empty list when the token has no known sessions', async () => {
    const { getLinkedAccountsForPayload } = await import('../linkedAccounts')
    const accounts = await getLinkedAccountsForPayload({
      sessionId: 'session-a',
      sessions: [],
    })
    expect(accounts).toEqual([])
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })
})

describe('isSessionLinkedTo', () => {
  it('is true only for a sessionId already present in the token', async () => {
    const { isSessionLinkedTo } = await import('../linkedAccounts')
    const payload = {
      sessionId: 'session-a',
      sessions: [
        { sessionId: 'session-a', exp: 1, absExp: 1, stepHours: 72 },
        { sessionId: 'session-b', exp: 1, absExp: 1, stepHours: 72 },
      ],
    }
    expect(isSessionLinkedTo({ payload, targetSessionId: 'session-b' })).toBe(
      true,
    )
    expect(isSessionLinkedTo({ payload, targetSessionId: 'session-z' })).toBe(
      false,
    )
  })
})
