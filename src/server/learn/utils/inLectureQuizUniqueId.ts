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
