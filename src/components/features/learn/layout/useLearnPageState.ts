import { getRouteApi } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import type {
  LearnModalFiltersState,
  LearnScheduleHorizon,
  LearnTab,
} from '../shared/types'
import { parseLearnScheduleHorizon } from '../shared/types'
import {
  buildLearnNavigateSearch,
  clearLearnFilterSearch,
  countActiveLearnFilters,
  learnModalFiltersFromSearch,
  mergeLearnSearch,
  modalFiltersToApiFilters,
  parseLearnPageSearch,
  pickLearnTabSnapshotFilters,
} from '@/lib/learn/learnPageSearch'

const learnRouteApi = getRouteApi('/(protected)/_layout/learn/')

type TabSearchSnapshot = Partial<Record<LearnTab, Record<string, unknown>>>

function ensureTabDefaults(tab: LearnTab): Record<string, unknown> {
  const next: Record<string, unknown> = { page: 1 }
  if (tab === 'assignments') {
    next.assignmentTab = 'all'
  } else {
    next.lectureTab = 'all'
  }
  return next
}

function mergeTabSearch(
  batchId: number | undefined,
  tab: LearnTab,
  filterSnapshot: Record<string, unknown>,
  page: number,
  searchText: string | undefined,
): Record<string, unknown> {
  return {
    ...filterSnapshot,
    batchId,
    tab,
    page,
    ...(searchText ? { search: searchText } : {}),
  }
}

export function useLearnPageState() {
  const search = learnRouteApi.useSearch()
  const navigate = learnRouteApi.useNavigate()
  const tabSearchSnapshots = useRef<TabSearchSnapshot>({})
  const lastBatchIdRef = useRef(search.batchId)

  const activeTab = search.tab ?? 'lectures'
  const currentPage = search.page ?? 1
  const searchValue = search.search ?? ''
  const sectionId = search.sectionId
  const horizon: LearnScheduleHorizon = parseLearnScheduleHorizon(
    search.horizon,
  )
  const modalFilters = useMemo(
    () => learnModalFiltersFromSearch(search, activeTab),
    [search, activeTab],
  )
  const filterCount = useMemo(
    () => countActiveLearnFilters(activeTab, modalFilters),
    [activeTab, modalFilters],
  )

  useEffect(() => {
    if (lastBatchIdRef.current === search.batchId) {
      return
    }
    lastBatchIdRef.current = search.batchId
    tabSearchSnapshots.current = {}
  }, [search.batchId])

  const pushSearch = useCallback(
    (nextSearch: Record<string, string | number | undefined>) => {
      navigate({
        search: (prev) =>
          mergeLearnSearch(
            prev as Record<string, unknown>,
            nextSearch,
          ) as typeof prev,
        replace: true,
      })
    },
    [navigate],
  )

  const setActiveTab = useCallback(
    (tab: LearnTab) => {
      if (tab === activeTab) return

      tabSearchSnapshots.current[activeTab] = {
        ...pickLearnTabSnapshotFilters(search as Record<string, unknown>),
        page: currentPage,
        ...(searchValue ? { search: searchValue } : {}),
      }

      const filterSnapshot =
        tabSearchSnapshots.current[tab] ?? ensureTabDefaults(tab)
      const restoredPage =
        typeof filterSnapshot.page === 'number' ? filterSnapshot.page : 1
      const restoredSearch =
        typeof filterSnapshot.search === 'string' ? filterSnapshot.search : ''

      const restored = mergeTabSearch(
        search.batchId,
        tab,
        pickLearnTabSnapshotFilters(filterSnapshot),
        restoredPage,
        restoredSearch || undefined,
      )

      const filters = learnModalFiltersFromSearch(restored, tab)
      pushSearch(
        buildLearnNavigateSearch(tab, filters, {
          page: restoredPage,
          search: restoredSearch,
        }),
      )
    },
    [activeTab, currentPage, pushSearch, search, searchValue],
  )

  const setSearchValue = useCallback(
    (value: string) => {
      pushSearch(
        buildLearnNavigateSearch(activeTab, modalFilters, {
          page: 1,
          search: value,
        }),
      )
    },
    [activeTab, modalFilters, pushSearch],
  )

  const setCurrentPage = useCallback(
    (page: number) => {
      pushSearch(
        buildLearnNavigateSearch(activeTab, modalFilters, {
          page,
          search: searchValue,
        }),
      )
    },
    [activeTab, modalFilters, pushSearch, searchValue],
  )

  // Section + horizon are top-level (not per-tab modal) params, so they navigate
  // directly and survive tab/filter changes via `mergeLearnSearch`'s base carry-over.
  const setSectionId = useCallback(
    (nextSectionId: number | null) => {
      navigate({
        search: (prev) => ({
          ...prev,
          sectionId: nextSectionId ?? undefined,
          page: 1,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  const setHorizon = useCallback(
    (nextHorizon: LearnScheduleHorizon) => {
      navigate({
        search: (prev) => ({
          ...prev,
          horizon: nextHorizon === 'today' ? undefined : nextHorizon,
          page: 1,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  const setModalFilters = useCallback(
    (next: LearnModalFiltersState) => {
      pushSearch(
        buildLearnNavigateSearch(activeTab, next, {
          page: 1,
          search: searchValue,
        }),
      )
    },
    [activeTab, pushSearch, searchValue],
  )

  const setModules = useCallback(
    (modules: Array<string>) => {
      setModalFilters({ ...modalFilters, modules })
    },
    [modalFilters, setModalFilters],
  )

  const apiFilters = useMemo(
    () => modalFiltersToApiFilters(activeTab, modalFilters),
    [activeTab, modalFilters],
  )

  return {
    activeTab,
    currentPage,
    searchValue,
    modalFilters,
    filterCount,
    apiFilters,
    batchId: search.batchId,
    sectionId,
    horizon,
    setActiveTab,
    setSearchValue,
    setCurrentPage,
    setSectionId,
    setHorizon,
    setModalFilters,
    setModules,
    clearAllFilters: () => {
      pushSearch(
        clearLearnFilterSearch(activeTab, {
          search: searchValue,
        }),
      )
    },
  }
}

function parseLearnRouteSearch(search: Record<string, unknown>) {
  return parseLearnPageSearch(search)
}
