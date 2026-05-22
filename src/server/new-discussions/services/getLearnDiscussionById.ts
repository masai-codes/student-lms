import { and, asc, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { discussions, threads, users } from '@/db/schema'
import type {
  LearnDiscussionDetail,
  LearnDiscussionThreadItem,
} from '@/server/new-discussions/types/learnDiscussionDetail'
import { assertStudentMayInteractWithDiscussion } from '@/server/new-discussions/services/discussionAccess'
import { tinyintToBool } from '@/server/new-discussions/utils/discussionPresentation'

function authorFromRow(
  authorId: number,
  authorName: string | null,
): LearnDiscussionDetail['author'] {
  return {
    id: authorId,
    name: authorName != null && authorName.trim() !== '' ? authorName.trim() : null,
  }
}

function profileImageUrl(path: string | null): string | null {
  if (path == null || path.trim() === '') return null
  return path.trim()
}

export async function getLearnDiscussionById(
  viewerUserId: number,
  discussionId: number
): Promise<LearnDiscussionDetail> {
  await assertStudentMayInteractWithDiscussion(viewerUserId, discussionId)

  const discussionRows = await db
    .select({
      id: discussions.id,
      title: discussions.title,
      message: discussions.message,
      isClosed: discussions.isClosed,
      createdAt: discussions.createdAt,
      authorId: discussions.userId,
      authorName: users.name,
      authorProfilePhotoPath: users.profilePhotoPath,
    })
    .from(discussions)
    .leftJoin(users, eq(discussions.userId, users.id))
    .where(eq(discussions.id, discussionId))
    .limit(1)

  const discussion = discussionRows.at(0)
  if (discussion === undefined) {
    throw new Error('DISCUSSION_NOT_FOUND')
  }

  const threadRows = await db
    .select({
      id: threads.id,
      message: threads.message,
      createdAt: threads.createdAt,
      authorId: threads.userId,
      authorName: users.name,
      authorProfilePhotoPath: users.profilePhotoPath,
    })
    .from(threads)
    .leftJoin(users, eq(threads.userId, users.id))
    .where(and(eq(threads.discussionId, discussionId), isNull(threads.deletedAt)))
    .orderBy(asc(threads.createdAt))

  const mappedThreads: Array<LearnDiscussionThreadItem> = threadRows.map(row => ({
    id: row.id,
    message: row.message,
    createdAt: row.createdAt,
    author: authorFromRow(row.authorId, row.authorName),
    authorProfileImageUrl: profileImageUrl(row.authorProfilePhotoPath),
  }))

  return {
    id: discussion.id,
    title: discussion.title,
    message: discussion.message,
    isClosed: tinyintToBool(discussion.isClosed),
    createdAt: discussion.createdAt,
    author: authorFromRow(discussion.authorId, discussion.authorName),
    authorProfileImageUrl: profileImageUrl(discussion.authorProfilePhotoPath),
    threads: mappedThreads,
  }
}
