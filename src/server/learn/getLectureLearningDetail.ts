import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'

import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { getLectureLearningDetailForUser } from '@/server/learn/services/getLectureLearningDetail.service'

/** @deprecated Use GET `/api/learn/lectures/:lectureId` via `fetchLectureLearningDetailFromApi`. */
export async function getLectureLearningDetailHandler(
  lectureId: number,
): Promise<LectureDetailPayload> {
  const userId = await getCurrentSessionUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }
  return getLectureLearningDetailForUser(userId, lectureId)
}
