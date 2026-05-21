'use client'

import * as React from 'react'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'

import { LectureDiscussionReplyForm } from './LectureDiscussionReplyForm'
import { LectureDiscussionReplyItem } from './LectureDiscussionReplyItem'

import type { DiscussionListItem } from '@/server/learn/types'
import { DiscussionSummaryCard } from '@/components/features/new-discussions/DiscussionSummaryCard'
import { addLearnDiscussionReply } from '@/server/new-discussions/addLearnDiscussionReply'
import { getLearnDiscussionById } from '@/server/new-discussions/getLearnDiscussionById'
import type { LearnDiscussionDetail } from '@/server/new-discussions/types/learnDiscussionDetail'
import { plainTextFromHtml } from '@/lib/plainTextFromHtml'
import { cn } from '@/lib/utils'

type LectureDiscussionListItemProps = {
  discussion: DiscussionListItem
}

export function LectureDiscussionListItem({ discussion }: LectureDiscussionListItemProps) {
  const router = useRouter()

  const [expanded, setExpanded] = React.useState(false)
  const [detail, setDetail] = React.useState<LearnDiscussionDetail | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [replyPending, setReplyPending] = React.useState(false)
  const [replyError, setReplyError] = React.useState<string | null>(null)

  const loadDetail = React.useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const next = await getLearnDiscussionById({
        data: { discussionId: discussion.id },
      })
      setDetail(next)
    } catch {
      setLoadError('Could not load replies. Try again.')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [discussion.id])

  React.useEffect(() => {
    if (!expanded) return
    void loadDetail()
  }, [expanded, loadDetail])

  const toggleReplies = () => {
    setExpanded(current => {
      const next = !current
      if (!next) {
        setReplyError(null)
        setLoadError(null)
      }
      return next
    })
  }

  const handleReplySubmit = async (messageHtml: string) => {
    const plain = plainTextFromHtml(messageHtml)
    if (!plain.trim() || replyPending || detail?.isClosed) return

    setReplyError(null)
    setReplyPending(true)
    try {
      await addLearnDiscussionReply({
        data: { discussionId: discussion.id, message: messageHtml },
      })
      await loadDetail()
      await router.invalidate()
    } catch {
      setReplyError('Could not post your reply. Try again.')
    } finally {
      setReplyPending(false)
    }
  }

  const replyCount = detail?.threads.length ?? discussion.threadCount
  const replyLabel =
    replyCount === 1 ? '1 reply' : `${replyCount} replies`
  const toggleLabel = expanded ? 'Hide replies' : `View ${replyLabel}`

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
          {loading ? (
            <p className="type-b3-regular py-3 text-gray-500">Loading replies…</p>
          ) : null}

          {loadError ? (
            <p className="type-b3-regular py-3 text-destructive" role="alert">
              {loadError}
            </p>
          ) : null}

          {!loading && !loadError && detail ? (
            <>
              {detail.threads.length === 0 ? (
                <p className="type-b3-regular py-3 text-gray-500">
                  No replies yet. Be the first to respond.
                </p>
              ) : (
                <div className={cn(detail.isClosed ? 'pb-0' : 'pb-3')}>
                  {detail.threads.map(thread => (
                    <LectureDiscussionReplyItem key={thread.id} thread={thread} />
                  ))}
                </div>
              )}

              {detail.isClosed ? (
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
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
