const ROTATION_STORAGE_KEY = 'dashboard:welcomeBannerIndex'

/**
 * Given the last banner index shown (from storage) and the current banner
 * count, returns the index to show next — one step forward, wrapping around.
 * A null/invalid last index (or empty list) starts at 0.
 */
export function computeNextBannerIndex(
  lastIndex: number | null,
  count: number,
): number {
  if (count <= 0) return 0
  if (lastIndex === null || !Number.isInteger(lastIndex) || lastIndex < 0) {
    return 0
  }
  return (lastIndex + 1) % count
}

/**
 * Reads the last shown index from localStorage, advances one step, persists the
 * new index, and returns it. Rotation therefore advances once per page load so
 * users see a different banner over time. Safe to call when storage is
 * unavailable (SSR / privacy mode) — falls back to index 0.
 */
export function nextRotatedBannerIndex(count: number): number {
  if (count <= 0) return 0

  let lastIndex: number | null = null
  try {
    const raw = window.localStorage.getItem(ROTATION_STORAGE_KEY)
    lastIndex = raw === null ? null : Number.parseInt(raw, 10)
    if (Number.isNaN(lastIndex)) lastIndex = null
  } catch {
    return 0
  }

  const next = computeNextBannerIndex(lastIndex, count)
  try {
    window.localStorage.setItem(ROTATION_STORAGE_KEY, String(next))
  } catch {
    // Best-effort persistence; ignore storage write failures.
  }
  return next
}
