import { createFileRoute } from '@tanstack/react-router'
import { createSessions } from '@/server/auth/v2/createSession'
import {
  errorResponse,
  jsonResponse,
  readJsonBody,
  withAuthErrorHandling,
} from '@/server/auth/v2/httpHelpers'
import { canAccessPortal } from '@/server/auth/v2/portalGate'
import { portalMismatchResponse } from '@/server/auth/v2/portalMismatchResponse'
import { VerifyOtpError, verifyOtp } from '@/server/auth/v2/verifyOtp'

type VerifyOtpBody = {
  otpSessionId?: unknown
  otp?: unknown
  rememberMe?: unknown
}

function statusForVerifyOtpError(code: VerifyOtpError['code']): number {
  switch (code) {
    case 'OTP_NOT_FOUND':
      return 404
    case 'USER_NOT_FOUND':
      return 404
    case 'OTP_ALREADY_USED':
      return 409
    case 'OTP_EXPIRED':
      return 410
    case 'TOO_MANY_ATTEMPTS':
      return 429
    case 'INVALID_OTP':
      return 401
    case 'ACCOUNT_DEACTIVATED':
      return 403
  }
}

async function handleVerifyOtp(request: Request): Promise<Response> {
  const body = await readJsonBody<VerifyOtpBody>(request)

  const otpSessionId =
    typeof body.otpSessionId === 'string' ? body.otpSessionId : ''
  const otp = typeof body.otp === 'string' ? body.otp : ''
  const rememberMe = body.rememberMe === true

  if (!otpSessionId || !otp) {
    return errorResponse(
      400,
      'MISSING_FIELDS',
      'otpSessionId and otp are required',
    )
  }

  try {
    const matchedUsers = await verifyOtp({ otpSessionId, otp })

    const gateResults = await Promise.all(
      matchedUsers.map((u) => canAccessPortal({ user: u, request })),
    )
    const allowedUsers = matchedUsers.filter((_, i) => gateResults[i])
    if (allowedUsers.length === 0) {
      // Every account behind this OTP lives on another portal — redirect rather
      // than dead-end. One identifier can match several accounts across
      // portals (`users_email_client_unique` is (email, client)); only redirect
      // when they agree, otherwise there's no single right destination and
      // `portalMismatchResponse` falls back to the plain message.
      const clients = new Set(matchedUsers.map((u) => u.client))
      return portalMismatchResponse({
        client: clients.size === 1 ? matchedUsers[0]?.client : null,
        request,
      })
    }

    const {
      sessions: sessionRecords,
      activeUserId,
      activeSessionId,
      activeToken,
      setCookieHeader,
    } = await createSessions({
      userIds: allowedUsers.map((u) => u.id),
      request,
      rememberMe,
      source: 'v2-login-otp',
    })

    const userById = new Map(allowedUsers.map((u) => [u.id, u]))
    const accounts = sessionRecords.map(({ userId, sessionId }) => ({
      user: userById.get(userId)!,
      sessionId,
      isActive: sessionId === activeSessionId,
    }))

    const activeUser = userById.get(activeUserId)!

    return jsonResponse(
      { user: activeUser, token: activeToken, accounts },
      { status: 200, headers: { 'Set-Cookie': setCookieHeader } },
    )
  } catch (err) {
    if (err instanceof VerifyOtpError) {
      return errorResponse(
        statusForVerifyOtpError(err.code),
        err.code,
        err.message,
      )
    }
    throw err
  }
}

export const Route = createFileRoute('/(auth)/v2/login/verify-otp')({
  server: {
    handlers: {
      POST: withAuthErrorHandling('verify-otp', handleVerifyOtp),
    },
  },
})
