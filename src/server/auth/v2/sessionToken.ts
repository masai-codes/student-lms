import jwt from 'jsonwebtoken'
import {
  ABSOLUTE_MAX_TTL_HOURS,
  DEFAULT_TTL_HOURS,
  REMEMBER_ME_TTL_HOURS,
  getCookieName,
  getJwtSecret,
} from '@/server/auth/v2/sessionConfig'
import { getCookieDomain } from '@/server/auth/v2/cookieDomain'

const JWT_ALGORITHM = 'HS256'

/**
 * One linked account's own expiry bookkeeping. Independent of every other
 * entry — switching to another account never touches this one, and this one
 * only advances when it is itself the active session and gets renewed.
 */
export type SessionTokenEntry = {
  sessionId: string
  /** Unix seconds — current sliding expiry. Enforced by `jwt.verify` itself. */
  exp: number
  /** Unix seconds — hard cap from original authentication; renewal never moves this. */
  absExp: number
  /** Sliding-window step (hours) applied each time this entry is renewed. */
  stepHours: number
}

export type SessionTokenPayload = {
  /** Currently active session id — same field/meaning as the pre-existing token shape. */
  sessionId: string
  /** All known linked sessions' bookkeeping, including the active one. */
  sessions: SessionTokenEntry[]
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

export function buildSessionTokenEntry(
  sessionId: string,
  { rememberMe, now }: { rememberMe?: boolean; now: number },
): SessionTokenEntry {
  const stepHours = rememberMe ? REMEMBER_ME_TTL_HOURS : DEFAULT_TTL_HOURS
  return {
    sessionId,
    exp: now + stepHours * 3600,
    absExp: now + ABSOLUTE_MAX_TTL_HOURS * 3600,
    stepHours,
  }
}

/** Signs a session JWT, setting the standard `exp` claim from the active entry. */
export function signSessionToken(payload: SessionTokenPayload): string {
  const active = payload.sessions.find((s) => s.sessionId === payload.sessionId)
  if (!active) {
    throw new Error(
      `signSessionToken: no session entry found for active sessionId ${payload.sessionId}`,
    )
  }

  return jwt.sign({ ...payload, exp: active.exp }, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
  })
}

/**
 * Verifies a session JWT and returns its payload, or `null` if absent/invalid/expired.
 *
 * Tokens issued before per-session expiry existed only have `{ sessionId }` —
 * those are upgraded in memory to a single fresh entry so old cookies keep
 * working without interruption. The upgrade is only persisted back to the
 * browser the next time this session goes through a reissuing endpoint
 * (renew, switch-account, or login).
 */
export function verifySessionToken(
  token: string | undefined,
): SessionTokenPayload | null {
  if (!token) return null

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: [JWT_ALGORITHM],
    }) as Record<string, unknown>

    const sessionId =
      typeof decoded.sessionId === 'string' ? decoded.sessionId : null
    if (!sessionId) return null

    if (Array.isArray(decoded.sessions)) {
      return { sessionId, sessions: decoded.sessions as SessionTokenEntry[] }
    }

    return {
      sessionId,
      sessions: [buildSessionTokenEntry(sessionId, { now: nowSeconds() })],
    }
  } catch {
    return null
  }
}

export function buildSessionCookieHeader({
  token,
  request,
  expiresAt,
}: {
  token: string
  request: Request
  expiresAt: Date
}): string {
  const parts = [
    `${getCookieName()}=${encodeURIComponent(token)}`,
    `Expires=${expiresAt.toUTCString()}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=None',
  ]
  const domain = getCookieDomain(request)
  if (domain) parts.push(`Domain=${domain}`)
  return parts.join('; ')
}

/**
 * Slides the active entry's expiry forward by its own step, capped at its
 * absolute ceiling. Returns `renewed: false` (payload unchanged) once there's
 * no meaningful room left to extend.
 */
export function renewActiveEntryIfNeeded(
  payload: SessionTokenPayload,
  now: number = nowSeconds(),
): {
  payload: SessionTokenPayload
  renewed: boolean
  activeEntry: SessionTokenEntry
} {
  const idx = payload.sessions.findIndex(
    (s) => s.sessionId === payload.sessionId,
  )
  const current =
    idx >= 0 ? payload.sessions[idx] : buildSessionTokenEntry(payload.sessionId, { now })
  const candidateExp = Math.min(now + current.stepHours * 3600, current.absExp)

  if (candidateExp <= current.exp) {
    return { payload, renewed: false, activeEntry: current }
  }

  const renewedEntry: SessionTokenEntry = { ...current, exp: candidateExp }
  const sessions =
    idx >= 0
      ? payload.sessions.map((s, i) => (i === idx ? renewedEntry : s))
      : [...payload.sessions, renewedEntry]

  return {
    payload: { ...payload, sessions },
    renewed: true,
    activeEntry: renewedEntry,
  }
}
