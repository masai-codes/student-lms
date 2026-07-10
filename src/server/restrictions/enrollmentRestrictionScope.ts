import {
  isScheduledAfterCutoff,
  normalizeRestrictionCutoff,
} from '@/server/restrictions/restrictionDates'
import type { UserBatchRestrictions } from '@/server/restrictions/types'

/** Batch IDs whose enrolment is cancelled — hide these batches entirely. */
export function getCancelledBatchIds(
  restrictions: UserBatchRestrictions,
): Set<number> {
  const cancelled = new Set<number>()
  for (const [batchId, flags] of restrictions) {
    if (flags.enrolmentCancelled) cancelled.add(batchId)
  }
  return cancelled
}

/**
 * The normalised paused cutoff for a batch, or `null` when the batch is not paused.
 * Content scheduled after this cutoff must be hidden.
 */
export function getPausedCutoff(
  restrictions: UserBatchRestrictions,
  batchId: number,
): string | null {
  const flags = restrictions.get(batchId)
  if (!flags?.paused) return null
  return normalizeRestrictionCutoff(flags.pausedDate)
}

/**
 * Builds a keep-predicate for restriction filtering of listing/dashboard rows.
 * A row is hidden when its section's batch is enrolment-cancelled, or the batch is
 * paused and the row is scheduled after that batch's pause cutoff. Rows in
 * unrestricted batches (or with an unknown section) are kept.
 */
export function makePausedScheduleFilter(
  restrictions: UserBatchRestrictions,
  sectionToBatch: Map<number, number>,
): (row: { sectionId?: number | null; schedule: string | null }) => boolean {
  const cancelled = getCancelledBatchIds(restrictions)
  return (row) => {
    const batchId =
      row.sectionId != null ? sectionToBatch.get(row.sectionId) : undefined
    if (batchId == null) return true
    if (cancelled.has(batchId)) return false
    const cutoff = getPausedCutoff(restrictions, batchId)
    if (cutoff == null) return true
    return !isScheduledAfterCutoff(row.schedule, cutoff)
  }
}
