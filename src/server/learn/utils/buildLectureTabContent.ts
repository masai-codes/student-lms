import type { LectureDetailTabContent } from '@/server/learn/lectureDetailTypes'
import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import { formatLectureTranscript } from '@/server/learn/utils/formatLectureTranscript'
import { isLectureAiFieldPublished } from '@/server/learn/utils/isLectureAiFieldPublished'
import { normalizeNullableText } from '@/server/learn/utils/normalizeNullableText'

type LecturesAiRow = {
  summary: string | null
  transcript: string | null
  transcriptSegments: unknown
  isSummaryPublished: number | null
} | null

export function buildLectureTabContent(input: {
  description: string | null
  notes: string | null
  lecturesAi: LecturesAiRow
  associatedItems: Array<LearnAssociatedListItem>
}): LectureDetailTabContent {
  const ai = input.lecturesAi

  const aiSummary =
    ai != null &&
    isLectureAiFieldPublished(ai.isSummaryPublished) &&
    normalizeNullableText(ai.summary) != null
      ? normalizeNullableText(ai.summary)
      : null

  const transcript =
    ai != null
      ? formatLectureTranscript({
          transcript: ai.transcript,
          transcriptSegments: ai.transcriptSegments,
        })
      : null

  return {
    description: normalizeNullableText(input.description),
    notes: normalizeNullableText(input.notes),
    aiSummary,
    transcript,
    associatedItems: input.associatedItems,
  }
}
