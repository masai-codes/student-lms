'use client'

import { LectureDiscussionMarkdown } from './LectureDiscussionMarkdown'
import { discussionAvatarUrl } from './utils/discussionAvatarUrl'
import { initialsFromName } from './utils/initialsFromName'

import type { LearnDiscussionThreadItem } from '@/server/new-discussions/types/learnDiscussionDetail'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DiscussionIstTimestamp } from '@/components/features/new-discussions/DiscussionIstTimestamp'

type LectureDiscussionReplyItemProps = {
  thread: LearnDiscussionThreadItem
}

export function LectureDiscussionReplyItem({
  thread,
}: LectureDiscussionReplyItemProps) {
  const authorName = thread.author?.name?.trim() || 'Student'
  const avatarUrl = discussionAvatarUrl(
    authorName,
    thread.authorProfileImageUrl,
  )
  return (
    <article className="animate-dash-row-in flex gap-3 border-t border-border py-3 first:border-t-0 first:pt-0">
      <Avatar
        size="lg"
        className="size-9 shrink-0 ring-1 ring-brand/20 transition-transform duration-200 hover:scale-105"
      >
        <AvatarImage src={avatarUrl} alt={authorName} />
        <AvatarFallback className="type-caption-md bg-surface-muted text-foreground">
          {initialsFromName(authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 break-words">
        <span className="type-b3-md text-foreground">{authorName}</span>
        <div className="mt-1">
          <LectureDiscussionMarkdown content={thread.message} />
        </div>
        <DiscussionIstTimestamp value={thread.createdAt} className="mt-1.5" />
      </div>
    </article>
  )
}
