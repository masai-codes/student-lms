'use client'

import { UsersThree } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { LectureDiscussionCreateForm } from './LectureDiscussionCreateForm'

import type { DiscussionListItem } from '@/server/learn/types'
import { LectureDiscussionListItem } from './LectureDiscussionListItem'
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
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePost = async (payload: { title: string; descriptionMarkdown: string }) => {
    setError(null)
    setPending(true)
    try {
      await createLearnDiscussion({
        data: {
          kind: 'lecture',
          entityId,
          title: payload.title,
          message: payload.descriptionMarkdown,
        },
      })
      await router.invalidate()
    } catch {
      setError('Could not post your discussion. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className={cn('border-t border-border bg-background py-6', className)}>
      <h2 className="type-h6 mb-1 text-gray-900">Discussions</h2>
      <p className="type-b3-regular mb-4 text-gray-500">
        Share course-related discussions with your peers.
      </p>

      <LectureDiscussionCreateForm
        className="mb-6"
        disabled={pending}
        onSubmit={handlePost}
      />

      {error ? (
        <p className="type-b3-regular mb-4 text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {discussions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <UsersThree className="h-16 w-16 text-gray-400" weight="bold" aria-hidden />
          <h3 className="type-b2-md text-gray-900">No discussions yet</h3>
          <p className="type-b3-regular max-w-sm text-gray-500">
            Be the first to start a discussion about this lecture.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="type-b3-regular text-gray-600">
            Check what your peers are discussing
          </p>
          {discussions.map(discussion => (
            <LectureDiscussionListItem key={discussion.id} discussion={discussion} />
          ))}
        </div>
      )}
    </section>
  )
}
