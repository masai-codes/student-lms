export type LectureDetailTabId =
  | 'description'
  | 'ai-summary'
  | 'transcript'
  | 'associated'
  | 'attempted-assessments'

export const LECTURE_DETAIL_TABS: ReadonlyArray<{
  id: LectureDetailTabId
  label: string
}> = [
  { id: 'description', label: 'Description' },
  { id: 'ai-summary', label: 'AI Summary' },
  { id: 'transcript', label: 'Transcript' },
  { id: 'associated', label: 'Associated Content' },
  { id: 'attempted-assessments', label: 'Attempted Assessments' },
]

/**
 * The "Description" tab renders the lecture's notes content. This mirrors the
 * legacy LMS, where a single "Description" tab showed `lectures.notes` (there was
 * never a separate Notes tab). When `settings.hide_notes` is set, the tab is
 * hidden entirely.
 *
 * "Attempted Assessments" only shows once the user has submitted at least one
 * in-lecture quiz or poll for this lecture — most lectures have none yet, so
 * `hasAttemptedAssessments` defaults to false.
 *
 * SQL Playground is not a tab — it's a slide-out drawer (see
 * `LectureSqlSidePanel`), opened from the video toolbar's "SQL" pill
 * or the in-lecture nudge card.
 */
export function resolveVisibleLectureDetailTabs(
  hideNotes: boolean,
  hasAttemptedAssessments = false,
): ReadonlyArray<(typeof LECTURE_DETAIL_TABS)[number]> {
  return LECTURE_DETAIL_TABS.filter((tab) => {
    if (hideNotes && tab.id === 'description') return false
    if (!hasAttemptedAssessments && tab.id === 'attempted-assessments')
      return false
    return true
  })
}

const DEFAULT_LECTURE_TAB_ID: LectureDetailTabId = 'description'

/** First visible tab for the current visibility rules (avoids defaulting to a hidden tab). */
export function resolveDefaultLectureTabId(
  hideNotes: boolean,
  hasAttemptedAssessments = false,
): LectureDetailTabId {
  return (
    resolveVisibleLectureDetailTabs(hideNotes, hasAttemptedAssessments)[0]
      ?.id ?? DEFAULT_LECTURE_TAB_ID
  )
}
