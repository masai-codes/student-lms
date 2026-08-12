import { ApiError } from '@/server/api/http/apiError'

export type AiTutorFeedbackPlatform =
  | 'ios'
  | 'android'
  | 'web'
  | 'web-mobile'
  | 'web-desktop'
  | 'app'
  | 'web-new'

const PLATFORMS: ReadonlyArray<AiTutorFeedbackPlatform> = [
  'ios',
  'android',
  'web',
  'web-mobile',
  'web-desktop',
  'app',
  'web-desktop',
  'web-mobile',
  'web-new',
]

export const AI_TUTOR_FEEDBACK_PLATFORMS = PLATFORMS

function isWebLikePlatform(platform: AiTutorFeedbackPlatform): boolean {
  return (
    platform === 'web' ||
    platform === 'web-mobile' ||
    platform === 'web-desktop' ||
    platform === 'app'
  )
}

export function isAiTutorFeedbackPlatform(
  value: unknown,
): value is AiTutorFeedbackPlatform {
  return (
    typeof value === 'string' &&
    PLATFORMS.includes(value as AiTutorFeedbackPlatform)
  )
}

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

  if (isWebLikePlatform(platform)) {
    // if (parsed !== 0 && parsed !== 1) {
    //   throw new ApiError(400, 'AI_TUTOR_RATING_INVALID')
    // }
    return parsed
  }

  if (parsed < 1 || parsed > 5) {
    throw new ApiError(400, 'AI_TUTOR_RATING_INVALID')
  }
  return parsed
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

export function feedbackHasPlatformPrefix(
  feedback: string | null | undefined,
  platform: AiTutorFeedbackPlatform,
): boolean {
  if (feedback == null || feedback.length === 0) return false
  if (feedback === platform) return true
  if (!feedback.startsWith(`${platform}-`)) return false

  if (platform === 'web') {
    return !(
      feedback === 'web-mobile' ||
      feedback.startsWith('web-mobile-') ||
      feedback === 'web-desktop' ||
      feedback.startsWith('web-desktop-')
    )
  }

  return true
}

export function feedbackHasIosOrAndroidPrefix(
  feedback: string | null | undefined,
): boolean {
  return (
    feedbackHasPlatformPrefix(feedback, 'ios') ||
    feedbackHasPlatformPrefix(feedback, 'android')
  )
}

export function feedbackHasAnyPlatformPrefix(
  feedback: string | null | undefined,
): boolean {
  const sortedPlatforms = [...PLATFORMS].sort(
    (left, right) => right.length - left.length,
  )
  return sortedPlatforms.some((platform) =>
    feedbackHasPlatformPrefix(feedback, platform),
  )
}
