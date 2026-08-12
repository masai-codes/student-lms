import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { batchUser } from '@/db/schema'
import type {
  BatchRestrictionFlags,
  UserBatchRestrictions,
} from '@/server/restrictions/types'

/**
 * Reads and normalises the per-batch restriction flags for a user from
 * `batch_user.meta`. Only batches that carry at least one restriction flag are
 * included in the returned map; everything else is treated as unrestricted.
 *
 * ⚠️ Soft-deleted `batch_user` rows are READ, not skipped. Cancelling an
 * enrolment sets `batchEnrolmentCancelled` in `meta` AND soft-deletes the row in
 * the same operation, so filtering on `deleted_at IS NULL` drops exactly the
 * rows that carry the restriction — the user then looks unrestricted while
 * `section_user` (never deleted) still resolves their sections, and cancelled
 * content leaks back into the learn/dashboard feeds. A soft-deleted row is only
 * consulted when the batch has no live row (see {@link pickRowsForBatch}), so a
 * re-enrolment into the same batch is not shadowed by its old cancelled row.
 */
export async function getUserBatchRestrictions(
  userId: number,
): Promise<UserBatchRestrictions> {
  const rows = await db
    .select({
      batchId: batchUser.batchId,
      meta: batchUser.meta,
      deletedAt: batchUser.deletedAt,
    })
    .from(batchUser)
    .where(eq(batchUser.userId, userId))

  const restrictions: UserBatchRestrictions = new Map()

  const rowsByBatch = new Map<number, Array<(typeof rows)[number]>>()
  for (const row of rows) {
    const bucket = rowsByBatch.get(row.batchId)
    if (bucket) bucket.push(row)
    else rowsByBatch.set(row.batchId, [row])
  }

  for (const [batchId, batchRows] of rowsByBatch) {
    for (const row of pickRowsForBatch(batchRows)) {
      const meta = parseBatchUserMeta(row.meta)
      const flags = extractRestrictionFlags(meta)
      if (flags.enrolmentCancelled || flags.paused || flags.agreementBanned) {
        // A batch can appear on multiple batch_user rows; merge so any set flag wins.
        restrictions.set(batchId, mergeFlags(restrictions.get(batchId), flags))
      }
    }
  }

  return restrictions
}

/**
 * The rows that describe a batch's CURRENT state: the live (non-deleted) rows
 * when there are any, otherwise the soft-deleted ones. Falling back to deleted
 * rows is what keeps a cancelled enrolment restricted; preferring live rows is
 * what stops a stale cancellation from restricting a fresh enrolment.
 */
function pickRowsForBatch<T extends { deletedAt: unknown }>(
  batchRows: Array<T>,
): Array<T> {
  const live = batchRows.filter((row) => row.deletedAt == null)
  return live.length > 0 ? live : batchRows
}

function extractRestrictionFlags(
  meta: Record<string, unknown>,
): BatchRestrictionFlags {
  return {
    enrolmentCancelled: meta.batchEnrolmentCancelled === true,
    enrolmentCancelledDate: asDateString(meta.batchEnrolmentCancelledDate),
    paused: meta.batchPaused === true,
    pausedDate: asDateString(meta.batchPausedDate),
    agreementBanned: meta.aggrementBanned === true,
    agreementBannedDate: asDateString(meta.aggrementBannedDate),
  }
}

function mergeFlags(
  existing: BatchRestrictionFlags | undefined,
  next: BatchRestrictionFlags,
): BatchRestrictionFlags {
  if (!existing) return next
  return {
    enrolmentCancelled: existing.enrolmentCancelled || next.enrolmentCancelled,
    enrolmentCancelledDate:
      existing.enrolmentCancelledDate ?? next.enrolmentCancelledDate,
    paused: existing.paused || next.paused,
    pausedDate: existing.pausedDate ?? next.pausedDate,
    agreementBanned: existing.agreementBanned || next.agreementBanned,
    agreementBannedDate:
      existing.agreementBannedDate ?? next.agreementBannedDate,
  }
}

function asDateString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

/**
 * `batch_user.meta` is a stringified JSON blob whose shape varies by writer:
 * - a plain object: `{"isiHub":true,"batchPaused":true}`, or
 * - an array of small objects (legacy): `[{"Student":"2022-07-25 00:00:00"}]`.
 *
 * We flatten both into a single record so restriction keys are found wherever
 * they were added (inside the existing object, or a new object in the array).
 */
function parseBatchUserMeta(meta: string | null): Record<string, unknown> {
  if (!meta) return {}
  try {
    const parsed = JSON.parse(meta)
    if (Array.isArray(parsed)) {
      return parsed.reduce<Record<string, unknown>>((acc, item) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          Object.assign(acc, item)
        }
        return acc
      }, {})
    }
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}
