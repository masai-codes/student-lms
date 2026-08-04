import { createFileRoute } from '@tanstack/react-router'
import { createSessions, extractClientIp } from '@/server/auth/v2/createSession'
import {
  errorResponse,
  jsonResponse,
  readJsonBody,
  withAuthErrorHandling,
} from '@/server/auth/v2/httpHelpers'
import {
  LoginRateLimitError,
  assertLoginAllowed,
  clearLoginAttempts,
  recordFailedLogin,
} from '@/server/auth/v2/loginRateLimit'
import {
  LoginError,
  loginWithPassword,
} from '@/server/auth/v2/loginWithPassword'
import { canAccessPortal } from '@/server/auth/v2/portalGate'

type PasswordLoginBody = {
  email?: unknown
  password?: unknown
  rememberMe?: unknown
}

function statusForLoginError(code: LoginError['code']): number {
  switch (code) {
    case 'USER_NOT_FOUND':
      return 404
    case 'PASSWORD_RESET_REQUIRED':
      return 403
    case 'INCORRECT_CREDENTIALS':
      return 401
    case 'ACCOUNT_DEACTIVATED':
      return 403
  }
}

async function handlePasswordLogin(request: Request): Promise<Response> {
  const body = await readJsonBody<PasswordLoginBody>(request)

  const rawEmail = typeof body.email === 'string' ? body.email : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const rememberMe = body.rememberMe === true

  if (!rawEmail || !password) {
    return errorResponse(
      400,
      'MISSING_FIELDS',
      'email and password are required',
    )
  }

  // Key rate limiting off the same normalized identifier loginWithPassword uses,
  // so casing/whitespace variants can't sidestep the per-account cap.
  const identifier = rawEmail.trim().toLowerCase()
  const ip = extractClientIp(request)

  try {
    await assertLoginAllowed({ identifier })
  } catch (err) {
    if (err instanceof LoginRateLimitError) {
      return errorResponse(429, err.code, err.message)
    }
    throw err
  }

  try {
    const user = await loginWithPassword({ email: identifier, password })

    // Credentials were valid — reset the counter even if the portal gate below
    // rejects, since a portal mismatch isn't a brute-force signal.
    await clearLoginAttempts(identifier)

    const allowed = await canAccessPortal({ user, request })
    if (!allowed) {
      return errorResponse(
        403,
        'PORTAL_MISMATCH',
        'This account cannot sign in from this portal.',
      )
    }

    const { activeToken, setCookieHeader } = await createSessions({
      userIds: [user.id],
      request,
      rememberMe,
      source: 'v2-login-password',
    })
    return jsonResponse(
      { user, token: activeToken },
      { status: 200, headers: { 'Set-Cookie': setCookieHeader } },
    )
  } catch (err) {
    if (err instanceof LoginError) {
      // Count bad-password and unknown-email attempts so neither account
      // brute-forcing nor email enumeration can run unbounded.
      if (
        err.code === 'INCORRECT_CREDENTIALS' ||
        err.code === 'USER_NOT_FOUND'
      ) {
        await recordFailedLogin({ identifier, ip })
      }
      return errorResponse(statusForLoginError(err.code), err.code, err.message)
    }
    throw err
  }
}

export const Route = createFileRoute('/(auth)/v2/login/')({
  server: {
    handlers: {
      POST: withAuthErrorHandling('login-password', handlePasswordLogin),
    },
  },
})
