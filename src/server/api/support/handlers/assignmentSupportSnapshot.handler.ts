/**
 * Support handler — GET /api/support/floating-chat/assignments/:assignmentId
 *
 * Lean assignment/evaluation snapshot for the floating support modal item confirmation step.
 */

import { jsonOk } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getAssignmentSupportSnapshot } from '@/server/api/support/services/getAssignmentSupportSnapshot.service'
import { mapSupportError } from '@/server/api/support/http'

export async function handleGetAssignmentSupportSnapshot(
  request: Request,
  assignmentIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const assignmentId = parsePositiveIdParam(
      assignmentIdParam,
      'SUPPORT_INVALID_ASSIGNMENT_ID',
    )
    const snapshot = await getAssignmentSupportSnapshot(userId, assignmentId)
    return jsonOk(snapshot)
  } catch (error) {
    return mapSupportError(error)
  }
}
