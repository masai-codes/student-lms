/**
 * POST /api/support/ai/callback — inbound webhook the AI ticket-resolution
 * agent calls when a draft is ready (or has failed / handed off).
 *
 * Authorized with the shared `AI_TICKET_AGENT_INTERNAL_SECRET` sent in the
 * `x-api-key` header (same convention as the other inbound webhooks — see
 * `verifyWebhookApiKey`). No session — this is a server-to-server call.
 */

import { jsonOk } from '@/server/api/http/responses'
import { verifyWebhookApiKey } from '@/server/api/webhooks/http/verifyWebhookApiKey'
import { mapSupportError, readJsonBody } from '@/server/api/support/http'
import { aiTicketCallbackSchema } from '@/server/api/support/services/aiTicketCallback.schema'
import { resolveAiTicketDraftCallback } from '@/server/api/support/services/aiTicketCallback.service'

export async function handleAiTicketCallback(
  request: Request,
): Promise<Response> {
  try {
    verifyWebhookApiKey(request, 'AI_TICKET_AGENT_INTERNAL_SECRET')

    const body = await readJsonBody(request, aiTicketCallbackSchema)
    const result = await resolveAiTicketDraftCallback(body)
    return jsonOk(result)
  } catch (error) {
    return mapSupportError(error)
  }
}
