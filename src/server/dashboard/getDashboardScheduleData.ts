export type DashboardLearningType = 'lecture' | 'assignment' | 'resource' | 'quiz'

export interface DashboardScheduleItem {
  id: number
  learningType: DashboardLearningType
  title: string
  /** Datetime string — start time of the event. */
  schedule: string | null
  /** Datetime string — end time of the event. */
  concludes: string | null
  /** Date string (yyyy-mm-dd) — first day of the event. Used for grouping and multi-day detection. */
  startDate: string | null
  /** Date string (yyyy-mm-dd) — last day of the event. When != startDate the event is multi-day. */
  endDate: string | null
  batchName: string | null
  /** Category / subType chip label. */
  subType: string | null
  moduleName: string | null
  optional: 0 | 1
  /** `lectures.type` value (e.g. "live", "scrum", "reading"). Null for non-lecture items. */
  lectureType: string | null
  /** Whether a zoom_link is present on the lecture. Drives Join Live button visibility. */
  hasZoomLink: boolean
}
