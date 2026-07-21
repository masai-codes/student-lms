/**
 * Score to surface on an assignment listing card.
 *
 * Mirrors the detail-page rules (`buildAssignmentDetailFooter` → `buildScoreBlock`):
 * gated on `showScores` only (any assignment type may have it enabled), and shown
 * only once the score is released (`submission.data.updatedScore` /
 * `scoreUpdatedByAdmin`), clamped to 10. Returns null when nothing should be shown.
 */
export function resolveReleasedAssignmentScore(input: {
  showScores: boolean
  submission: { score?: number; data?: Record<string, unknown> | null } | null
}): number | null {
  if (!input.showScores) return null

  const submission = input.submission
  if (submission == null || typeof submission.score !== 'number') return null

  const data = submission.data
  const isReleased =
    data?.updatedScore === true || data?.scoreUpdatedByAdmin === true
  if (!isReleased) return null

  return Math.min(submission.score, 10)
}
