'use client'

import { ChatsCircle } from '@phosphor-icons/react'

import { DiscussionIstTimestamp } from '@/components/features/new-discussions/DiscussionIstTimestamp'
import type { DiscussionListItem } from '@/server/learn/types'

export type DiscussionSummaryCardProps = {
  discussion: DiscussionListItem
  /** No outer chrome when nested inside another discussion container. */
  embedded?: boolean
}

export function DiscussionSummaryCard({
  discussion,
  embedded = false,
}: DiscussionSummaryCardProps) {
  return (
    <article
      className={
        embedded
          ? 'bg-transparent p-0'
          : 'rounded-lg border border-border bg-surface p-3 shadow-sm transition-shadow hover:shadow-md'
      }
      aria-labelledby={`discussion-title-${discussion.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          id={`discussion-title-${discussion.id}`}
          className="type-b2-regular line-clamp-2 font-semibold text-foreground"
        >
          {discussion.title}
        </h3>
        {discussion.isClosed ? (
          <span
            data-testid="discussion-status-closed"
            className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-foreground-muted"
          >
            Closed
          </span>
        ) : (
          <span
            data-testid="discussion-status-ongoing"
            className="shrink-0 rounded-full bg-success-subtle px-2 py-0.5 text-xs text-success"
          >
            Ongoing
          </span>
        )}
      </div>
      <p className="type-caption-regular mt-1 line-clamp-3 text-muted-foreground">
        {discussion.messagePreview}
      </p>
      <DiscussionIstTimestamp value={discussion.createdAt} className="mt-2" />
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
        <span className="truncate">{discussion.author?.name ?? 'Student'}</span>
        <span className="inline-flex items-center gap-1">
          <ChatsCircle className="h-3.5 w-3.5" aria-hidden />
          {discussion.threadCount}{' '}
          {discussion.threadCount === 1 ? 'reply' : 'replies'}
        </span>
        {discussion.unreadReplyCount > 0 ? (
          <span
            data-testid="discussion-unread-badge"
            className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
          >
            {discussion.unreadReplyCount} new
          </span>
        ) : null}
      </div>
    </article>
  )
}
