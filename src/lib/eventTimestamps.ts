const TZ_SUFFIX_REGEX = /(Z|[+\-]\d{2}(?::?\d{2})?)$/i
const NAIVE_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/i

/**
 * `events.start_time` / `end_time` come back as timezone-less strings. They are stored as UTC
 * wall clock (typical MySQL TIMESTAMP + UTC session). We must **always** parse naive values as
 * UTC — unlike `parseServerTimestamp`, which falls back to local time for "far future" strings
 * and would show 08:30 instead of 14:00 IST for `2026-04-21 08:30:00`.
 */
export function parseMasaiverseEventDbTimestamp(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null
  const raw = String(value).trim()

  if (TZ_SUFFIX_REGEX.test(raw)) {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d
  }

  if (NAIVE_DATETIME_REGEX.test(raw)) {
    const d = new Date(`${raw.replace(' ', 'T')}Z`)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * MySQL TIMESTAMP strings without a zone: read as UTC instant for comparisons and sorting.
 */
export function eventDbTimestampToMs(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  const d = parseMasaiverseEventDbTimestamp(value)
  if (!d || Number.isNaN(d.getTime())) return null
  return d.getTime()
}
