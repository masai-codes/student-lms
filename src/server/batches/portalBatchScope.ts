import { and, eq, ne } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { batches } from '@/db/schema'
import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import { getRequestPortal } from '@/server/auth/v2/portalContext'

/**
 * The sentinel `batches.duration` values that mark a batch as belonging to a
 * non-Masai portal. Every other value is treated as a Masai batch. This is the
 * ONE place that encodes that rule — import `isIHubBatch` / `isIITJBatch` /
 * `batchScopeForPortal` everywhere instead of re-comparing the string.
 */
export const IHUB_BATCH_DURATION = 'ihub'
export const IITJ_BATCH_DURATION = 'iitj'

/** All non-Masai batch-duration sentinels; a Masai batch is anything NOT here. */
const NON_MASAI_BATCH_DURATIONS = [
  IHUB_BATCH_DURATION,
  IITJ_BATCH_DURATION,
] as const

/** Whether a raw `batches.duration` value denotes an iHub batch. */
export function isIHubBatch(duration: string | null | undefined): boolean {
  return duration === IHUB_BATCH_DURATION
}

/** Whether a raw `batches.duration` value denotes an IIT Jodhpur batch. */
export function isIITJBatch(duration: string | null | undefined): boolean {
  return duration === IITJ_BATCH_DURATION
}

/**
 * Whether a batch (identified by its `duration`) is visible on `portal`:
 *   - iHub portal  → only iHub batches (`duration === 'ihub'`)
 *   - IITJ portal  → only IIT Jodhpur batches (`duration === 'iitj'`)
 *   - Masai portal → only Masai batches (`duration` is neither 'ihub' nor 'iitj')
 */
export function batchVisibleOnPortal(
  duration: string | null | undefined,
  portal: EmailPortal,
): boolean {
  if (portal === 'ihub') return isIHubBatch(duration)
  if (portal === 'iitj') return isIITJBatch(duration)
  return !isIHubBatch(duration) && !isIITJBatch(duration)
}

/**
 * Drizzle `WHERE` fragment scoping `batches.duration` to `portal`. Drop this
 * into any query that joins `batches` (aliased or not — pass the column) to keep
 * each portal's data separated. Defaults to the current request's portal.
 *
 * Masai excludes ALL non-Masai durations, so iHub and IIT Jodhpur batches never
 * leak onto the Masai portal.
 *
 * Usage:
 *   .where(and(<existing>, batchScopeForPortal()))
 */
export function batchScopeForPortal(
  portal: EmailPortal = getRequestPortal(),
): SQL {
  if (portal === 'ihub') return eq(batches.duration, IHUB_BATCH_DURATION)
  if (portal === 'iitj') return eq(batches.duration, IITJ_BATCH_DURATION)
  return and(
    ...NON_MASAI_BATCH_DURATIONS.map((d) => ne(batches.duration, d)),
  ) as SQL
}
