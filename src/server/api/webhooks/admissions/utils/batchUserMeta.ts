/**
 * `batch_user.meta` is a JSON string in a `varchar(300)` column whose shape
 * varies by writer: a plain object (`{"isIhub":true}`) or a legacy array of
 * small objects (`[{"Student":"2022-07-25 00:00:00"}]`). This mirrors the
 * tolerant reader in `getUserBatchRestrictions` so restriction keys we write
 * (e.g. `batchEnrolmentCancelled`) are found there, and merges preserve any
 * pre-existing keys (`batchPaused`, `aggrementBanned`, `isIhub`, …).
 */
export function parseBatchUserMeta(
  meta: string | null,
): Record<string, unknown> {
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

/**
 * Merge `patch` into the existing parsed meta and return the JSON string to
 * store. Normalizes to the object form (the reader flattens arrays anyway).
 * `removeKeys` are deleted from the result — used to clear a flag by absence
 * (the restriction reader treats a missing key as "not set") rather than
 * storing a redundant `false`/`null`.
 */
export function buildBatchUserMeta(
  existing: string | null,
  patch: Record<string, unknown>,
  removeKeys: readonly string[] = [],
): string {
  const merged = { ...parseBatchUserMeta(existing), ...patch }
  for (const key of removeKeys) delete merged[key]
  return JSON.stringify(merged)
}
