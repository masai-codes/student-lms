import { createFileRoute } from '@tanstack/react-router'
import { getCurrentUserSessionId } from '@/server/auth/getCurrentSessionUserId'
import {
  errorResponse,
  jsonResponse,
  withAuthErrorHandling,
} from '@/server/auth/v2/httpHelpers'
import { getLinkedAccountsForSession } from '@/server/auth/v2/linkedAccounts'

async function handleLinkedAccounts(): Promise<Response> {
  const sessionId = getCurrentUserSessionId()
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
