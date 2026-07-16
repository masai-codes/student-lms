import type { DiscussionListItem } from '@/server/learn/types'
import { plainTextFromHtml } from '@/lib/plainTextFromHtml'

export function tinyintToBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export function truncateDiscussionPreview(
  message: string,
  maxLen: number,
): string {
  const trimmed = message.trim()
  if (trimmed.length <= maxLen) return trimmed
  return `${trimmed.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`
}

/** Key under `discussions.data` that stores the owner's resolution feedback. */
export const DISCUSSION_FEEDBACK_DATA_KEY = 'learnFeedback'

/** Read a persisted 1–5 rating from a discussion's `data` JSON, or null. */
export function readFeedbackRating(
  data: Record<string, unknown> | null,
): number | null {
  const feedback = data?.[DISCUSSION_FEEDBACK_DATA_KEY]
  if (feedback == null || typeof feedback !== 'object') return null
  const rating = (feedback as { rating?: unknown }).rating
  return typeof rating === 'number' && Number.isFinite(rating) ? rating : null
}

export type DiscussionRowWithAuthor = {
  id: number
  title: string
  message: string
  isClosed: number | boolean | null
  public: number | boolean | null
  data: Record<string, unknown> | null
  createdAt: string | null
  updatedAt: string | null
  authorId: number
  authorName: string | null
}

export function toDiscussionListItem(
  row: DiscussionRowWithAuthor,
  threadCount: number,
  threads: DiscussionListItem['threads'] = [],
  unreadReplyCount = 0,
): DiscussionListItem {
  const previewSource = plainTextFromHtml(row.message) || row.message
  return {
    id: row.id,
    title: row.title,
    messagePreview: truncateDiscussionPreview(previewSource, 180),
    isClosed: tinyintToBool(row.isClosed),
    isPublic: tinyintToBool(row.public),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    threadCount,
    unreadReplyCount,
    feedbackRating: readFeedbackRating(row.data),
    threads,
    author: {
      id: row.authorId,
      name:
        row.authorName != null && row.authorName.trim() !== ''
          ? row.authorName.trim()
          : null,
    },
  }
}
