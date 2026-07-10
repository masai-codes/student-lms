import { and, eq, isNull } from 'drizzle-orm'

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
 */
export async function getUserBatchRestrictions(
  userId: number,
): Promise<UserBatchRestrictions> {
  const rows = await db
    .select({ batchId: batchUser.batchId, meta: batchUser.meta })
    .from(batchUser)
    .where(and(eq(batchUser.userId, userId), isNull(batchUser.deletedAt)))

  const restrictions: UserBatchRestrictions = new Map()

  for (const row of rows) {
    const meta = parseBatchUserMeta(row.meta)
    const flags = extractRestrictionFlags(meta)
    if (
      flags.enrolmentCancelled ||
      flags.paused ||
      flags.agreementBanned
    ) {
      // A batch can appear on multiple batch_user rows; merge so any set flag wins.
      const existing = restrictions.get(row.batchId)
      restrictions.set(row.batchId, mergeFlags(existing, flags))
    }
  }

  return restrictions
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
