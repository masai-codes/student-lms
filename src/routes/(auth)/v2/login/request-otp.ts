import { createFileRoute } from '@tanstack/react-router'
import {
  errorResponse,
  jsonResponse,
  readJsonBody,
  withAuthErrorHandling,
} from '@/server/auth/v2/httpHelpers'
import { SendOtpError, sendOtp } from '@/server/auth/v2/sendOtp'

type RequestOtpBody = {
  identifier?: unknown
  isResend?: unknown
}

function statusForSendOtpError(code: SendOtpError['code']): number {
  switch (code) {
    case 'USER_NOT_FOUND':
      return 404
    case 'RATE_LIMITED':
      return 429
    case 'ACCOUNT_DEACTIVATED':
      return 403
  }
}

async function handleRequestOtp(request: Request): Promise<Response> {
  const body = await readJsonBody<RequestOtpBody>(request)

  const identifier = typeof body.identifier === 'string' ? body.identifier : ''
  const isResend = body.isResend === true
  if (!identifier) {
    return errorResponse(400, 'MISSING_FIELDS', 'identifier is required')
  }

  try {
    const result = await sendOtp({ identifier, isResend })
    return jsonResponse({
      channel: result.channel,
      otpSessionId: result.otpSessionId,
    })
  } catch (err) {
    if (err instanceof SendOtpError) {
      return errorResponse(
        statusForSendOtpError(err.code),
        err.code,
        err.message,
      )
    }
    throw err
  }
}

export const Route = createFileRoute('/(auth)/v2/login/request-otp')({
  server: {
    handlers: {
      POST: withAuthErrorHandling('request-otp', handleRequestOtp),
    },
  },
})
