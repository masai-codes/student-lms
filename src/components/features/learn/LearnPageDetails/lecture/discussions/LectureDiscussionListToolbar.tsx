'use client'

import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useId } from 'react'

import type { CreateLearnDiscussionKind } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import { MasaiInput } from '@/components/ui/masai-input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'

type LectureDiscussionListToolbarProps = {
  entityId: number
  entityKind: CreateLearnDiscussionKind
  search: string
  onSearchChange: (value: string) => void
  mineOnly: boolean
  onToggleMineOnly: () => void
  className?: string
}

export function LectureDiscussionListToolbar({
  entityId,
  entityKind,
  search,
  onSearchChange,
  mineOnly,
  onToggleMineOnly,
  className,
}: LectureDiscussionListToolbarProps) {
  // Fire the search analytics event debounced (committed intent), never
  // per-keystroke — the filtering itself runs synchronously on every change.
  useEffect(() => {
    const query = search.trim()
    if (query === '') return

    const timer = setTimeout(() => {
      pushLearnEvent('l_learn_discussion_search', {
        entity_id: entityId,
        entity_kind: entityKind,
        query_length: query.length,
      })
    }, 600)

    return () => clearTimeout(timer)
  }, [search, entityId, entityKind])

  const toggleId = useId()

  const handleToggleMine = () => {
    pushLearnEvent('l_learn_discussion_mine_toggle', {
      entity_id: entityId,
      entity_kind: entityKind,
      enabled: !mineOnly,
    })
    onToggleMineOnly()
  }

  return (
    <div
      data-testid="discussion-toolbar"
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      <MasaiInput
        data-testid="discussion-search-input"
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search discussions"
        aria-label="Search discussions"
        className="min-w-[140px] flex-1"
        iconLeft={<MagnifyingGlass className="size-[18px]" aria-hidden />}
      />
      <div className="flex shrink-0 items-center gap-2">
        <Switch
          id={toggleId}
          data-testid="discussion-mine-toggle"
          checked={mineOnly}
          onCheckedChange={handleToggleMine}
        />
        <label
          htmlFor={toggleId}
          className="type-b3-md cursor-pointer whitespace-nowrap text-foreground"
        >
          My Discussions
        </label>
      </div>
    </div>
  )
}
