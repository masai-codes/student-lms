'use client'

import { CaretDown, CaretUp, UsersThree } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { LectureDiscussionCreateForm } from './LectureDiscussionCreateForm'
import { learnDiscussionsEmptyStateNoun } from './discussionsEmptyStateCopy'
import { LectureDiscussionListItem } from './LectureDiscussionListItem'
import type { LearnDiscussionsEmptyStateContext } from './discussionsEmptyStateCopy'

import type { DiscussionListItem } from '@/server/learn/types'
import type { CreateLearnDiscussionKind } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import { createLearnDiscussionViaApi } from '@/lib/api/learn/discussionsApi'
import { cn } from '@/lib/utils'

type LectureDiscussionsSectionProps = {
  entityId: number
  entityKind: CreateLearnDiscussionKind
  discussions: Array<DiscussionListItem>
  emptyStateContext?: LearnDiscussionsEmptyStateContext
  layout?: 'footer' | 'aside'
  /** When true, title/description create form is behind a collapsed "Create discussion" accordion. */
  useCreateFormAccordion?: boolean
  className?: string
}

export function LectureDiscussionsSection({
  entityId,
  entityKind,
  discussions,
  emptyStateContext = 'lecture',
  layout = 'footer',
  useCreateFormAccordion = false,
  className,
}: LectureDiscussionsSectionProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createFormExpanded, setCreateFormExpanded] = useState(false)

  const emptyStateNoun = learnDiscussionsEmptyStateNoun(emptyStateContext)
  const isAside = layout === 'aside'

  const handlePost = async (payload: {
    title: string
    descriptionMarkdown: string
  }) => {
    setError(null)
    setPending(true)
    try {
      await createLearnDiscussionViaApi({
        kind: entityKind,
        entityId,
        title: payload.title,
        message: payload.descriptionMarkdown,
      })
      await router.invalidate()
    } catch {
      setError('Could not post your discussion. Try again.')
    } finally {
      setPending(false)
    }
  }

  const listContent =
    discussions.length === 0 ? (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <UsersThree
          className="h-16 w-16 text-gray-400"
          weight="bold"
          aria-hidden
        />
        <h3 className="type-b2-md text-gray-900">No discussions yet</h3>
        <p className="type-b3-regular max-w-sm text-gray-500">
          Be the first to start a discussion about this {emptyStateNoun}.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        <p className="type-b3-regular text-gray-600">
          Check what your peers are discussing
        </p>
        {discussions.map((discussion) => (
          <LectureDiscussionListItem
            key={discussion.id}
            discussion={discussion}
          />
        ))}
      </div>
    )

  return (
    <section
      className={cn(
        isAside
          ? 'flex min-h-0 flex-1 flex-col'
          : 'border-t border-border bg-background py-6',
        className,
      )}
    >
      <h2 className="type-h4 mb-2 text-gray-900">Discussions</h2>
      <p className="type-b3-regular mb-4 text-gray-500">
        Share course-related discussions with your peers.
      </p>

      {useCreateFormAccordion ? (
        <div className="mb-4 shrink-0 rounded-lg border border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setCreateFormExpanded((current) => !current)}
            aria-expanded={createFormExpanded}
            className="type-b3-md flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-gray-900 hover:bg-gray-50"
          >
            Create discussion
            {createFormExpanded ? (
              <CaretUp className="size-4 shrink-0 text-gray-600" aria-hidden />
            ) : (
              <CaretDown
                className="size-4 shrink-0 text-gray-600"
                aria-hidden
              />
            )}
          </button>
          {createFormExpanded ? (
            <div className="border-t border-gray-100 px-3 pb-3 pt-2">
              <LectureDiscussionCreateForm
                disabled={pending}
                onSubmit={handlePost}
              />
              {error ? (
                <p
                  className="type-b3-regular mt-3 text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className={cn('shrink-0', isAside ? 'mb-4' : 'mb-6')}>
          <LectureDiscussionCreateForm
            disabled={pending}
            onSubmit={handlePost}
          />
          {error ? (
            <p className="type-b3-regular mt-3 text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}

      <div className={cn(isAside && 'min-h-0 flex-1 overflow-y-auto')}>
        {listContent}
      </div>
    </section>
  )
}
