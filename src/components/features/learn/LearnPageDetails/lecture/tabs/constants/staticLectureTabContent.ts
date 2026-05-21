export type LectureDetailTabId =
  | 'description'
  | 'notes'
  | 'ai-summary'
  | 'transcript'
  | 'associated'

export const LECTURE_DETAIL_TABS: ReadonlyArray<{
  id: LectureDetailTabId
  label: string
}> = [
  { id: 'description', label: 'Description' },
  { id: 'notes', label: 'Notes' },
  { id: 'ai-summary', label: 'AI Summary' },
  { id: 'transcript', label: 'Transcript' },
  { id: 'associated', label: 'Associated Lectures and Assignments' },
]

export function resolveVisibleLectureDetailTabs(
  hideNotes: boolean,
): ReadonlyArray<(typeof LECTURE_DETAIL_TABS)[number]> {
  if (hideNotes) {
    return LECTURE_DETAIL_TABS.filter(tab => tab.id !== 'notes')
  }
  return LECTURE_DETAIL_TABS
}

export const DEFAULT_LECTURE_TAB_ID: LectureDetailTabId = 'description'
