'use client'

import { useMemo, useState } from 'react'

import type { DiscussionListItem } from '@/server/learn/types'
import { LEARN_DISCUSSION_PAGE_SIZE } from '../lectureDiscussion.constants'
import {
  filterDiscussions,
  paginate,
  totalPageCount,
} from '../utils/filterAndPaginateDiscussions'

type UseLearnDiscussionListControlsParams = {
  discussions: Array<DiscussionListItem>
  currentUserId: number | null
  pageSize?: number
}

export type LearnDiscussionListControls = {
  search: string
  mineOnly: boolean
  page: number
  totalPages: number
  totalCount: number
  filteredCount: number
  pageSize: number
  pageItems: Array<DiscussionListItem>
  hasActiveFilters: boolean
  changeSearch: (value: string) => void
  toggleMineOnly: () => void
  goToPage: (page: number) => void
}

/**
 * Client-side search / "my discussions" filter / pagination over the discussion
 * list already embedded in the detail payload. Page resets to 1 whenever a
 * filter changes, and the current page is clamped when the underlying list
 * shrinks (e.g. after `router.invalidate()`).
 */
export function useLearnDiscussionListControls({
  discussions,
  currentUserId,
  pageSize = LEARN_DISCUSSION_PAGE_SIZE,
}: UseLearnDiscussionListControlsParams): LearnDiscussionListControls {
  const [search, setSearch] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () => filterDiscussions(discussions, { search, mineOnly, currentUserId }),
    [discussions, search, mineOnly, currentUserId],
  )

  const totalPages = totalPageCount(filtered.length, pageSize)
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(
    () => paginate(filtered, safePage, pageSize),
    [filtered, safePage, pageSize],
  )

  const changeSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const toggleMineOnly = () => {
    setMineOnly((current) => !current)
    setPage(1)
  }

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), totalPages))
  }

  return {
    search,
    mineOnly,
    page: safePage,
    totalPages,
    totalCount: discussions.length,
    filteredCount: filtered.length,
    pageSize,
    pageItems,
    hasActiveFilters: mineOnly || search.trim() !== '',
    changeSearch,
    toggleMineOnly,
    goToPage,
  }
}
