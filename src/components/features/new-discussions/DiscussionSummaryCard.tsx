'use client'

import { ChatsCircle } from '@phosphor-icons/react'

import type { DiscussionListItem } from '@/server/learn/types'

export type DiscussionSummaryCardProps = {
  discussion: DiscussionListItem
}

export function DiscussionSummaryCard({ discussion }: DiscussionSummaryCardProps) {
  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
      aria-labelledby={`discussion-title-${discussion.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          id={`discussion-title-${discussion.id}`}
          className="type-b2-regular line-clamp-2 font-semibold text-gray-900"
        >
          {discussion.title}
        </h3>
        {discussion.isClosed ? (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            Closed
          </span>
        ) : null}
      </div>
      <p className="type-caption-regular mt-1 line-clamp-3 text-muted-foreground">{discussion.messagePreview}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        <span className="truncate">{discussion.author?.name ?? 'Student'}</span>
        <span className="inline-flex items-center gap-1">
          <ChatsCircle className="h-3.5 w-3.5" aria-hidden />
          {discussion.threadCount} {discussion.threadCount === 1 ? 'reply' : 'replies'}
        </span>
      </div>
    </article>
  )
}
