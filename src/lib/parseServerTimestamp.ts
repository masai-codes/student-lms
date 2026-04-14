const TZ_SUFFIX_REGEX = /(Z|[+\-]\d{2}(?::?\d{2})?)$/i
const DATE_LIKE_REGEX = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

type ParseServerTimestampOptions = {
  /**
   * If a timezone-less timestamp interpreted as UTC lands too far in the future,
   * we fallback to local interpretation. This protects dev DBs configured to local time.
   */
  futureSkewMs?: number
  nowMs?: number
}

export function parseServerTimestamp(
  value: string | null | undefined,
  options: ParseServerTimestampOptions = {},
): Date | null {
  if (!value) {
    return null
  }

  const raw = String(value).trim()
  if (!raw) {
    return null
  }

  if (TZ_SUFFIX_REGEX.test(raw)) {
    const withZone = new Date(raw)
    return Number.isNaN(withZone.getTime()) ? null : withZone
  }

  if (!DATE_LIKE_REGEX.test(raw)) {
    const parsed = new Date(raw)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const normalized = raw.replace(' ', 'T')
  const utcCandidate = new Date(`${normalized}Z`)
  if (!Number.isNaN(utcCandidate.getTime())) {
    const nowMs = options.nowMs ?? Date.now()
    const futureSkewMs = options.futureSkewMs ?? 60 * 60 * 1000
    if (utcCandidate.getTime() <= nowMs + futureSkewMs) {
      return utcCandidate
    }
  }

  const localCandidate = new Date(normalized)
  return Number.isNaN(localCandidate.getTime()) ? null : localCandidate
}
