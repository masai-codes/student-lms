/**
 * Follow-up tags shown after a rating is chosen in the lecture feedback form.
 * Ratings 1–4 surface the "what went wrong" set; a 5 surfaces the "what went
 * right" set — the two never mix, so switching rating resets any selection.
 */
const LECTURE_FEEDBACK_LOW_RATING_TAGS = [
  'Too fast',
  'Too slow',
  'Hard to follow',
  'Not engaging',
  'Audio issues',
] as const

const LECTURE_FEEDBACK_HIGH_RATING_TAGS = [
  'Clear & concise',
  'Great examples',
  'Easy to follow',
  'Well structured',
  'Very engaging',
] as const

export const LECTURE_FEEDBACK_TAGS = [
  ...LECTURE_FEEDBACK_LOW_RATING_TAGS,
  ...LECTURE_FEEDBACK_HIGH_RATING_TAGS,
] as const

export type LectureFeedbackTag = (typeof LECTURE_FEEDBACK_TAGS)[number]

export function getLectureFeedbackTagOptions(
  rating: number,
): ReadonlyArray<LectureFeedbackTag> {
  return rating >= 5
    ? LECTURE_FEEDBACK_HIGH_RATING_TAGS
    : LECTURE_FEEDBACK_LOW_RATING_TAGS
}
