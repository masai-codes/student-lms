/**
 * Reply languages the AI tutor can answer in. The selected value is sent to
 * `POST /api/ai-tutor/chat/stream` as the `language` payload field so the
 * assistant responds in that language.
 */
export type AiLectureChatLanguage =
  | 'English'
  | 'Hinglish'
  | 'Hindi'
  | 'Tamil'
  | 'Telugu'
  | 'Kannada'
  | 'Malayalam'
  | 'Bengali'
  | 'Marathi'
  | 'Gujarati'
  | 'Punjabi'
  | 'Odia'
  | 'Assamese'

/** Ordered list of selectable reply languages. English leads as the default. */
export const AI_LECTURE_CHAT_LANGUAGES: ReadonlyArray<AiLectureChatLanguage> = [
  'English',
  'Hinglish',
  'Hindi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Punjabi',
  'Odia',
  'Assamese',
]

const DEFAULT_AI_LECTURE_CHAT_LANGUAGE: AiLectureChatLanguage = 'English'

/** Native-script labels shown alongside the English name in the picker. */
export const AI_LECTURE_CHAT_LANGUAGE_NATIVE_LABELS: Record<
  AiLectureChatLanguage,
  string
> = {
  English: 'English',
  Hinglish: 'Hinglish',
  Hindi: 'हिन्दी',
  Tamil: 'தமிழ்',
  Telugu: 'తెలుగు',
  Kannada: 'ಕನ್ನಡ',
  Malayalam: 'മലയാളം',
  Bengali: 'বাংলা',
  Marathi: 'मराठी',
  Gujarati: 'ગુજરાતી',
  Punjabi: 'ਪੰਜਾਬੀ',
  Odia: 'ଓଡ଼ିଆ',
  Assamese: 'অসমীয়া',
}

/**
 * localStorage key holding the learner's last-chosen reply language. Shared
 * across every lecture and both chat surfaces (desktop panel + mobile dock) so
 * the preference is picked once and remembered.
 */
export const AI_LECTURE_CHAT_LANGUAGE_STORAGE_KEY = 'lecture-ai-chat:language'

function isAiLectureChatLanguage(
  value: unknown,
): value is AiLectureChatLanguage {
  return (
    typeof value === 'string' &&
    AI_LECTURE_CHAT_LANGUAGES.includes(value as AiLectureChatLanguage)
  )
}

/**
 * Reads the persisted reply language, falling back to the English default when
 * there is no window (SSR), storage is unavailable, or the stored value is not
 * a known language.
 */
export function readStoredAiLectureChatLanguage(): AiLectureChatLanguage {
  if (typeof window === 'undefined') return DEFAULT_AI_LECTURE_CHAT_LANGUAGE
  try {
    const stored = window.localStorage.getItem(
      AI_LECTURE_CHAT_LANGUAGE_STORAGE_KEY,
    )
    return isAiLectureChatLanguage(stored)
      ? stored
      : DEFAULT_AI_LECTURE_CHAT_LANGUAGE
  } catch {
    return DEFAULT_AI_LECTURE_CHAT_LANGUAGE
  }
}

/** Persists the chosen reply language; silently no-ops when storage is unavailable. */
export function writeStoredAiLectureChatLanguage(
  language: AiLectureChatLanguage,
): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(AI_LECTURE_CHAT_LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Private mode / disabled storage — keep the in-memory selection only.
  }
}
