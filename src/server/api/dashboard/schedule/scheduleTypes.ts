import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import type { LearningItem } from '@/server/learn/types'

/**
 * A lecture/assignment row for the schedule tab — the shared `LearningEntityRow`
 * (so the learn mappers/CTA builder can consume it) plus the section/batch label
 * source and section settings. `schedule` is the display timestamp; the DB
 * filter runs on `start_date`/`end_date`.
 */
export interface ScheduleEntityRow extends LearningEntityRow {
  sectionName: string | null
  batchName: string | null
  /** `sections.settings` JSON; the UI reads `enableZoomWebView` for lectures. */
  sectionSettings: unknown
}

/**
 * A schedule row as consumed by the (reused) learn listing card, enriched with
 * the dashboard-only course label + the lecture web-view flag.
 */
export interface DashboardScheduleItem extends LearningItem {
  /** Course/section label, only when the user is in more than one batch. */
  courseName: string | null
  /** `sections.settings.enableZoomWebView` (lectures only). */
  enableZoomWebView: boolean
}
