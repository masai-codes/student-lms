/**
 * Batch-level ban reading.
 *
 * Bans are marked by admins (in the old-LMS admin app) on the `batch_user` row
 * and stored as a small JSON blob in `batch_user.meta`, e.g.
 *   {"batchBanned":true,"batchBannedDate":"2026-07-01",
 *    "aggrementBatchBanned":true,"aggrementBatchBannedDate":"2026-07-02"}
 *
 * Two ban types, both scoped to a single batch:
 * - `batchBanned` (normal): date-gated — the user cannot see/open content scheduled
 *   AFTER the ban date in that batch.
 * - `aggrementBatchBanned` (agreement): NOT date-gated — for the whole banned batch,
 *   only the lecture recording and practice-assignment attempt are blocked; the ban
 *   date is stored but not used for gating.
 *
 * This module only reads/normalises the ban data; feature-specific rules live at
 * the call sites (dashboard/learn filtering, detail-page gating).
 */
import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { batchUser } from '@/db/schema'

/** Per-batch ban cutoffs for a single user. Absence of a key = not banned in that batch. */
export interface UserBatchBans {
  /** batchId -> normalised "after this" cutoff for the normal ban. */
  normalByBatch: Map<number, string>
  /** batchId -> normalised "after this" cutoff for the agreement ban. */
  agreementByBatch: Map<number, string>
}

/**
 * Sentinel cutoff used when a ban flag is set but carries no (valid) date: we treat
 * it as "restrict everything scheduled". Every non-empty schedule string sorts after
 * `''`, so {@link isScheduledAfterBanCutoff} returns true for all scheduled content.
 */
const RESTRICT_ALL_CUTOFF = ''

export async function getUserBatchBans(userId: number): Promise<UserBatchBans> {
  const rows = await db
    .select({ batchId: batchUser.batchId, meta: batchUser.meta })
    .from(batchUser)
    .where(and(eq(batchUser.userId, userId), isNull(batchUser.deletedAt)))

  const normalByBatch = new Map<number, string>()
  const agreementByBatch = new Map<number, string>()

  for (const row of rows) {
    const meta = parseBatchUserMeta(row.meta)
    if (meta.batchBanned === true) {
      normalByBatch.set(row.batchId, normalizeBanCutoff(meta.batchBannedDate))
    }
    if (meta.aggrementBatchBanned === true) {
      agreementByBatch.set(
        row.batchId,
        normalizeBanCutoff(meta.aggrementBatchBannedDate),
      )
    }
  }

  return { normalByBatch, agreementByBatch }
}

function parseBatchUserMeta(meta: string | null): Record<string, unknown> {
  if (!meta) return {}
  try {
    const parsed = JSON.parse(meta)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

/**
 * Normalises an admin-entered IST ban date to a comparable `"YYYY-MM-DD HH:MM:SS"`
 * cutoff string (content schedules are the same IST wall-clock format, so plain
 * string comparison is timezone-safe). A date-only value is pushed to end-of-day so
 * "scheduled after the ban date" excludes the ban day itself. Missing/invalid input
 * falls back to {@link RESTRICT_ALL_CUTOFF}.
 */
export function normalizeBanCutoff(raw: unknown): string {
  if (typeof raw !== 'string') return RESTRICT_ALL_CUTOFF
  const value = raw.trim().replace('T', ' ')
  if (!value) return RESTRICT_ALL_CUTOFF

  const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(value)
  if (dateOnly) return `${dateOnly[1]} 23:59:59`

  const dateTime = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})(:\d{2})?/.exec(value)
  if (dateTime) return `${dateTime[1]} ${dateTime[2]}${dateTime[3] ?? ':00'}`

  return value
}

/**
 * True when a content item's schedule is strictly after the ban cutoff (so it must be
 * restricted). Items without a schedule are never "after" the cutoff.
 */
export function isScheduledAfterBanCutoff(
  schedule: string | null | undefined,
  cutoff: string,
): boolean {
  if (schedule == null || schedule === '') return false
  return schedule.trim().replace('T', ' ') > cutoff
}

/**
 * Builds a keep-predicate for normal-ban filtering of listing/dashboard rows. A row is
 * hidden only when its section's batch has a normal ban and the row is scheduled after
 * that batch's cutoff. Rows in non-banned batches (or with an unknown section) are kept.
 */
export function makeNormalBanScheduleFilter(
  normalByBatch: Map<number, string>,
  sectionToBatch: Map<number, number>,
): (row: { sectionId?: number | null; schedule: string | null }) => boolean {
  return (row) => {
    const batchId = row.sectionId != null ? sectionToBatch.get(row.sectionId) : undefined
    if (batchId == null) return true
    const cutoff = normalByBatch.get(batchId)
    if (cutoff == null) return true
    return !isScheduledAfterBanCutoff(row.schedule, cutoff)
  }
}
