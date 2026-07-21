import {
  feedbackHasAnyPlatformPrefix,
  feedbackHasIosOrAndroidPrefix,
} from '@/server/api/ai-tutor/feedbackPlatform'

export type MigratedFeedbackRatingResult =
  | { kind: 'unchanged'; rating: number }
  | { kind: 'updated'; rating: number; previousRating: number }
  | {
      kind: 'skipped'
      rating: number
      reason: 'MOBILE_RATING_BELOW_MIN'
    }

export function computeMigratedFeedbackRating(
  rating: number,
  feedback: string | null,
): MigratedFeedbackRatingResult {
  if (feedbackHasIosOrAndroidPrefix(feedback)) {
    const nextRating = rating - 1
    if (nextRating < 1) {
      return {
        kind: 'skipped',
        rating,
        reason: 'MOBILE_RATING_BELOW_MIN',
      }
    }
    if (nextRating === rating) {
      return { kind: 'unchanged', rating }
    }
    return { kind: 'updated', rating: nextRating, previousRating: rating }
  }

  if (
    (rating === 0 || rating === 1) &&
    !feedbackHasAnyPlatformPrefix(feedback)
  ) {
    const nextRating = rating === 0 ? 1 : 5
    return { kind: 'updated', rating: nextRating, previousRating: rating }
  }

  return { kind: 'unchanged', rating }
}
