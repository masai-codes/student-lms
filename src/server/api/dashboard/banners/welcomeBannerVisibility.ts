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

/** Banner datetimes without an explicit zone are IST wall-clock. */
const IST_OFFSET = '+05:30'

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

/**
 * Old-LMS parity: a banner must *explicitly* target the user. An empty batch
 * list targets nobody (hidden); otherwise at least one targeted batch must be
 * one of the user's. Combined with {@link isBannerVisibleToGroup} via OR by the
 * service — never AND — matching the old resolver's student path.
 */
export function isBannerVisibleToBatches(
  visibility: BannerVisibility,
  userBatchIds: Array<string>,
): boolean {
  return (
    visibility.batches.length > 0 &&
    visibility.batches.some((batch) => userBatchIds.includes(batch))
  )
}

/**
 * Old-LMS parity: an empty random-group list targets nobody (hidden);
 * otherwise the user's A/B/C/D bucket must be listed.
 */
export function isBannerVisibleToGroup(
  visibility: BannerVisibility,
  userGroup: string,
): boolean {
  return (
    visibility.randomGroup.length > 0 &&
    visibility.randomGroup.includes(userGroup)
  )
}

/**
 * Old-LMS parity: the dashboard requests only non-Masaiverse banners
 * (`isMasaiVerse: false`), so a banner is shown only when its
 * `settings.isMasaiVerse` is *explicitly* `false`. Missing settings, a missing
 * flag, or `true` all hide the banner.
 */
export function isNonMasaiVerseBanner(
  raw: string | Record<string, unknown> | null | undefined,
): boolean {
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return false
    }
  }
  if (!parsed || typeof parsed !== 'object') return false
  return (parsed as Record<string, unknown>)['isMasaiVerse'] === false
}

/** Trailing `Z` or `±HH:MM` / `±HHMM` offset — i.e. the value is already absolute. */
const HAS_EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/

/**
 * Resolves a banner `start_date`/`end_date` to an absolute epoch.
 *
 * The driver hands these back in either shape depending on how the column is
 * read, so both must be handled:
 *   - zoned  — `2026-05-07T20:40:00+05:30` (already an instant; parse as-is)
 *   - naive  — `2026-05-07 20:40:00` (IST wall-clock; pin it to +05:30)
 *
 * Appending a bare `Z` to a value that *already* carries an offset produces an
 * Invalid Date, which previously made every banner's window unbounded — hence
 * the "every banner shows" bug. Returns `null` for missing/invalid values.
 */
export function parseBannerInstant(value: string | null): number | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
  const zoned = HAS_EXPLICIT_ZONE.test(normalized)
    ? normalized
    : `${normalized}${IST_OFFSET}`
  const time = new Date(zoned).getTime()
  return Number.isNaN(time) ? null : time
}

/**
 * Old-LMS parity: a banner is in-window only when BOTH `start_date` and
 * `end_date` are set and `nowMs` falls within `[start, end]`. A missing (or
 * unparseable) bound hides the banner — the old resolver requires
 * `start_date`/`end_date` to be NOT NULL and within range.
 */
export function isWithinBannerWindow(
  startDate: string | null,
  endDate: string | null,
  nowMs: number,
): boolean {
  const start = parseBannerInstant(startDate)
  const end = parseBannerInstant(endDate)
  if (start === null || end === null) return false
  if (nowMs < start) return false
  if (nowMs > end) return false
  return true
}

function toStringArray(value: unknown): Array<string> {
  return Array.isArray(value) ? value.map(String) : []
}
