'use client'

import { MagnifyingGlass, UsersThree } from '@phosphor-icons/react'

import { LectureDiscussionListItem } from './LectureDiscussionListItem'
import type { DiscussionListItem } from '@/server/learn/types'

type LectureDiscussionListProps = {
  discussions: Array<DiscussionListItem>
  emptyStateNoun: string
  /** True when a search/mine filter is active, so the empty copy reflects that. */
  hasActiveFilters: boolean
  currentUserId: number | null
}

export function LectureDiscussionList({
  discussions,
  emptyStateNoun,
  hasActiveFilters,
  currentUserId,
}: LectureDiscussionListProps) {
  if (discussions.length === 0) {
    if (hasActiveFilters) {
      return (
        <div
          data-testid="discussion-empty-filtered"
          className="flex flex-col items-center gap-2 py-8 text-center"
        >
          <MagnifyingGlass
            className="h-14 w-14 text-gray-400"
            weight="bold"
            aria-hidden
          />
          <h3 className="type-b2-md text-gray-900">No matching discussions</h3>
          <p className="type-b3-regular max-w-sm text-gray-500">
            Try a different search or turn off the filter.
          </p>
        </div>
      )
    }

    return (
      <div
        data-testid="discussion-empty"
        className="flex flex-col items-center gap-2 py-8 text-center"
      >
        <UsersThree className="h-16 w-16 text-gray-400" weight="bold" aria-hidden />
        <h3 className="type-b2-md text-gray-900">No discussions yet</h3>
        <p className="type-b3-regular max-w-sm text-gray-500">
          Be the first to start a discussion about this {emptyStateNoun}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="discussion-list">
      <p className="type-b3-regular text-gray-600">
        Check what your peers are discussing
      </p>
      {discussions.map((discussion) => (
        <LectureDiscussionListItem
          key={discussion.id}
          discussion={discussion}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}
