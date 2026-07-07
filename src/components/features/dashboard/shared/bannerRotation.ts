const LAST_BANNER_ID_KEY = 'dashboard_last_banner_id'

/**
 * Given the last banner id shown (from storage) and the current banner ids,
 * returns the index to show next — one past the last, wrapping around. A
 * missing/unknown last id (or empty list) starts at 0.
 */
export function computeNextBannerIndex(
  lastId: number | null,
  bannerIds: Array<number>,
): number {
  if (bannerIds.length === 0) return 0
  if (lastId === null) return 0
  const pos = bannerIds.indexOf(lastId)
  if (pos === -1) return 0
  return (pos + 1) % bannerIds.length
}

/**
 * Reads the last shown banner id from localStorage and returns the index to
 * start on (one past it). Rotation therefore advances once per page load so
 * users see a different banner over time. Safe when storage is unavailable
 * (SSR / privacy mode) — falls back to index 0.
 */
export function nextRotatedBannerIndex(bannerIds: Array<number>): number {
  if (bannerIds.length === 0) return 0

  let lastId: number | null = null
  try {
    const raw = window.localStorage.getItem(LAST_BANNER_ID_KEY)
    lastId = raw === null ? null : Number.parseInt(raw, 10)
    if (Number.isNaN(lastId)) lastId = null
  } catch {
    return 0
  }

  return computeNextBannerIndex(lastId, bannerIds)
}

/** Persists the currently shown banner id (best-effort). */
export function rememberBannerId(id: number): void {
  try {
    window.localStorage.setItem(LAST_BANNER_ID_KEY, String(id))
  } catch {
    // best-effort persistence; ignore storage write failures.
  }
}
