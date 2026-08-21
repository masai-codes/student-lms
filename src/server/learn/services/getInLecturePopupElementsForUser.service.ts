import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { lectures } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { getInLecturePopupElements } from '@/server/learn/services/getInLecturePopupElements.service'
import type { InLecturePopupElements } from '@/server/learn/lectureDetailTypes'

/**
 * Access-checked wrapper around `getInLecturePopupElements`, for the
 * standalone `popup-elements` endpoint — refetched client-side after a quiz
 * or poll submission so the Attempted Assessments tab picks up the new
 * `submittedAt` without a full page reload. `getInLecturePopupElements`
 * itself stays a pure data accessor; its other caller,
 * `getLectureLearningDetailForUser`, already checks access before calling it.
 */
export async function getInLecturePopupElementsForUser(
  userId: number,
  lectureId: number,
): Promise<InLecturePopupElements> {
  const rows = await db
    .select({ sectionId: lectures.sectionId })
    .from(lectures)
    .where(and(eq(lectures.id, lectureId), isNull(lectures.deletedAt)))
    .limit(1)

  const lecture = rows[0]
  if (!lecture) throw new ApiError(404, 'LECTURE_NOT_FOUND')

  const allowed = await ensureUserCanAccessLearnHubEntity(
    userId,
    lecture.sectionId,
  )
  if (!allowed) throw new ApiError(404, 'LECTURE_NOT_FOUND')

  return getInLecturePopupElements(lectureId, userId)
}
