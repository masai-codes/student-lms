import type {
  LectureDetailTabContent,
  LectureTranscriptSource,
} from '@/server/learn/lectureDetailTypes'
import type { LearningItem } from '@/server/learn/types'
import { CACHE_API } from '@/lib/api/cachePaths'
import { appendZoomChatToNotes } from '@/server/learn/utils/appendZoomChatToNotes'
import { normalizeNullableText } from '@/server/learn/utils/normalizeNullableText'

type LecturesAiRow = {
  summary: string | null
  /** Existence probe only — the transcript text itself never leaves the DB here. */
  hasTranscript: boolean
} | null

/**
 * Resolve the lazy-fetch pointer for the transcript. A lecture missing its batch
 * or section can't be addressed on the cache path, so it reports unavailable
 * rather than falling back to an uncacheable endpoint.
 */
export function buildLectureTranscriptSource(input: {
  hasTranscript: boolean
  batchId: number | null
  sectionId: number | null
  lectureId: number
}): LectureTranscriptSource {
  if (
    !input.hasTranscript ||
    input.batchId == null ||
    input.sectionId == null
  ) {
    return { available: false, url: null }
  }

  return {
    available: true,
    url: CACHE_API.lectureTranscript(
      input.batchId,
      input.sectionId,
      input.lectureId,
    ),
  }
}

export function buildLectureTabContent(input: {
  notes: string | null
  /** `lecture_zoom_chat.final_chat` — links scraped from the Zoom chat, if any. */
  zoomChatFinalChat?: unknown
  lecturesAi: LecturesAiRow
  associatedItems: Array<LearningItem>
  lectureId: number
  batchId: number | null
  sectionId: number | null
}): LectureDetailTabContent {
  const ai = input.lecturesAi

  return {
    notes: appendZoomChatToNotes(input.notes, input.zoomChatFinalChat),
    aiSummary: ai != null ? normalizeNullableText(ai.summary) : null,
    transcript: buildLectureTranscriptSource({
      hasTranscript: ai?.hasTranscript ?? false,
      batchId: input.batchId,
      sectionId: input.sectionId,
      lectureId: input.lectureId,
    }),
    associatedItems: input.associatedItems,
  }
}
