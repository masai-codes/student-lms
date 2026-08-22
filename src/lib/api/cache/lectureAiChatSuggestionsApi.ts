import { fetchJson } from '@/lib/api/fetchJson'
import { CACHE_API } from '@/lib/api/cachePaths'
import type { LectureAiChatSuggestion } from '@/server/api/ai-tutor/types/chatSuggestions'

export type {
  LectureAiChatSuggestion,
  LectureAiChatSuggestionIcon,
} from '@/server/api/ai-tutor/types/chatSuggestions'

/** Fetches the combined lecture FAQs + fixed suggestions from the CloudFront-cached endpoint. */
export async function getLectureAiChatSuggestions(
  lectureId: number,
): Promise<{ suggestions: Array<LectureAiChatSuggestion> }> {
  return fetchJson<{ suggestions: Array<LectureAiChatSuggestion> }>(
    CACHE_API.lectureAiChatSuggestions(lectureId),
  )
}
