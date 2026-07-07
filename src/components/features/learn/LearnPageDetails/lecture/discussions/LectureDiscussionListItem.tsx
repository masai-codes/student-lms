'use client'

import * as React from 'react'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'

import { getDiscussionRepliesToggleLabel } from './discussionRepliesToggleLabel'
import { LectureDiscussionReplyForm } from './LectureDiscussionReplyForm'
import { LectureDiscussionReplyItem } from './LectureDiscussionReplyItem'

import type { DiscussionListItem } from '@/server/learn/types'
import { DiscussionSummaryCard } from '@/components/features/new-discussions/DiscussionSummaryCard'
import { addLearnDiscussionReplyViaApi } from '@/lib/api/learn/discussionsApi'
import { plainTextFromHtml } from '@/lib/plainTextFromHtml'
import { cn } from '@/lib/utils'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'

type LectureDiscussionListItemProps = {
  discussion: DiscussionListItem
}

export function LectureDiscussionListItem({ discussion }: LectureDiscussionListItemProps) {
  const router = useRouter()

  const [expanded, setExpanded] = React.useState(false)
  const [replyPending, setReplyPending] = React.useState(false)
  const [replyError, setReplyError] = React.useState<string | null>(null)

  const toggleReplies = () => {
    pushLearnEvent('l_learn_discussion_replies_toggle_id_' + discussion.id, {
      discussion_id: discussion.id,
    })
    setExpanded(current => {
      const next = !current
      if (!next) {
        setReplyError(null)
      }
      return next
    })
  }

  const handleReplySubmit = async (messageHtml: string) => {
    const plain = plainTextFromHtml(messageHtml)
    if (!plain.trim() || replyPending || discussion.isClosed) return

    pushLearnEvent('l_learn_discussion_reply_id_' + discussion.id, {
      discussion_id: discussion.id,
    })
    setReplyError(null)
    setReplyPending(true)
    try {
      await addLearnDiscussionReplyViaApi({
        discussionId: discussion.id,
        message: messageHtml,
      })
      await router.invalidate()
    } catch {
      setReplyError('Could not post your reply. Try again.')
    } finally {
      setReplyPending(false)
    }
  }

  const replyCount = discussion.threads.length || discussion.threadCount
  const toggleLabel = getDiscussionRepliesToggleLabel(expanded, replyCount)

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="p-3">
        <DiscussionSummaryCard discussion={discussion} embedded />
        <button
          type="button"
          onClick={toggleReplies}
          aria-expanded={expanded}
          className="type-b3-md mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[#6962AC] hover:bg-purple-50"
        >
          {expanded ? (
            <CaretUp className="size-4" aria-hidden />
          ) : (
            <CaretDown className="size-4" aria-hidden />
          )}
          {toggleLabel}
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-gray-100 px-3 pb-3 pt-2">
          {discussion.threads.length === 0 ? (
            <p className="type-b3-regular py-3 text-gray-500">
              No replies yet. Be the first to respond.
            </p>
          ) : (
            <div className={cn(discussion.isClosed ? 'pb-0' : 'pb-3')}>
              {discussion.threads.map(thread => (
                <LectureDiscussionReplyItem key={thread.id} thread={thread} />
              ))}
            </div>
          )}

          {discussion.isClosed ? (
            <p className="type-caption-regular text-gray-500">
              This discussion is closed. New replies are not allowed.
            </p>
          ) : (
            <>
              <LectureDiscussionReplyForm
                disabled={replyPending}
                onSubmit={handleReplySubmit}
              />
              {replyError ? (
                <p className="type-caption-regular mt-2 text-destructive" role="alert">
                  {replyError}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
