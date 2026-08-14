import type { LearnListingJoinLiveState } from '@/server/learn/types'

/** The three event sources the calendar merges (parity with the old LMS page). */
export type CalendarEventType = 'lecture' | 'assignment' | 'quiz'

/**
 * A raw scheduled row as selected by the calendar fetchers — the common subset
 * of `lectures` / `assignments` / `quizzes` needed to place and describe an
 * event, plus the lecture-only join fields (null for other types).
 */
export interface CalendarEntityRow {
  id: number
  title: string
  /** Raw DB `type` (e.g. `live`, `scrum`, `evaluation`) — drives join logic. */
  type: string
  optional: number
  /** IST wall-clock `YYYY-MM-DD HH:MM:SS`; rows without one are dropped. */
  schedule: string | null
  concludes: string | null
  sectionId: number | null
  hostName: string | null
  sectionName: string | null
  batchName: string | null
  sectionSettings: unknown
  zoomLink: string | null
  isNewZoomRedirection: number | null
  zoomDetails: unknown
}

/** Join-live CTA payload for lecture events; mirrors `LearnListingJoinLiveCta` props. */
export interface CalendarJoinLive {
  state: LearnListingJoinLiveState
  joinZoomLink: string | null
  isNewZoomRedirection: boolean
  enableZoomWebView: boolean
}

/** One calendar event as served to the client. All datetimes are explicit-IST ISO. */
export interface CalendarEventDto {
  id: number
  type: CalendarEventType
  title: string
  /** `YYYY-MM-DDTHH:MM:SS+05:30` — event start. */
  schedule: string
  /** Raw `concludes` when set; null when the end was derived from a fallback. */
  concludes: string | null
  /** `concludes`, or schedule + per-type fallback (1h lecture / 24h assignment / 2h quiz). */
  effectiveEnd: string
  optional: boolean
  sectionId: number | null
  sectionName: string | null
  batchName: string | null
  /** Host/instructor name — lectures only. */
  hostName: string | null
  /** In-app details page; null for quizzes (no quiz detail route yet). */
  detailPath: string | null
  /** Join-live CTA state — lectures only, null otherwise. */
  joinLive: CalendarJoinLive | null
}

export interface CalendarEventsResponse {
  range: { start: string; end: string }
  events: Array<CalendarEventDto>
}

export interface CalendarBatchOption {
  id: number
  name: string
}

export interface CalendarBatchesResponse {
  batches: Array<CalendarBatchOption>
}
