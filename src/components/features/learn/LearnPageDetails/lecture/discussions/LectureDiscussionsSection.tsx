'use client'

import { useRouteContext, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import type { CSSProperties } from 'react'

import { LectureDiscussionCreatePanel } from './LectureDiscussionCreatePanel'
import { LectureDiscussionList } from './LectureDiscussionList'
import { LectureDiscussionListToolbar } from './LectureDiscussionListToolbar'
import { LectureDiscussionPagination } from './LectureDiscussionPagination'
import { learnDiscussionsEmptyStateNoun } from './discussionsEmptyStateCopy'
import { useLearnDiscussionListControls } from './hooks/useLearnDiscussionListControls'
import type { LearnDiscussionsEmptyStateContext } from './discussionsEmptyStateCopy'

import type { DiscussionListItem } from '@/server/learn/types'
import type { CreateLearnDiscussionKind } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import { createLearnDiscussionViaApi } from '@/lib/api/learn/discussionsApi'
import { cn } from '@/lib/utils'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

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
  const { user } = useRouteContext({ from: '/(protected)/_layout' })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const controls = useLearnDiscussionListControls({
    discussions,
    currentUserId: user?.id ?? null,
  })

  const emptyStateNoun = learnDiscussionsEmptyStateNoun(emptyStateContext)
  const isAside = layout === 'aside'

  const handlePost = async (payload: {
    title: string
    descriptionMarkdown: string
  }) => {
    pushLearnEvent(
      learnEntityEvent(entityKind, 'discussion_create', entityId),
      {
        entity_id: entityId,
        entity_kind: entityKind,
      },
    )
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

  return (
    <section
      data-testid="discussions-section"
      className={cn(
        isAside
          ? 'flex min-h-0 flex-1 flex-col'
          : 'pb-10 pt-8',
        className,
      )}
    >
      <h2 className="type-h4 animate-dash-rise mb-2 text-foreground">
        Discussions
      </h2>
      <p
        className="type-b3-regular animate-dash-rise mb-4 text-foreground-muted"
        style={{ '--dash-delay': '0.05s' } as CSSProperties}
      >
        Share program-related discussions with your peers.
      </p>

      <LectureDiscussionCreatePanel
        entityId={entityId}
        entityKind={entityKind}
        pending={pending}
        error={error}
        onSubmit={handlePost}
        useAccordion={useCreateFormAccordion}
        className={cn(isAside || useCreateFormAccordion ? 'mb-4' : 'mb-6')}
      />

      {discussions.length > 0 ? (
        <LectureDiscussionListToolbar
          entityId={entityId}
          entityKind={entityKind}
          search={controls.search}
          onSearchChange={controls.changeSearch}
          mineOnly={controls.mineOnly}
          onToggleMineOnly={controls.toggleMineOnly}
          className="mb-3 shrink-0"
        />
      ) : null}

      <div className={cn(isAside && 'min-h-0 flex-1 overflow-y-auto')}>
        <LectureDiscussionList
          discussions={controls.pageItems}
          emptyStateNoun={emptyStateNoun}
          hasActiveFilters={controls.hasActiveFilters}
          currentUserId={user?.id ?? null}
        />
      </div>

      <LectureDiscussionPagination
        entityId={entityId}
        entityKind={entityKind}
        page={controls.page}
        totalPages={controls.totalPages}
        filteredCount={controls.filteredCount}
        pageSize={controls.pageSize}
        onPageChange={controls.goToPage}
      />
    </section>
  )
}
