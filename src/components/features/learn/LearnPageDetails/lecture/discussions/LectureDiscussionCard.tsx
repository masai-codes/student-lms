'use client'

import { ChatsCircle } from '@phosphor-icons/react'

import { LectureDiscussionMarkdown } from './LectureDiscussionMarkdown'
import type { StaticLectureDiscussion } from './constants/staticLectureDiscussions'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'

type LectureDiscussionCardProps = {
  discussion: StaticLectureDiscussion
}

export function LectureDiscussionCard({ discussion }: LectureDiscussionCardProps) {
  return (
    <article className="flex gap-3 border-b border-gray-100 py-4 last:border-b-0">
      <Avatar size="lg" className="size-10 shrink-0">
        <AvatarFallback className="type-b3-md bg-gray-100 text-gray-700">
          {discussion.authorInitials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <h3 className="type-b1-md text-gray-900">{discussion.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
          <span className="font-medium text-gray-700">{discussion.authorName}</span>
          <span aria-hidden>•</span>
          <span>{discussion.postedAtLabel}</span>
        </div>
        <div className="mt-2">
          <LectureDiscussionMarkdown content={discussion.bodyMarkdown} />
        </div>
        <button
          type="button"
          className="type-b3-md mt-2 inline-flex items-center gap-1 text-gray-600 hover:text-[#6962AC]"
        >
          <ChatsCircle className="size-4" aria-hidden />
          {discussion.replyCount} {discussion.replyCount === 1 ? 'reply' : 'replies'}
        </button>
      </div>
    </article>
  )
}
