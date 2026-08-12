/**
 * The `uniqueID` sent to the Assess Platform's `generate-test` call for an
 * in-lecture popup quiz — stable per (user, lecture, template) so repeat opens
 * reuse the same assessment attempt. The Assess Platform echoes this same id
 * back in its `gradeAssessment` callback, so this is also how we match a
 * webhook to the (user, lecture, template) it belongs to.
 */
export function buildInLectureQuizUniqueId(
  userId: number,
  lectureId: number,
  assessmentTemplateId: string,
): string {
  return `${userId}-${lectureId}-${assessmentTemplateId}`
}

/**
 * Inverse of {@link buildInLectureQuizUniqueId} — parses a `gradeAssessment`
 * callback's `uniqueID` back into its parts. `userId`/`lectureId` are the first
 * two `-`-separated segments; the remainder is the `assessmentTemplateId` (which
 * itself contains no `-`, but rejoining is safe). Returns `null` when malformed.
 */
export function parseInLectureQuizUniqueId(uniqueId: string): {
  userId: number
  lectureId: number
  assessmentTemplateId: string
} | null {
  const parts = uniqueId.split('-')
  if (parts.length < 3) return null
  const userId = Number(parts[0])
  const lectureId = Number(parts[1])
  const assessmentTemplateId = parts.slice(2).join('-')
  if (
    !Number.isInteger(userId) ||
    !Number.isInteger(lectureId) ||
    !assessmentTemplateId
  ) {
    return null
  }
  return { userId, lectureId, assessmentTemplateId }
}
