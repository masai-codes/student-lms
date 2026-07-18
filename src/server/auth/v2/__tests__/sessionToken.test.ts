import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('sessionToken', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.JWT_SECRET_KEY = 'test-secret'
    process.env.COOKIE_NAME = 'lms_session'
  })

  it('signs and verifies a fresh payload, round-tripping sessionId and entries', async () => {
    const { signSessionToken, verifySessionToken, buildSessionTokenEntry } =
      await import('../sessionToken')

    const now = Math.floor(Date.now() / 1000)
    const entry = buildSessionTokenEntry('session-a', { now })
    const token = signSessionToken({ sessionId: 'session-a', sessions: [entry] })

    const decoded = verifySessionToken(token)
    expect(decoded?.sessionId).toBe('session-a')
    expect(decoded?.sessions).toEqual([entry])
  })

  it('upgrades a legacy `{ sessionId }`-only token to a fresh single-entry payload', async () => {
    const jwt = (await import('jsonwebtoken')).default
    const { verifySessionToken } = await import('../sessionToken')

    const legacyToken = jwt.sign(
      { sessionId: 'legacy-session' },
      'test-secret',
      { algorithm: 'HS256' },
    )

    const decoded = verifySessionToken(legacyToken)
    expect(decoded?.sessionId).toBe('legacy-session')
    expect(decoded?.sessions).toHaveLength(1)
    expect(decoded?.sessions[0].sessionId).toBe('legacy-session')
    expect(decoded?.sessions[0].exp).toBeGreaterThan(
      Math.floor(Date.now() / 1000),
    )
  })

  it('rejects a token whose exp has already passed', async () => {
    const { signSessionToken, verifySessionToken } = await import(
      '../sessionToken'
    )

    const past = Math.floor(Date.now() / 1000) - 3600
    const token = signSessionToken({
      sessionId: 'session-a',
      sessions: [
        { sessionId: 'session-a', exp: past, absExp: past + 10, stepHours: 72 },
      ],
    })

    expect(verifySessionToken(token)).toBeNull()
  })

  it('returns null for a malformed/garbage token', async () => {
    const { verifySessionToken } = await import('../sessionToken')
    expect(verifySessionToken('not-a-jwt')).toBeNull()
    expect(verifySessionToken(undefined)).toBeNull()
  })

  it('renewActiveEntryIfNeeded slides the active entry forward, capped at absExp', async () => {
    const { renewActiveEntryIfNeeded } = await import('../sessionToken')

    const now = 1_000_000
    const payload = {
      sessionId: 'session-a',
      sessions: [
        {
          sessionId: 'session-a',
          exp: now + 10, // barely any room left
          absExp: now + 100,
          stepHours: 72, // would want to renew to now + 72*3600, but capped
        },
      ],
    }

    const result = renewActiveEntryIfNeeded(payload, now)
    expect(result.renewed).toBe(true)
    expect(result.activeEntry.exp).toBe(now + 100) // capped at absExp
    expect(result.payload.sessions[0].absExp).toBe(now + 100)
  })

  it('renewActiveEntryIfNeeded is a no-op once already at the absolute cap', async () => {
    const { renewActiveEntryIfNeeded } = await import('../sessionToken')

    const now = 1_000_000
    const payload = {
      sessionId: 'session-a',
      sessions: [
        { sessionId: 'session-a', exp: now + 100, absExp: now + 100, stepHours: 72 },
      ],
    }

    const result = renewActiveEntryIfNeeded(payload, now)
    expect(result.renewed).toBe(false)
    expect(result.payload).toBe(payload)
  })

  it('renewActiveEntryIfNeeded never advances an inactive linked entry', async () => {
    const { renewActiveEntryIfNeeded } = await import('../sessionToken')

    const now = 1_000_000
    const inactiveEntry = {
      sessionId: 'session-b',
      exp: now + 10,
      absExp: now + 10_000,
      stepHours: 72,
    }
    const payload = {
      sessionId: 'session-a',
      sessions: [
        { sessionId: 'session-a', exp: now + 10, absExp: now + 10_000, stepHours: 72 },
        inactiveEntry,
      ],
    }

    const result = renewActiveEntryIfNeeded(payload, now)
    const untouched = result.payload.sessions.find(
      (s) => s.sessionId === 'session-b',
    )
    expect(untouched).toEqual(inactiveEntry)
  })
})
