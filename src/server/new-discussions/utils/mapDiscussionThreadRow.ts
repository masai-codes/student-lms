import type { LearnDiscussionThreadItem } from '@/server/new-discussions/types/learnDiscussionDetail'

function authorFromRow(
  authorId: number,
  authorName: string | null,
): LearnDiscussionThreadItem['author'] {
  return {
    id: authorId,
    name:
      authorName != null && authorName.trim() !== '' ? authorName.trim() : null,
  }
}

function profileImageUrl(path: string | null): string | null {
  if (path == null || path.trim() === '') return null
  return path.trim()
}

export type DiscussionThreadRow = {
  id: number
  message: string
  createdAt: string | null
  authorId: number
  authorName: string | null
  authorProfilePhotoPath: string | null
}

export function mapDiscussionThreadRow(
  row: DiscussionThreadRow,
): LearnDiscussionThreadItem {
  return {
    id: row.id,
    message: row.message,
    createdAt: row.createdAt,
    author: authorFromRow(row.authorId, row.authorName),
    authorProfileImageUrl: profileImageUrl(row.authorProfilePhotoPath),
  }
}
