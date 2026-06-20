import { and, eq, gte } from 'drizzle-orm'
import { db } from '@/db'
import { loginAttempts } from '@/db/schema'

// DB-backed rate limiting for password login. The app runs in PM2 cluster mode
// with no shared Redis, so an in-memory counter would live per-worker and be
// trivially bypassed; we instead count rows in a shared table, mirroring the
// OTP throttling in `sendOtp`.
//
// The cap is per identifier (account) only — NOT per IP. Students routinely
// share a public IP (campus/hostel/office NAT), so an IP cap would let a few
// mistyped passwords lock out everyone on that network. The per-account cap is
// what actually protects an individual account from brute force. We still
// record the source IP on each failure for later forensics.
const WINDOW_SECONDS = 15 * 60
const PER_IDENTIFIER_CAP = 5

export class LoginRateLimitError extends Error {
  public readonly code = 'RATE_LIMITED' as const
  constructor(message: string) {
    super(message)
  }
}

// attempted_at is written here in UTC (not via the DB clock, whose timezone is
// unknown) so the window comparison below is stable across environments.
function toMysqlDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

/**
 * Throws `LoginRateLimitError` if this account has too many recent failed
 * attempts. Call before verifying the password.
 */
export async function assertLoginAllowed({
  identifier,
}: {
  identifier: string
}): Promise<void> {
  const cutoff = toMysqlDatetime(new Date(Date.now() - WINDOW_SECONDS * 1000))

  const recent = await db
    .select({ id: loginAttempts.id })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.identifier, identifier),
        gte(loginAttempts.attemptedAt, cutoff),
      ),
    )

  if (recent.length >= PER_IDENTIFIER_CAP) {
    throw new LoginRateLimitError(
      'Too many failed login attempts for this account. Please try again in 15 minutes, or reset your password.',
    )
  }
}

/** Record one failed password attempt. Call when credentials are rejected. */
export async function recordFailedLogin({
  identifier,
  ip,
}: {
  identifier: string
  ip: string
}): Promise<void> {
  await db.insert(loginAttempts).values({
    identifier,
    ipAddress: ip || null,
    attemptedAt: toMysqlDatetime(new Date()),
  })
}

/** Clear an account's failed attempts after a successful login. */
export async function clearLoginAttempts(identifier: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.identifier, identifier))
}
