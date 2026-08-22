export type DiscussionFeedbackInput = {
  rating: number
  comment: string | null
}

const DISCUSSION_FEEDBACK_COMMENT_MAX = 1000

/** Validate a 1–5 integer rating with an optional trimmed comment. */
export function parseDiscussionFeedbackInput(raw: {
  rating: unknown
  comment?: unknown
}): DiscussionFeedbackInput {
  const { rating } = raw
  if (
    typeof rating !== 'number' ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error('INVALID_FEEDBACK_PAYLOAD')
  }

  let comment: string | null = null
  if (raw.comment != null) {
    if (typeof raw.comment !== 'string') {
      throw new Error('INVALID_FEEDBACK_PAYLOAD')
    }
    const trimmed = raw.comment.trim()
    if (trimmed.length > DISCUSSION_FEEDBACK_COMMENT_MAX) {
      throw new Error('INVALID_FEEDBACK_PAYLOAD')
    }
    comment = trimmed.length === 0 ? null : trimmed
  }

  return { rating, comment }
}
