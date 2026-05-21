'use client'

import { useRouteContext, useRouter } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { LectureDiscussionCard } from './LectureDiscussionCard'
import { LectureDiscussionComposer } from './LectureDiscussionComposer'
import { deriveDiscussionTitleFromMessage } from './utils/deriveDiscussionTitleFromMessage'
import { mapDiscussionToLectureView } from './utils/mapDiscussionToLectureView'

import type { DiscussionListItem } from '@/server/learn/types'
import { createLearnDiscussion } from '@/server/new-discussions/createLearnDiscussion'
import { cn } from '@/lib/utils'

type LectureDiscussionsSectionProps = {
  entityId: number
  discussions: Array<DiscussionListItem>
  className?: string
}

export function LectureDiscussionsSection({
  entityId,
  discussions,
  className,
}: LectureDiscussionsSectionProps) {
  const router = useRouter()
  const { user } = useRouteContext({ from: '/(protected)/_layout' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const commentViews = useMemo(
    () => discussions.map(d => mapDiscussionToLectureView(d)),
    [discussions],
  )

  const handlePost = async (payload: { descriptionMarkdown: string }) => {
    const title = deriveDiscussionTitleFromMessage(payload.descriptionMarkdown)
    if (!title) {
      setError('Write a comment before posting.')
      return
    }

    setError(null)
    setPending(true)
    try {
      await createLearnDiscussion({
        data: {
          kind: 'lecture',
          entityId,
          title,
          message: payload.descriptionMarkdown,
        },
      })
      await router.invalidate()
    } catch {
      setError('Could not post your comment. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      className={cn(
        'border-t border-border bg-background px-4 py-6 md:px-6',
        className,
      )}
    >
      <h2 className="type-h6 mb-4 text-gray-900">
        {commentViews.length}{' '}
        {commentViews.length === 1 ? 'Comment' : 'Comments'}
      </h2>

      <LectureDiscussionComposer
        className="mb-6"
        userName={user.name.trim() || 'You'}
        userAvatarUrl={user.profileImageUrl}
        disabled={pending}
        onSubmit={handlePost}
      />

      {error ? (
        <p className="type-b3-regular mb-4 text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {commentViews.length === 0 ? (
        <p className="type-b2-regular py-6 text-center text-gray-500">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {commentViews.map(discussion => (
            <LectureDiscussionCard key={discussion.id} discussion={discussion} />
          ))}
        </div>
      )}
    </section>
  )
}
