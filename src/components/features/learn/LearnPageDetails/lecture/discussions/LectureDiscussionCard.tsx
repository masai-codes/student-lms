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
        className="size-10 shrink-0 ring-1 ring-[#4F6BED]/20 transition-transform duration-200 hover:scale-105"
      >
        <AvatarFallback className="type-b3-md bg-gray-100 text-gray-700">
          {discussion.authorInitials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 break-words">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="type-b2-md text-gray-900">
            {discussion.authorName}
          </span>
          <span className="type-caption-regular text-gray-500" aria-hidden>
            •
          </span>
          <span className="type-caption-regular text-gray-500">
            {discussion.postedAtLabel}
          </span>
        </div>
        <div className="mt-1">
          <LectureDiscussionMarkdown content={discussion.bodyMarkdown} />
        </div>
        <button
          type="button"
          className="type-b3-md mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-gray-600 transition duration-150 hover:bg-gray-100 hover:text-[#6962AC] active:scale-95"
        >
          <ChatsCircle className="size-4" aria-hidden />
          {discussion.replyCount}{' '}
          {discussion.replyCount === 1 ? 'reply' : 'replies'}
        </button>
      </div>
    </article>
  )
}
