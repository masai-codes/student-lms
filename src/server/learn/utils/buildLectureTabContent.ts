import type { LectureDetailTabContent } from '@/server/learn/lectureDetailTypes'
import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import { appendZoomChatToNotes } from '@/server/learn/utils/appendZoomChatToNotes'
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
  notes: string | null
  /** `lecture_zoom_chat.final_chat` — links scraped from the Zoom chat, if any. */
  zoomChatFinalChat?: unknown
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
    notes: appendZoomChatToNotes(input.notes, input.zoomChatFinalChat),
    aiSummary,
    transcript,
    transcriptSegments,
    associatedItems: input.associatedItems,
  }
}
