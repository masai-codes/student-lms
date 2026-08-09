import { useRouterState } from '@tanstack/react-router'

import { getLastSelectedBatchIdForUser } from '@/lib/learnBatchSelection'

function toBatchId(value: unknown): number | undefined {
  const batchId =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : NaN
  return Number.isFinite(batchId) && batchId > 0 ? batchId : undefined
}

/**
 * The batch the student is currently looking at, for any Learn-scoped page.
 *
 * The live selection is the `?batchId` search param — that is what the batch
 * dropdown writes and what every Learn loader reads. `localStorage` is only the
 * cross-visit fallback (it is written by `/learn` after the fact), so reading it
 * alone made cross-page links carry a stale batch, or none at all on a first
 * visit, which the server then resolved to the first enrolled batch.
 */
export function useSelectedLearnBatchId(
  userId?: string | number | null,
): number | undefined {
  const searchBatchId = useRouterState({
    select: (state) => toBatchId(state.location.search.batchId),
  })
  return searchBatchId ?? toBatchId(getLastSelectedBatchIdForUser(userId))
}
