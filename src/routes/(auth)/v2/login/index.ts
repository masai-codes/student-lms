import { createFileRoute } from '@tanstack/react-router'
import { createSessionAndCookieHeader } from '@/server/auth/v2/createSession'
import {
  BadRequestError,
  errorResponse,
  jsonResponse,
  readJsonBody,
} from '@/server/auth/v2/httpHelpers'
import {
  LoginError,
  loginWithPassword,
} from '@/server/auth/v2/loginWithPassword'

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
  }
}

async function handlePasswordLogin(request: Request): Promise<Response> {
  let body: PasswordLoginBody
  try {
    body = await readJsonBody<PasswordLoginBody>(request)
  } catch (err) {
    if (err instanceof BadRequestError) return errorResponse(400, err.code, err.message)
    throw err
  }

  const email = typeof body.email === 'string' ? body.email : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const rememberMe = body.rememberMe === true

  if (!email || !password) {
    return errorResponse(400, 'MISSING_FIELDS', 'email and password are required')
  }

  try {
    const user = await loginWithPassword({ email, password })
    const setCookie = await createSessionAndCookieHeader({
      userId: user.id,
      request,
      rememberMe,
      source: 'v2-login-password',
    })
    return jsonResponse(
      { user },
      { status: 200, headers: { 'Set-Cookie': setCookie } },
    )
  } catch (err) {
    if (err instanceof LoginError) {
      return errorResponse(statusForLoginError(err.code), err.code, err.message)
    }
    throw err
  }
}

export const Route = createFileRoute('/(auth)/v2/login/')({
  server: {
    handlers: {
      POST: async ({ request }) => handlePasswordLogin(request),
    },
  },
})
