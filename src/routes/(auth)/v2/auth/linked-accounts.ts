import { createFileRoute } from '@tanstack/react-router'
import {
  readSessionIdFromAuthHeader,
  readSessionIdFromCookieHeader,
} from '@/server/auth/getCurrentSessionUserId'
import {
  errorResponse,
  jsonResponse,
  withAuthErrorHandling,
} from '@/server/auth/v2/httpHelpers'
import { getLinkedAccountsForSession } from '@/server/auth/v2/linkedAccounts'

function resolveSessionId(request: Request): string | null {
  return (
    readSessionIdFromAuthHeader(request.headers.get('authorization')) ??
    readSessionIdFromCookieHeader(request.headers.get('cookie'))
  )
}

async function handleLinkedAccounts(request: Request): Promise<Response> {
  const sessionId = resolveSessionId(request)
  if (!sessionId) {
    return errorResponse(401, 'UNAUTHENTICATED', 'Not signed in')
  }

  const accounts = await getLinkedAccountsForSession(sessionId)
  if (accounts.length === 0) {
    return errorResponse(401, 'UNAUTHENTICATED', 'Session is no longer valid')
  }

  return jsonResponse({ accounts })
}

export const Route = createFileRoute('/(auth)/v2/auth/linked-accounts')({
  server: {
    handlers: {
      GET: withAuthErrorHandling('linked-accounts', handleLinkedAccounts),
    },
  },
})
