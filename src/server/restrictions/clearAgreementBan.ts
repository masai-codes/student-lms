import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { batchUser } from '@/db/schema'

// batch_user.meta is varchar(300) — never write past this or MySQL silently truncates.
const META_MAX_LENGTH = 300

/** Flatten batch_user.meta into one record, tolerating null / object / legacy array shapes. */
function parseMeta(meta: string | null): Record<string, unknown> {
  if (!meta) return {}
  try {
    const parsed = JSON.parse(meta)
    if (Array.isArray(parsed)) {
      return parsed.reduce<Record<string, unknown>>((acc, item) => {
        if (item && typeof item === 'object' && !Array.isArray(item))
          Object.assign(acc, item)
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

/**
 * Set/clear flags on batch_user.meta while preserving its existing JSON shape
 * (object stays object, legacy array writes into its first element). A value of
 * `undefined` deletes the key. Returns the new stringified meta.
 */
function applyMetaFlags(
  meta: string | null,
  flags: Record<string, unknown>,
): string {
  let parsed: unknown = null
  try {
    parsed = meta ? JSON.parse(meta) : null
  } catch {
    parsed = null
  }

  const mutate = (target: Record<string, unknown>): void => {
    for (const [k, v] of Object.entries(flags)) {
      if (v === undefined) delete target[k]
      else target[k] = v
    }
  }

  if (Array.isArray(parsed)) {
    if (
      parsed.length === 0 ||
      !parsed[0] ||
      typeof parsed[0] !== 'object' ||
      Array.isArray(parsed[0])
    ) {
      parsed[0] = {}
    }
    mutate(parsed[0] as Record<string, unknown>)
    return JSON.stringify(parsed)
  }

  const obj =
    parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : {}
  mutate(obj)
  return JSON.stringify(obj)
}

/**
 * Clears the agreement ban for a user's enrolment in a batch. Called right after a
 * student finishes their agreement so the ban the experience-api cron may have
 * stamped onto batch_user.meta is lifted immediately, without waiting for the next
 * cron run. Idempotent and shape-preserving; a no-op if the user isn't currently
 * agreement-banned.
 */
export async function clearAgreementBan(
  userId: number,
  batchId: number,
): Promise<void> {
  const rows = await db
    .select({ id: batchUser.id, meta: batchUser.meta })
    .from(batchUser)
    .where(
      and(
        eq(batchUser.userId, userId),
        eq(batchUser.batchId, batchId),
        isNull(batchUser.deletedAt),
      ),
    )

  for (const row of rows) {
    if (parseMeta(row.meta).aggrementBanned !== true) continue

    const newMeta = applyMetaFlags(row.meta, {
      aggrementBanned: false,
      aggrementBannedDate: undefined,
    })
    if (newMeta.length > META_MAX_LENGTH) continue

    await db
      .update(batchUser)
      .set({ meta: newMeta })
      .where(eq(batchUser.id, row.id))
  }
}
