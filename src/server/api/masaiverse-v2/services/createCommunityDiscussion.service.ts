import { db } from '@/db'
import { posts } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { toMysqlUtc } from '@/lib/dateRanges'
import { serializeContentWithTags } from '@/lib/discussionTags'
import { htmlPlainText } from '@/lib/html'

const TITLE_MAX = 255
const CONTENT_MAX = 5000

export interface CreateDiscussionInput {
  title: string
  content: string
  tags: Array<string>
}

/**
 * Creates a community discussion post owned by `userId` and tied to no club
 * (`club_id` stays NULL). Content is the rich-text HTML from the editor.
 *
 * Requires `posts.club_id` to be nullable in the database.
 */
export async function createCommunityDiscussion(
  userId: number,
  input: CreateDiscussionInput,
): Promise<{ id: string }> {
  const title = input.title.trim()
  const content = input.content.trim()

  if (!title) {
    throw new ApiError(400, 'DISCUSSION_TITLE_REQUIRED')
  }
  if (title.length > TITLE_MAX) {
    throw new ApiError(400, 'DISCUSSION_TITLE_TOO_LONG')
  }
  if (!htmlPlainText(content)) {
    throw new ApiError(400, 'DISCUSSION_CONTENT_REQUIRED')
  }
  if (content.length > CONTENT_MAX) {
    throw new ApiError(400, 'DISCUSSION_CONTENT_TOO_LONG')
  }

  // Tags ride along at the end of the content behind a marker.
  const storedContent = serializeContentWithTags(content, input.tags)
  const nowUtc = toMysqlUtc(new Date())
  const [header] = await db.insert(posts).values({
    clubId: null,
    userId,
    title,
    content: storedContent,
    createdAt: nowUtc,
    updatedAt: nowUtc,
  })

  return { id: String(header.insertId) }
}
