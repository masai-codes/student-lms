import { ApiError } from '@/server/api/http/apiError'

export type AiTutorChatLanguage =
  | 'English'
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

const LANGUAGE_ALIASES: Record<string, AiTutorChatLanguage> = {
  en: 'English',
  english: 'English',
  hi: 'Hindi',
  hindi: 'Hindi',
  ta: 'Tamil',
  tamil: 'Tamil',
  te: 'Telugu',
  telugu: 'Telugu',
  kn: 'Kannada',
  kannada: 'Kannada',
  ml: 'Malayalam',
  malayalam: 'Malayalam',
  bn: 'Bengali',
  bengali: 'Bengali',
  bangla: 'Bengali',
  mr: 'Marathi',
  marathi: 'Marathi',
  gu: 'Gujarati',
  gujarati: 'Gujarati',
  pa: 'Punjabi',
  punjabi: 'Punjabi',
  or: 'Odia',
  odia: 'Odia',
  oriya: 'Odia',
  as: 'Assamese',
  assamese: 'Assamese',
}

export function parseChatLanguage(value: unknown): AiTutorChatLanguage | undefined {
  if (value == null || value === '') return undefined
  if (typeof value !== 'string') {
    throw new ApiError(400, 'AI_TUTOR_LANGUAGE_INVALID')
  }

  const language = LANGUAGE_ALIASES[value.trim().toLowerCase()]
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!language) {
    throw new ApiError(400, 'AI_TUTOR_LANGUAGE_INVALID')
  }

  return language
}
