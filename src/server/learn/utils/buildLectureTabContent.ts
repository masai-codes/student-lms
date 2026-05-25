import type { LectureDetailTabContent } from '@/server/learn/lectureDetailTypes'
import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import {
  buildTranscriptPlainText,
  parseLectureTranscriptSegments,
} from '@/server/learn/utils/formatLectureTranscript'
import { normalizeNullableText } from '@/server/learn/utils/normalizeNullableText'

type LecturesAiRow = {
  summary: string | null
  transcript: string | null
  transcriptSegments: unknown
} | null

export function buildLectureTabContent(input: {
  description: string | null
  notes: string | null
  lecturesAi: LecturesAiRow
  associatedItems: Array<LearnAssociatedListItem>
}): LectureDetailTabContent {
  const ai = input.lecturesAi

  const aiSummary = ai != null ? normalizeNullableText(ai.summary) : null

  const transcriptSegments =
    ai != null ? parseLectureTranscriptSegments(ai.transcriptSegments) : []

  const transcript =
    ai != null
      ? buildTranscriptPlainText({
          transcript: ai.transcript,
          segments: transcriptSegments,
        })
      : null

  return {
    description: normalizeNullableText(input.description),
    notes: normalizeNullableText(input.notes),
    aiSummary,
    transcript,
    transcriptSegments,
    associatedItems: input.associatedItems,
  }
}
