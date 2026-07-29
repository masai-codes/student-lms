'use client'

import { useQuery } from '@tanstack/react-query'

import type {
  LectureTranscriptSegment,
  LectureTranscriptSource,
} from '@/server/learn/lectureDetailTypes'
import { fetchLectureTranscriptFromCache } from '@/lib/api/cache/lectureTranscriptApi'

const EMPTY_SEGMENTS: Array<LectureTranscriptSegment> = []

export function lectureTranscriptQueryKey(url: string): Array<string> {
  return ['lecture-transcript', url]
}

export type LectureTranscriptState = {
  segments: Array<LectureTranscriptSegment>
  /** Plain-text fallback; only set for lectures without structured segments. */
  text: string | null
  /** Lecture the resolved transcript belongs to; null until the fetch lands. */
  lectureId: number | null
  isLoading: boolean
  isError: boolean
  /** False once a fetch resolved and produced neither segments nor text. */
  hasContent: boolean
}

/**
 * Lazily loads a lecture transcript, keyed on its cache URL so the caption overlay
 * and the Transcript tab share a single request (TanStack Query dedupes by key).
 * Nothing is fetched until `enabled` flips — captions being switched on, or the
 * Transcript tab being opened.
 *
 * The response is immutable at the edge for a day, so it never refetches within a
 * session.
 */
export function useLectureTranscript(
  source: LectureTranscriptSource,
  enabled: boolean,
): LectureTranscriptState {
  const url = source.url
  const query = useQuery({
    queryKey: lectureTranscriptQueryKey(url ?? ''),
    queryFn: () => fetchLectureTranscriptFromCache(url as string),
    enabled: enabled && source.available && url != null,
    staleTime: Infinity,
    retry: 1,
  })

  const segments = query.data?.segments ?? EMPTY_SEGMENTS
  const text = query.data?.text ?? null

  return {
    segments,
    text,
    lectureId: query.data?.lectureId ?? null,
    isLoading: query.isPending && query.fetchStatus === 'fetching',
    isError: query.isError,
    hasContent: segments.length > 0 || text != null,
  }
}
