import { createFileRoute } from '@tanstack/react-router'
import {
  BadRequestError,
  errorResponse,
  jsonResponse,
  readJsonBody,
} from '@/server/auth/v2/httpHelpers'
import { sendForgotPasswordEmail } from '@/server/auth/v2/sendForgotPasswordEmail'

type ForgotPasswordBody = {
  email?: unknown
}

const GENERIC_OK = {
  success: true,
  message: 'If an account exists, a reset link has been sent to your email.',
}

async function handleForgotPassword(request: Request): Promise<Response> {
  let body: ForgotPasswordBody
  try {
    body = await readJsonBody<ForgotPasswordBody>(request)
  } catch (err) {
    if (err instanceof BadRequestError) return errorResponse(400, err.code, err.message)
    throw err
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email) {
    return errorResponse(400, 'MISSING_FIELDS', 'email is required')
  }

  try {
    await sendForgotPasswordEmail({ email })
  } catch (err) {
    console.error('[forgot-password] failed to send reset email:', err)
    return errorResponse(
      500,
      'EMAIL_SEND_FAILED',
      'Unable to process request. Please try again later.',
    )
  }

  return jsonResponse(GENERIC_OK)
}

export const Route = createFileRoute('/(auth)/v2/forgot-password')({
  server: {
    handlers: {
      POST: async ({ request }) => handleForgotPassword(request),
    },
  },
})
