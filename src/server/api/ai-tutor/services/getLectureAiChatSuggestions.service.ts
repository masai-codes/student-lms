import { getLectureFaqs } from '@/server/api/ai-tutor/services/getLectureFaqs.service'
import { AI_TUTOR_FIXED_CHAT_SUGGESTIONS } from '@/server/api/ai-tutor/constants'
import type { LectureAiChatSuggestion } from '@/server/api/ai-tutor/types/chatSuggestions'

/** Cap on how many lecture-specific FAQs are offered as suggestions. */
const LECTURE_FAQ_SUGGESTION_LIMIT = 3

/**
 * Combines lecture-specific FAQs (`lectures_ai.faqs`) with the fixed
 * suggestions shown for every lecture, so the chat empty state can render
 * both from a single API call.
 */
export async function getLectureAiChatSuggestions(
  lectureId: number,
): Promise<Array<LectureAiChatSuggestion>> {
  const faqs = await getLectureFaqs(lectureId)
  const faqSuggestions: Array<LectureAiChatSuggestion> = faqs
    .map((faq) => ({ faq, sortKey: Math.random() }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, LECTURE_FAQ_SUGGESTION_LIMIT)
    .map(({ faq }) => ({ icon: 'faq' as const, question: faq.question }))

  return [...faqSuggestions, ...AI_TUTOR_FIXED_CHAT_SUGGESTIONS]
}
