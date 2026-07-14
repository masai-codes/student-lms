import { eq, ne } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { batches } from '@/db/schema'
import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import { getRequestPortal } from '@/server/auth/v2/portalContext'

/**
 * The sentinel `batches.duration` value that marks a batch as belonging to the
 * iHub portal. Every other value is treated as a Masai batch. This is the ONE
 * place that encodes that rule — import `isIHubBatch` / `batchScopeForPortal`
 * everywhere instead of re-comparing the string.
 */
export const IHUB_BATCH_DURATION = 'ihub'

/** Whether a raw `batches.duration` value denotes an iHub batch. */
export function isIHubBatch(duration: string | null | undefined): boolean {
  return duration === IHUB_BATCH_DURATION
}

/**
 * Whether a batch (identified by its `duration`) is visible on `portal`:
 *   - iHub portal  → only iHub batches (`duration === 'ihub'`)
 *   - Masai portal → only non-iHub batches (`duration !== 'ihub'`)
 */
export function batchVisibleOnPortal(
  duration: string | null | undefined,
  portal: EmailPortal,
): boolean {
  return portal === 'ihub' ? isIHubBatch(duration) : !isIHubBatch(duration)
}

/**
 * Drizzle `WHERE` fragment scoping `batches.duration` to `portal`. Drop this
 * into any query that joins `batches` (aliased or not — pass the column) to keep
 * iHub and Masai data separated. Defaults to the current request's portal.
 *
 * Usage:
 *   .where(and(<existing>, batchScopeForPortal()))
 */
export function batchScopeForPortal(
  portal: EmailPortal = getRequestPortal(),
): SQL {
  return portal === 'ihub'
    ? eq(batches.duration, IHUB_BATCH_DURATION)
    : ne(batches.duration, IHUB_BATCH_DURATION)
}
