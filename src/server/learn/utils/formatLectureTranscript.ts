import { normalizeNullableText } from '@/server/learn/utils/normalizeNullableText'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatSegments(segments: unknown): string | null {
  if (!Array.isArray(segments) || segments.length === 0) return null

  const lines = segments
    .map(segment => {
      if (!isRecord(segment)) return null
      const text = typeof segment.text === 'string' ? segment.text.trim() : ''
      if (!text) return null
      const start =
        typeof segment.start === 'number' && Number.isFinite(segment.start)
          ? formatTimestamp(segment.start)
          : null
      return start != null ? `[${start}] ${text}` : text
    })
    .filter((line): line is string => line != null)

  return lines.length > 0 ? lines.join('\n\n') : null
}

export function formatLectureTranscript(input: {
  transcript: string | null
  transcriptSegments: unknown
}): string | null {
  return (
    normalizeNullableText(input.transcript) ??
    formatSegments(input.transcriptSegments)
  )
}
