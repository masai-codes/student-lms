import { ApiError } from '@/server/api/http/apiError'

export type AiTutorFeedbackPlatform = 'ios' | 'android' | 'web' | 'app'

const PLATFORMS: readonly AiTutorFeedbackPlatform[] = [
  'ios',
  'android',
  'web',
  'app',
]

export function parsePlatform(value: unknown): AiTutorFeedbackPlatform {
  if (value == null || value === '') return 'app'
  if (typeof value !== 'string') {
    throw new ApiError(400, 'AI_TUTOR_PLATFORM_INVALID')
  }
  const normalized = value.toLowerCase() as AiTutorFeedbackPlatform
  if (!PLATFORMS.includes(normalized)) {
    throw new ApiError(400, 'AI_TUTOR_PLATFORM_INVALID')
  }
  return normalized
}

export function parseRatingForPlatform(
  value: unknown,
  platform: AiTutorFeedbackPlatform,
): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed)) {
    throw new ApiError(400, 'AI_TUTOR_RATING_INVALID')
  }

  if (platform === 'web' || platform === 'app') {
    // if (parsed !== 0 && parsed !== 1) {
    //   throw new ApiError(400, 'AI_TUTOR_RATING_INVALID')
    // }
    return parsed
  }

  if (parsed < 1 || parsed > 5) {
    throw new ApiError(400, 'AI_TUTOR_RATING_INVALID')
  }
  return parsed + 1
}

export function encodeFeedbackWithPlatform(
  platform: AiTutorFeedbackPlatform,
  feedback: string | null,
): string {
  if (feedback == null || feedback.trim().length === 0) {
    return platform
  }
  return `${platform}-${feedback}`
}
