export type LectureDetailTabId =
  | 'description'
  | 'ai-summary'
  | 'transcript'
  | 'associated'

export const LECTURE_DETAIL_TABS: ReadonlyArray<{
  id: LectureDetailTabId
  label: string
}> = [
  { id: 'description', label: 'Description' },
  { id: 'ai-summary', label: 'AI Summary' },
  { id: 'transcript', label: 'Transcript' },
  { id: 'associated', label: 'Associated Content' },
]

/**
 * The "Description" tab renders the lecture's notes content. This mirrors the
 * legacy LMS, where a single "Description" tab showed `lectures.notes` (there was
 * never a separate Notes tab). When `settings.hide_notes` is set, the tab is
 * hidden entirely.
 */
export function resolveVisibleLectureDetailTabs(
  hideNotes: boolean,
): ReadonlyArray<(typeof LECTURE_DETAIL_TABS)[number]> {
  if (hideNotes) {
    return LECTURE_DETAIL_TABS.filter((tab) => tab.id !== 'description')
  }
  return LECTURE_DETAIL_TABS
}

const DEFAULT_LECTURE_TAB_ID: LectureDetailTabId = 'description'

/** First visible tab for the current visibility rules (avoids defaulting to a hidden tab). */
export function resolveDefaultLectureTabId(
  hideNotes: boolean,
): LectureDetailTabId {
  return (
    resolveVisibleLectureDetailTabs(hideNotes)[0]?.id ?? DEFAULT_LECTURE_TAB_ID
  )
}
