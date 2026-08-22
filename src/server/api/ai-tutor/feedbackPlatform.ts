import { ApiError } from '@/server/api/http/apiError'

export type AiTutorFeedbackPlatform =
  | 'ios'
  | 'android'
  | 'app-ios'
  | 'app-android'
  | 'web'
  | 'web-mobile'
  | 'web-desktop'
  | 'app'
  | 'web-new'
  | 'web-new-desktop'
  | 'web-new-mobile'

const PLATFORMS: ReadonlyArray<AiTutorFeedbackPlatform> = [
  'ios',
  'android',
  'app-ios',
  'app-android',
  'web',
  'web-mobile',
  'web-desktop',
  'app',
  'web-new',
  'web-new-desktop',
  'web-new-mobile',
]

/**
 * Legacy platform values that get normalized on the way in: the native app
 * historically sent bare `ios`/`android`, but analytics wants them grouped
 * under the `app-` namespace alongside `app`. Accepted as input, never
 * returned from `parsePlatform`.
 */
const PLATFORM_ALIASES: Partial<
  Record<AiTutorFeedbackPlatform, AiTutorFeedbackPlatform>
> = {
  ios: 'app-ios',
  android: 'app-android',
}

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
  return PLATFORM_ALIASES[normalized] ?? normalized
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
