import { and, eq, isNull } from 'drizzle-orm'

import type { LectureTranscriptPayload } from '@/server/learn/lectureDetailTypes'

import { db } from '@/db'
import { lectures, lecturesAi } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import {
  buildTranscriptPlainText,
  parseLectureTranscriptSegments,
} from '@/server/learn/utils/formatLectureTranscript'

/**
 * Transcript for one lecture, addressed by its full batch → section → lecture
 * path. There is no session here by design: the response is CloudFront-cached on
 * the path alone, so it must be identical for every viewer. The batch and section
 * are therefore verified against the lecture row — a mismatched triple 404s
 * rather than serving the transcript to a guessed lecture id.
 */
export async function getCachedLectureTranscript(input: {
  batchId: number
  sectionId: number
  lectureId: number
}): Promise<LectureTranscriptPayload> {
  const rows = await db
    .select({
      transcript: lecturesAi.transcript,
      transcriptSegments: lecturesAi.transcriptSegments,
    })
    .from(lectures)
    .innerJoin(lecturesAi, eq(lecturesAi.lectureId, lectures.id))
    .where(
      and(
        eq(lectures.id, input.lectureId),
        eq(lectures.batchId, input.batchId),
        eq(lectures.sectionId, input.sectionId),
        isNull(lectures.deletedAt),
      ),
    )
    .limit(1)

  const row = rows[0]

  if (row == null) {
    throw new ApiError(404, 'LECTURE_TRANSCRIPT_NOT_FOUND')
  }

  const segments = parseLectureTranscriptSegments(row.transcriptSegments)
  // Send ONE representation, never both (#353): the segments are what the
  // Transcript tab and the caption overlay render, and the plain text is only a
  // fallback for lectures whose segments were never produced.
  const text =
    segments.length > 0
      ? null
      : buildTranscriptPlainText({ transcript: row.transcript, segments })

  if (segments.length === 0 && text == null) {
    // Nothing to cache. 404 (with `no-store`) rather than an empty 200, so a
    // transcript generated later isn't shadowed by a cached empty response.
    throw new ApiError(404, 'LECTURE_TRANSCRIPT_NOT_FOUND')
  }

  return { lectureId: input.lectureId, segments, text }
}
