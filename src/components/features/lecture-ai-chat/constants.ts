/**
 * Client-side mirror of `AI_TUTOR_CHAT_MAX_MESSAGE_LENGTH`
 * (src/server/api/ai-tutor/constants.ts). Duplicated so the composer can
 * enforce the cap without pulling server code into the browser bundle.
 */
export const LECTURE_AI_CHAT_MAX_MESSAGE_LENGTH = 4_000

export const LECTURE_AI_CHAT_SUGGESTIONS = [
  'Summarize the key points of this lecture',
  'Explain the main concept in simple terms',
  'Give me a short quiz to practice',
  'Give me flashcards',
] as const
