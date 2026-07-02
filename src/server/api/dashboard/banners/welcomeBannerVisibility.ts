/**
 * Pure, side-effect-free helpers for deciding which banners a user may see.
 * The service layer fetches rows and calls these; keeping them pure makes the
 * visibility rules trivially unit-testable and reusable.
 */

/** Parsed shape of a banner's `visible_to` JSON column. */
export interface BannerVisibility {
  /** Batch ids the banner targets. Empty = visible to every batch. */
  batches: Array<string>
  /** A/B/C/D buckets the banner targets. Empty = visible to every group. */
  randomGroup: Array<string>
}

const IST_OFFSET_MINUTES = 5 * 60 + 30 // UTC+05:30

/** userId % 4 → A / B / C / D bucket for random-group targeting. */
const GROUP_LETTERS = ['A', 'B', 'C', 'D'] as const

export function getUserBannerGroup(userId: number): string {
  return GROUP_LETTERS[userId % GROUP_LETTERS.length]
}

/**
 * The `<group/type_variant>` segment for a banner's GTM event name
 * (`l_dashboard_banner_carousel_<key>_id_<id>`): the group name when set,
 * otherwise `type_variant`.
 */
export function buildBannerAnalyticsKey(
  groupName: string | null,
  type: string | null,
  variant: string | null,
): string {
  const group = groupName?.trim()
  if (group) return group
  return [type, variant]
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join('_')
}

export function parseBannerVisibility(
  raw: string | Record<string, unknown> | null | undefined,
): BannerVisibility {
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object') {
      return { batches: [], randomGroup: [] }
    }
    const record = parsed as Record<string, unknown>
    return {
      batches: toStringArray(record['batches']),
      randomGroup: toStringArray(record['random_group']),
    }
  } catch {
    return { batches: [], randomGroup: [] }
  }
}

/** Empty target list = everyone; otherwise at least one batch must match. */
export function isBannerVisibleToBatches(
  visibility: BannerVisibility,
  userBatchIds: Array<string>,
): boolean {
  return (
    visibility.batches.length === 0 ||
    visibility.batches.some((batch) => userBatchIds.includes(batch))
  )
}

/** Empty target list = everyone; otherwise the user's group must be listed. */
export function isBannerVisibleToGroup(
  visibility: BannerVisibility,
  userGroup: string,
): boolean {
  return (
    visibility.randomGroup.length === 0 ||
    visibility.randomGroup.includes(userGroup)
  )
}

/**
 * "Now" in IST wall-clock time, expressed as an epoch that can be compared
 * against IST-stored banner datetimes parsed via {@link parseIstWallClock}.
 */
export function getIstNowMs(nowMs: number): number {
  return nowMs + IST_OFFSET_MINUTES * 60_000
}

/**
 * Banner `start_date`/`end_date` are stored as IST wall-clock datetimes with no
 * zone. Parse them into the same frame as {@link getIstNowMs} so comparisons
 * line up. Returns `null` for missing/invalid values.
 */
export function parseIstWallClock(value: string | null): number | null {
  if (!value) return null
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const time = new Date(`${normalized}Z`).getTime()
  return Number.isNaN(time) ? null : time
}

/**
 * True when `istNowMs` falls within `[start, end]`. A missing bound is treated
 * as open on that side (a banner with no start has always started, etc.).
 */
export function isWithinBannerWindow(
  startDate: string | null,
  endDate: string | null,
  istNowMs: number,
): boolean {
  const start = parseIstWallClock(startDate)
  const end = parseIstWallClock(endDate)
  if (start !== null && istNowMs < start) return false
  if (end !== null && istNowMs > end) return false
  return true
}

function toStringArray(value: unknown): Array<string> {
  return Array.isArray(value) ? value.map(String) : []
}
