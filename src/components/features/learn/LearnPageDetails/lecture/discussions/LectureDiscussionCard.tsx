'use client'

import { ChatsCircle } from '@phosphor-icons/react'

import { LectureDiscussionMarkdown } from './LectureDiscussionMarkdown'
import type { LectureDiscussionView } from './types/lectureDiscussionView'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'

type LectureDiscussionCardProps = {
  discussion: LectureDiscussionView
}

export function LectureDiscussionCard({
  discussion,
}: LectureDiscussionCardProps) {
  return (
    <article className="flex gap-3 py-4">
      <Avatar
        size="lg"
        className="size-10 shrink-0 ring-1 ring-brand/20 transition-transform duration-200 hover:scale-105"
      >
        <AvatarFallback className="type-b3-md bg-surface-muted text-foreground">
          {discussion.authorInitials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 break-words">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="type-b2-md text-foreground">
            {discussion.authorName}
          </span>
          <span
            className="type-caption-regular text-foreground-muted"
            aria-hidden
          >
            •
          </span>
          <span className="type-caption-regular text-foreground-muted">
            {discussion.postedAtLabel}
          </span>
        </div>
        <div className="mt-1">
          <LectureDiscussionMarkdown content={discussion.bodyMarkdown} />
        </div>
        <button
          type="button"
          className="type-b3-md mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-foreground-muted transition duration-150 hover:bg-surface-muted hover:text-brand active:scale-95"
        >
          <ChatsCircle className="size-4" aria-hidden />
          {discussion.replyCount}{' '}
          {discussion.replyCount === 1 ? 'reply' : 'replies'}
        </button>
      </div>
    </article>
  )
}
