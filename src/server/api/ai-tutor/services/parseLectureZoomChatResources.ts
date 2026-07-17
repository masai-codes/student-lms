export type LectureSharedResource = {
  url: string
  count: number | null
  postedBy: string | null
  timestamp: string | null
  resolvedTo: string | null
}

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function readCount(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

function parseFinalChatValue(finalChat: unknown): unknown {
  if (typeof finalChat !== 'string') return finalChat

  try {
    return JSON.parse(finalChat) as unknown
  } catch {
    return null
  }
}

export function parseLectureZoomChatResources(
  finalChat: unknown,
): Array<LectureSharedResource> {
  const parsed = parseFinalChatValue(finalChat)
  if (!Array.isArray(parsed)) return []

  const resources: Array<LectureSharedResource> = []

  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue

    const row = item as Record<string, unknown>
    const url = readTrimmedString(row.url)
    if (!url) continue

    resources.push({
      url,
      count: readCount(row.count),
      postedBy: readTrimmedString(row.posted_by),
      timestamp: readTrimmedString(row.timestamp),
      resolvedTo: readTrimmedString(row.resolved_to),
    })
  }

  return resources
}
