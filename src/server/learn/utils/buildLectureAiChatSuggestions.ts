import { parseLectureAiFaqs } from '@/server/api/ai-tutor/types/lectureFaqs'

export type LectureAiChatSuggestionKind = 'faq' | 'summary' | 'explain' | 'quiz'

export type LectureAiChatSuggestion = {
  kind: LectureAiChatSuggestionKind
  question: string
}

/** Generic prompts always appended after lecture-specific FAQs. */
export const LECTURE_AI_CHAT_SUGGESTION_DEFAULTS: Array<
  Omit<LectureAiChatSuggestion, 'kind'> & {
    kind: Exclude<LectureAiChatSuggestionKind, 'faq'>
  }
> = [
  {
    kind: 'summary',
    question: 'Summarize the key points of this lecture',
  },
  {
    kind: 'explain',
    question: 'What are the core concepts I should understand?',
  },
  {
    kind: 'quiz',
    question: 'Quiz me on this lecture',
  },
]

const FAQ_SUGGESTION_LIMIT = 3
/** Hard cap on the full suggestion list returned to clients. */
const TOTAL_SUGGESTION_LIMIT = 6

/**
 * Builds the chat empty-state suggestion list for a lecture detail payload.
 * FAQs (max 3, randomized) come first; the three generic prompts follow.
 * The combined list is capped at {@link TOTAL_SUGGESTION_LIMIT}.
 *
 * @param random - Injected for deterministic tests; defaults to `Math.random`.
 */
export function buildLectureAiChatSuggestions(
  faqsRaw: unknown,
  random: () => number = Math.random,
): Array<LectureAiChatSuggestion> {
  const faqs = parseLectureAiFaqs(faqsRaw)
  const faqSuggestions = faqs
    .map((faq) => ({ question: faq.question, index: random() }))
    .sort((a, b) => a.index - b.index)
    .slice(0, FAQ_SUGGESTION_LIMIT)
    .map(
      (entry): LectureAiChatSuggestion => ({
        kind: 'faq',
        question: entry.question,
      }),
    )

  return [...faqSuggestions, ...LECTURE_AI_CHAT_SUGGESTION_DEFAULTS].slice(
    0,
    TOTAL_SUGGESTION_LIMIT,
  )
}
