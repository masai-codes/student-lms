'use client'

import { CheckCircle, Star } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { LectureDiscussionFeedbackForm } from './LectureDiscussionFeedbackForm'
import type { DiscussionListItem } from '@/server/learn/types'
import {
  setLearnDiscussionClosedViaApi,
  submitLearnDiscussionFeedbackViaApi,
} from '@/lib/api/learn/discussionsApi'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'

type LectureDiscussionOwnerActionsProps = {
  discussion: DiscussionListItem
}

export function LectureDiscussionOwnerActions({
  discussion,
}: LectureDiscussionOwnerActionsProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingFeedback, setEditingFeedback] = useState(false)

  const runMutation = async (mutation: () => Promise<unknown>): Promise<boolean> => {
    setError(null)
    setPending(true)
    try {
      await mutation()
      await router.invalidate()
      return true
    } catch {
      setError('Something went wrong. Try again.')
      return false
    } finally {
      setPending(false)
    }
  }

  const handleToggleClosed = () => {
    const nextClosed = !discussion.isClosed
    pushLearnEvent('l_learn_discussion_close_toggle_id_' + discussion.id, {
      discussion_id: discussion.id,
      is_closed: nextClosed,
    })
    void runMutation(() =>
      setLearnDiscussionClosedViaApi({
        discussionId: discussion.id,
        isClosed: nextClosed,
      }),
    )
  }

  const handleFeedback = (rating: number, comment: string) => {
    pushLearnEvent('l_learn_discussion_feedback_id_' + discussion.id, {
      discussion_id: discussion.id,
      rating,
    })
    void runMutation(() =>
      submitLearnDiscussionFeedbackViaApi({
        discussionId: discussion.id,
        rating,
        comment: comment || undefined,
      }),
    ).then((ok) => {
      if (ok) setEditingFeedback(false)
    })
  }

  const alreadyRated = discussion.feedbackRating != null
  const showFeedbackForm = !alreadyRated || editingFeedback

  return (
    <div
      data-testid="discussion-owner-actions"
      className="mt-2 space-y-2 border-t border-gray-100 pt-2"
    >
      <button
        type="button"
        data-testid="discussion-close-toggle"
        disabled={pending}
        onClick={handleToggleClosed}
        className="type-b3-md inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[#6962AC] hover:bg-purple-50 disabled:opacity-50"
      >
        <CheckCircle
          className="size-4"
          weight={discussion.isClosed ? 'fill' : 'regular'}
          aria-hidden
        />
        {discussion.isClosed ? 'Reopen discussion' : 'Mark as resolved'}
      </button>

      {discussion.isClosed ? (
        showFeedbackForm ? (
          <LectureDiscussionFeedbackForm
            disabled={pending}
            onSubmit={handleFeedback}
            initialRating={discussion.feedbackRating ?? 0}
            submitLabel={alreadyRated ? 'Update feedback' : 'Submit feedback'}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p
              data-testid="discussion-feedback-summary"
              className="type-caption-regular inline-flex items-center gap-1 text-gray-600"
            >
              <Star className="size-4 text-amber-500" weight="fill" aria-hidden />
              You rated this {discussion.feedbackRating}/5
            </p>
            <button
              type="button"
              data-testid="discussion-feedback-edit"
              onClick={() => setEditingFeedback(true)}
              className="type-caption-md text-[#6962AC] hover:underline"
            >
              Edit feedback
            </button>
          </div>
        )
      ) : null}

      {error ? (
        <p className="type-caption-regular text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
