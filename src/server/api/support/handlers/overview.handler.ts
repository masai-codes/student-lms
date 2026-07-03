/**
 * Support handler — GET /api/support/overview
 *
 * The one aggregated read that powers the whole `/support` landing page.
 * Resolves the session user, optionally scopes to `?batchId=`, and returns the
 * full {@link SupportOverview}.
 */

import { jsonOk } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getSupportOverview } from '@/server/api/support/getSupportOverview.service'
import { mapSupportError, optionalIntParam } from '@/server/api/support/http'

export async function handleGetSupportOverview(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const batchId = optionalIntParam(new URL(request.url), 'batchId')
    const overview = await getSupportOverview(userId, batchId)
    return jsonOk(overview)
  } catch (error) {
    return mapSupportError(error)
  }
}
