const LAST_SELECTED_SECTION_STORAGE_KEY = 'learn:lastSelectedSectionByUserBatch'

/** `{ [userId]: { [batchId]: sectionId | null } }` — `null` means "Any section". */
type SectionSelectionMap = Record<string, Record<string, number | null>>

const inMemorySelection: SectionSelectionMap = {}

const readPersistedSelection = (): SectionSelectionMap => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LAST_SELECTED_SECTION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as SectionSelectionMap
  } catch {
    return {}
  }
}

const writePersistedSelection = (selection: SectionSelectionMap) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      LAST_SELECTED_SECTION_STORAGE_KEY,
      JSON.stringify(selection),
    )
  } catch {
    // no-op: storage access can fail in restricted environments
  }
}

/** Last section chosen for this user + batch, or `null` when "Any" (or unset). */
export const getLastSelectedSectionIdForUser = (
  userId: string | number | null | undefined,
  batchId: number,
): number | null => {
  if (!userId) return null
  const userKey = String(userId)
  const batchKey = String(batchId)
  const inMemory = inMemorySelection[userKey]?.[batchKey]
  if (inMemory !== undefined) return inMemory
  const persisted = readPersistedSelection()
  return persisted[userKey]?.[batchKey] ?? null
}

export const setLastSelectedSectionIdForUser = (
  userId: string | number | null | undefined,
  batchId: number,
  sectionId: number | null,
) => {
  if (!userId) return
  const userKey = String(userId)
  const batchKey = String(batchId)

  inMemorySelection[userKey] = {
    ...inMemorySelection[userKey],
    [batchKey]: sectionId,
  }

  const persisted = readPersistedSelection()
  persisted[userKey] = { ...persisted[userKey], [batchKey]: sectionId }
  writePersistedSelection(persisted)
}
