import { initialsFromName } from './initialsFromName'

import type { LectureDiscussionView } from '../types/lectureDiscussionView'

import type { DiscussionListItem } from '@/server/learn/types'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'

export function mapDiscussionToLectureView(
  discussion: DiscussionListItem,
  now: Date = new Date(),
): LectureDiscussionView {
  const authorName = discussion.author?.name?.trim() || 'Student'

  return {
    id: discussion.id,
    title: discussion.title,
    bodyMarkdown: discussion.messagePreview,
    authorName,
    authorInitials: initialsFromName(authorName),
    postedAtLabel: formatSocialPostTime(discussion.createdAt, now),
    replyCount: discussion.threadCount,
  }
}
