/**
 * Support handler — POST /api/support/callback/create
 *
 * Records a pending callback request. Reason/time-slot options ship in the
 * overview payload; this just persists the student's choice. Duplicate pending
 * requests for the same batch are rejected (409) by the service.
 */

import { z } from 'zod'
import { jsonOk } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { createCallback } from '@/server/api/support/services/callback.service'
import { mapSupportError, readJsonBody } from '@/server/api/support/http'

const createCallbackSchema = z.object({
  batchId: z.number().int().positive(),
  category: z.string().min(1),
  preferredTimeSlot: z.string().nullish(),
})

export async function handleCreateCallback(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = await readJsonBody(request, createCallbackSchema)
    const result = await createCallback({ userId, ...body })
    return jsonOk(result)
  } catch (error) {
    return mapSupportError(error)
  }
}
