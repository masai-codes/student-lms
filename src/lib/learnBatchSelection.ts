const LAST_SELECTED_BATCH_STORAGE_KEY = 'learn:lastSelectedBatchByUserId'

type BatchId = string | number | null
type BatchSelectionMap = Record<string, BatchId>

const inMemoryLastSelectedBatchByUserId: Partial<BatchSelectionMap> = {}

const readPersistedBatchSelection = (): BatchSelectionMap => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LAST_SELECTED_BATCH_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as BatchSelectionMap
  } catch {
    return {}
  }
}

const writePersistedBatchSelection = (selection: BatchSelectionMap) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      LAST_SELECTED_BATCH_STORAGE_KEY,
      JSON.stringify(selection),
    )
  } catch {
    // no-op: storage access can fail in restricted environments
  }
}

export const getLastSelectedBatchIdForUser = (
  userId?: string | number | null,
): BatchId => {
  if (!userId) return null
  const normalizedUserId = String(userId)
  const inMemory = inMemoryLastSelectedBatchByUserId[normalizedUserId]
  if (inMemory !== undefined) return inMemory
  const persisted = readPersistedBatchSelection()
  return persisted[normalizedUserId] ?? null
}

export const setLastSelectedBatchIdForUser = (
  userId: string | number | null | undefined,
  batchId: BatchId,
) => {
  if (!userId) return
  const normalizedUserId = String(userId)
  inMemoryLastSelectedBatchByUserId[normalizedUserId] = batchId
  const persisted = readPersistedBatchSelection()
  persisted[normalizedUserId] = batchId
  writePersistedBatchSelection(persisted)
}
