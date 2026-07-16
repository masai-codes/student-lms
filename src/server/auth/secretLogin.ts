import { timingSafeEqual } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { createSessions } from '@/server/auth/v2/createSession'

/** Constant-time comparison so a wrong token can't be discovered byte-by-byte via timing. */
function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * GET /api/secret-login?token=<secret>&userId=<id>
 *
 * Backdoor/impersonation login for internal & demo use. When opened in a browser
 * with a valid secret token, it establishes a real session cookie for the given
 * user (same mechanism as a normal login — no password needed) and redirects to
 * the app root. The token must match SECRET_LOGIN_TOKEN; without that env var the
 * route is disabled. `email` may be used instead of `userId`.
 */
export async function handleSecretLogin(request: Request): Promise<Response> {
  const expectedToken = process.env.SECRET_LOGIN_TOKEN
  if (!expectedToken) {
    return new Response(
      JSON.stringify({ error: 'Secret login is not enabled' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const url = new URL(request.url)
  const token = url.searchParams.get('token') ?? ''
  if (!token || !tokensMatch(token, expectedToken)) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userIdRaw = (url.searchParams.get('userId') ?? '').trim()
  const emailRaw = (url.searchParams.get('email') ?? '').trim().toLowerCase()

  if (!userIdRaw && !emailRaw) {
    return new Response(
      JSON.stringify({ error: 'userId or email is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const rows = userIdRaw
    ? await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, Number(userIdRaw)))
        .limit(1)
    : await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, emailRaw))
        .limit(1)

  const user = rows[0]
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { setCookieHeader } = await createSessions({
    userIds: [user.id],
    request,
    source: 'secret-login',
  })

  // 302 back into the app; the browser keeps the session cookie set above.
  const redirectTo = process.env.SECRET_LOGIN_REDIRECT_URL || '/'
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      'Set-Cookie': setCookieHeader,
    },
  })
}
