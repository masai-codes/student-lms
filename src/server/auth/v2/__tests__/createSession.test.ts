import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbInsert: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { insert: hoisted.dbInsert },
}))

function request() {
  return new Request('http://test/local', { method: 'POST' })
}

describe('createSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET_KEY = 'test-secret'
    process.env.COOKIE_NAME = 'lms_session'
    hoisted.dbInsert.mockReturnValue({ values: () => Promise.resolve() })
  })

  it('mints a fresh, isolated token when linkTo is absent', async () => {
    const { createSessions } = await import('../createSession')
    const { verifySessionToken } = await import('../sessionToken')

    const result = await createSessions({
      userIds: [1],
      request: request(),
      source: 'test',
    })

    const decoded = verifySessionToken(result.activeToken)
    expect(decoded?.sessions).toHaveLength(1)
    expect(decoded?.sessionId).toBe(result.activeSessionId)
  })

  it('appends the new session onto linkTo.sessions and switches active to it, without touching prior entries', async () => {
    const { createSessions } = await import('../createSession')
    const { verifySessionToken } = await import('../sessionToken')

    const now = Math.floor(Date.now() / 1000)
    const priorEntry = {
      sessionId: 'session-a',
      exp: now + 12345,
      absExp: now + 999_999,
      stepHours: 720,
    }

    const result = await createSessions({
      userIds: [2],
      request: request(),
      source: 'test',
      linkTo: { sessionId: 'session-a', sessions: [priorEntry] },
    })

    const decoded = verifySessionToken(result.activeToken)
    // Active session switches to the newly added account...
    expect(decoded?.sessionId).toBe(result.activeSessionId)
    expect(decoded?.sessionId).not.toBe('session-a')
    // ...while the prior account's entry survives completely untouched.
    expect(decoded?.sessions).toContainEqual(priorEntry)
    expect(decoded?.sessions).toHaveLength(2)
  })

  it('merges every newly matched user (phone-OTP multi-match) into linkTo.sessions in one go', async () => {
    const { createSessions } = await import('../createSession')
    const { verifySessionToken } = await import('../sessionToken')

    const now = Math.floor(Date.now() / 1000)
    const priorEntry = {
      sessionId: 'session-a',
      exp: now + 5000,
      absExp: now + 999_999,
      stepHours: 72,
    }

    const result = await createSessions({
      userIds: [10, 11],
      request: request(),
      source: 'test',
      linkTo: { sessionId: 'session-a', sessions: [priorEntry] },
    })

    const decoded = verifySessionToken(result.activeToken)
    expect(decoded?.sessions).toHaveLength(3) // prior + 2 new
    expect(decoded?.sessions.map((s) => s.sessionId)).toContain('session-a')
  })
})
