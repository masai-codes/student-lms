import { createFileRoute } from '@tanstack/react-router'
import {
  BadRequestError,
  errorResponse,
  jsonResponse,
  readJsonBody,
} from '@/server/auth/v2/httpHelpers'
import { ResetPasswordError, resetPassword } from '@/server/auth/v2/resetPassword'

type ResetPasswordBody = {
  token?: unknown
  password?: unknown
}

function statusForResetError(code: ResetPasswordError['code']): number {
  switch (code) {
    case 'INVALID_TOKEN':
      return 401
    case 'TOKEN_EXPIRED':
      return 401
    case 'USER_NOT_FOUND':
      return 404
  }
}

async function handleResetPassword(request: Request): Promise<Response> {
  let body: ResetPasswordBody
  try {
    body = await readJsonBody<ResetPasswordBody>(request)
  } catch (err) {
    if (err instanceof BadRequestError) return errorResponse(400, err.code, err.message)
    throw err
  }

  const token = typeof body.token === 'string' ? body.token : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!token || !password) {
    return errorResponse(400, 'MISSING_FIELDS', 'token and password are required')
  }

  try {
    await resetPassword({ token, password })
    return jsonResponse({ success: true })
  } catch (err) {
    if (err instanceof ResetPasswordError) {
      return errorResponse(statusForResetError(err.code), err.code, err.message)
    }
    throw err
  }
}

export const Route = createFileRoute('/(auth)/v2/reset-password')({
  server: {
    handlers: {
      POST: async ({ request }) => handleResetPassword(request),
    },
  },
})
