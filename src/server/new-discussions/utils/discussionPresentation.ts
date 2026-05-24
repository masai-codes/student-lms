import type { DiscussionListItem } from '@/server/learn/types'
import { plainTextFromHtml } from '@/lib/plainTextFromHtml'

export function tinyintToBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export function truncateDiscussionPreview(message: string, maxLen: number): string {
  const trimmed = message.trim()
  if (trimmed.length <= maxLen) return trimmed
  return `${trimmed.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`
}

export type DiscussionRowWithAuthor = {
  id: number
  title: string
  message: string
  isClosed: number | boolean | null
  public: number | boolean | null
  createdAt: string | null
  updatedAt: string | null
  authorId: number
  authorName: string | null
}

export function toDiscussionListItem(
  row: DiscussionRowWithAuthor,
  threadCount: number,
  threads: DiscussionListItem['threads'] = [],
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
    threads,
    author: {
      id: row.authorId,
      name: row.authorName != null && row.authorName.trim() !== '' ? row.authorName.trim() : null,
    },
  }
}
