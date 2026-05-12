'use client'

import { Plus, UsersThree } from '@phosphor-icons/react'
import { useRouteContext } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import type { DiscussionListItem } from '@/server/learn/types'
import type { CreateLearnDiscussionKind } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import { DiscussionCreateModal } from '@/components/features/new-discussions/DiscussionCreateModal'
import { DiscussionSummaryCard } from '@/components/features/new-discussions/DiscussionSummaryCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type EntityDiscussionsPanelProps = {
  entityKind: CreateLearnDiscussionKind
  entityId: number
  discussions: Array<DiscussionListItem>
  emptyStateContext?: 'lecture' | 'assignment' | 'resource'
}

function nounForContext(c: 'lecture' | 'assignment' | 'resource'): string {
  if (c === 'assignment') return 'assignment'
  if (c === 'resource') return 'resource'
  return 'lecture'
}

export function EntityDiscussionsPanel({
  entityKind,
  entityId,
  discussions,
  emptyStateContext: emptyStateContextProp,
}: EntityDiscussionsPanelProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [myDiscussionsOnly, setMyDiscussionsOnly] = useState(false)

  const { user } = useRouteContext({ from: '/(protected)/_layout' })

  const emptyStateContext =
    emptyStateContextProp ??
    (entityKind === 'assignment' ? 'assignment' : 'lecture')

  const visibleDiscussions = useMemo(() => {
    if (!myDiscussionsOnly) return discussions
    return discussions.filter(d => d.author?.id === user.id)
  }, [discussions, myDiscussionsOnly, user.id])

  const noun = nounForContext(emptyStateContext)

  return (
    <div className="relative flex min-h-[320px] flex-1 flex-col gap-3">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold leading-7 text-gray-900">Discussions</h2>
        <button
          type="button"
          onClick={() => setMyDiscussionsOnly(v => !v)}
          className={cn(
            'self-start rounded-[32px] border px-4 py-2 text-xs font-semibold leading-6 transition-colors',
            myDiscussionsOnly
              ? 'border-[#6962AC] text-[#6962AC]'
              : 'border-gray-900 text-gray-500'
          )}
        >
          My Discussions
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-24">
        {visibleDiscussions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <UsersThree className="h-20 w-20 text-gray-400" weight="bold" aria-hidden />
            <h3 className="text-lg font-bold text-gray-900">No Discussions Yet</h3>
            <p className="max-w-[250px] text-sm leading-6 text-gray-500">
              Be the first to start a discussion about this {noun}.
            </p>
          </div>
        ) : (
          visibleDiscussions.map(d => <DiscussionSummaryCard key={d.id} discussion={d} />)
        )}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-center pb-2 pt-4">
        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="pointer-events-auto rounded-full bg-[#6962AC] px-6 py-2.5 font-medium text-white shadow-md hover:bg-[#585196]"
        >
          <Plus className="mr-1.5 h-5 w-5" weight="bold" aria-hidden />
          Create
        </Button>
      </div>

      <DiscussionCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        kind={entityKind}
        entityId={entityId}
      />
    </div>
  )
}
