'use client'

import { CaretDown } from '@phosphor-icons/react'
import { useState } from 'react'

import { LectureDiscussionCreateForm } from './LectureDiscussionCreateForm'
import type { CreateLearnDiscussionKind } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import { cn } from '@/lib/utils'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'

type LectureDiscussionCreatePanelProps = {
  entityId: number
  entityKind: CreateLearnDiscussionKind
  pending: boolean
  error: string | null
  onSubmit: (payload: { title: string; descriptionMarkdown: string }) => void
  /** When true the form sits behind a collapsed "Create discussion" accordion. */
  useAccordion?: boolean
  className?: string
}

export function LectureDiscussionCreatePanel({
  entityId,
  entityKind,
  pending,
  error,
  onSubmit,
  useAccordion = false,
  className,
}: LectureDiscussionCreatePanelProps) {
  const [expanded, setExpanded] = useState(false)

  const errorNode = error ? (
    <p className="type-b3-regular mt-3 text-destructive" role="alert">
      {error}
    </p>
  ) : null

  if (!useAccordion) {
    return (
      <div
        className={cn('shrink-0', className)}
        data-testid="discussion-create-panel"
      >
        <LectureDiscussionCreateForm disabled={pending} onSubmit={onSubmit} />
        {errorNode}
      </div>
    )
  }

  return (
    <div
      data-testid="discussion-create-panel"
      className={cn(
        'shrink-0 rounded-lg border border-gray-200 bg-white transition-colors duration-200 hover:border-[#4F6BED]/35',
        className,
      )}
    >
      <button
        type="button"
        data-testid="discussion-create-toggle"
        onClick={() => {
          pushLearnEvent('l_learn_discussion_create_form_toggle', {
            entity_id: entityId,
            entity_kind: entityKind,
          })
          setExpanded((current) => !current)
        }}
        aria-expanded={expanded}
        className="type-b3-md flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-gray-900 transition-colors duration-150 hover:bg-gray-50"
      >
        Create discussion
        <CaretDown
          className={cn(
            'size-4 shrink-0 text-gray-600 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {expanded ? (
        <div className="border-t border-gray-100 px-3 pb-3 pt-2">
          <LectureDiscussionCreateForm disabled={pending} onSubmit={onSubmit} />
          {errorNode}
        </div>
      ) : null}
    </div>
  )
}
