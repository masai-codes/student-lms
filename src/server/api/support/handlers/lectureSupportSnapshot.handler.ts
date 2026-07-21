/**
 * Support handler — GET /api/support/floating-chat/lectures/:lectureId
 *
 * Lean lecture snapshot for the floating support modal item confirmation step.
 */

import { jsonOk } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getLectureSupportSnapshot } from '@/server/api/support/services/getLectureSupportSnapshot.service'
import { mapSupportError } from '@/server/api/support/http'

export async function handleGetLectureSupportSnapshot(
  _request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'SUPPORT_INVALID_LECTURE_ID')
    const snapshot = await getLectureSupportSnapshot(userId, lectureId)
    return jsonOk(snapshot)
  } catch (error) {
    return mapSupportError(error)
  }
}
