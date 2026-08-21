import {
  AI_LECTURE_CHAT_LANGUAGES,
  DEFAULT_AI_LECTURE_CHAT_LANGUAGE,
  type AiLectureChatLanguage,
} from '@/components/features/lecture-ai-chat/languages'

/**
 * Excluded because the interview STT model (gpt-4o-mini-transcribe) rejects
 * these outright as a language hint — verified live against
 * `POST /v1/realtime/client_secrets` (400 `invalid_value`). Offering them
 * here would mean the candidate's answer transcribes with no language hint
 * at all, the same failure mode this list exists to avoid.
 */
const STT_UNSUPPORTED_LANGUAGES: ReadonlyArray<AiLectureChatLanguage> = [
  'Punjabi',
  'Odia',
  'Assamese',
]

/** Languages selectable for a practice interview — a subset of the full
 * lecture AI chat language list, restricted to ones the STT model can
 * actually hint. */
export const INTERVIEW_LANGUAGES: ReadonlyArray<AiLectureChatLanguage> =
  AI_LECTURE_CHAT_LANGUAGES.filter(
    (language) => !STT_UNSUPPORTED_LANGUAGES.includes(language),
  )

/** Falls back to the default when a previously-stored language (shared with
 * lecture AI chat, which offers the full list) isn't offered for interviews. */
export function toInterviewLanguage(
  language: AiLectureChatLanguage,
): AiLectureChatLanguage {
  return INTERVIEW_LANGUAGES.includes(language)
    ? language
    : DEFAULT_AI_LECTURE_CHAT_LANGUAGE
}
