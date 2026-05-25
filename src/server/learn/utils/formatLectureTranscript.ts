import type { LectureTranscriptSegment } from '@/server/learn/lectureDetailTypes'
import { normalizeNullableText } from '@/server/learn/utils/normalizeNullableText'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readSegments(raw: unknown): Array<unknown> | null {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return null
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed
      if (isRecord(parsed)) {
        const candidate = parsed.transcripts ?? parsed.segments
        if (Array.isArray(candidate)) return candidate
      }
      return null
    } catch {
      return null
    }
  }
  return null
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toSegment(
  raw: unknown,
  fallbackId: number,
): LectureTranscriptSegment | null {
  if (!isRecord(raw)) return null
  const text = typeof raw.text === 'string' ? raw.text.trim() : ''
  if (!text) return null
  const start = toFiniteNumber(raw.start)
  if (start == null) return null
  const explicitEnd = toFiniteNumber(raw.end)
  const end = explicitEnd != null && explicitEnd > start ? explicitEnd : start
  const explicitId = toFiniteNumber(raw.id)
  return {
    id: explicitId != null ? explicitId : fallbackId,
    start: Math.max(0, start),
    end: Math.max(start, end),
    text,
  }
}

/** Parse raw lectures_ai segments (string or array) into typed transcript segments. */
export function parseLectureTranscriptSegments(
  raw: unknown,
): Array<LectureTranscriptSegment> {
  const list = readSegments(raw)
  if (list == null) return []

  const result: Array<LectureTranscriptSegment> = []
  list.forEach((entry, index) => {
    const segment = toSegment(entry, index)
    if (segment != null) result.push(segment)
  })
  return result
}

/** Plain-text fallback: prefer stored transcript text, otherwise stringify segments. */
export function buildTranscriptPlainText(input: {
  transcript: string | null
  segments: Array<LectureTranscriptSegment>
}): string | null {
  const stored = normalizeNullableText(input.transcript)
  if (stored != null) return stored
  if (input.segments.length === 0) return null

  const lines = input.segments.map(segment => segment.text).filter(Boolean)
  return lines.length > 0 ? lines.join('\n\n') : null
}
