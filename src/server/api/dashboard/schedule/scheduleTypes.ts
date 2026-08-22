import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import type { LearningItem } from '@/server/learn/types'
import { resolveSectionDisplayName } from '@/server/batches/resolveSectionLabel'

/**
 * A lecture/assignment row for the schedule tab — the shared `LearningEntityRow`
 * (so the learn mappers/CTA builder can consume it) plus the section/batch label
 * source and section settings. `schedule` is the display timestamp; the DB
 * filter runs on `start_date`/`end_date`.
 */
export interface ScheduleEntityRow extends LearningEntityRow {
  /** Display label — `settings.sectionDisplayName` when set, else `sections.name`. */
  sectionName: string | null
  batchName: string | null
  /** `sections.settings` JSON; the UI reads `enableZoomWebView` for lectures. */
  sectionSettings: unknown
}

/**
 * Replaces each row's raw `sections.name` with the learner-facing section label.
 * Applied in the schedule/pending fetchers so no caller can surface the cohort
 * code by accident.
 */
export function withSectionLabel<
  T extends { sectionName: string | null; sectionSettings: unknown },
>(rows: Array<T>): Array<T> {
  return rows.map((row) => {
    const displayName = resolveSectionDisplayName(row.sectionSettings)
    // No display name configured — leave `sectionName` (and its nullness) as-is.
    return displayName ? { ...row, sectionName: displayName } : row
  })
}

/**
 * A schedule row as consumed by the (reused) learn listing card, enriched with
 * the dashboard-only course label + the lecture web-view flag.
 */
export interface DashboardScheduleItem extends LearningItem {
  /** Course/section label, only when the user is in more than one batch. */
  courseName: string | null
  /**
   * Learner-facing section label (`settings.sectionDisplayName`, else the raw
   * cohort code). Rendered as a chip on portals in
   * `SECTION_ON_LEARN_CARD_PORTALS`, same as the `/learn` feed.
   */
  sectionName: string | null
  /** `sections.settings.enableZoomWebView` (lectures only). */
  enableZoomWebView: boolean
}
