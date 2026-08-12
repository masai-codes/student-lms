/**
 * Client-side mirror of `AI_TUTOR_CHAT_MAX_MESSAGE_LENGTH`
 * (src/server/api/ai-tutor/constants.ts). Duplicated so the composer can
 * enforce the cap without pulling server code into the browser bundle.
 */
export const LECTURE_AI_CHAT_MAX_MESSAGE_LENGTH = 4_000

export type LectureAiChatSuggestionKind = 'summary' | 'explain' | 'quiz'

export type LectureAiChatSuggestion = {
  kind: LectureAiChatSuggestionKind
  label: string
}

export const LECTURE_AI_CHAT_SUGGESTIONS: Array<LectureAiChatSuggestion> = [
  { kind: 'summary', label: 'Summarize the key points of this lecture' },
  { kind: 'explain', label: 'Explain the main concept in simple terms' },
  { kind: 'quiz', label: 'Give me a short quiz to practice' },
]
