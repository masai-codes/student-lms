/**
 * Support handler — GET /api/support/floating-chat/inbox
 *
 * Lean inbox payload for the floating support modal.
 */

import { jsonOk } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getFloatingChatInbox } from '@/server/api/support/services/getFloatingChatInbox.service'
import { mapSupportError } from '@/server/api/support/http'

export async function handleGetFloatingChatInbox(
  _request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const inbox = await getFloatingChatInbox(userId)
    return jsonOk(inbox)
  } catch (error) {
    return mapSupportError(error)
  }
}
