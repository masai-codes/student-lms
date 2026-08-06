import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useEffect } from 'react'
import type {
  LearnScheduleHorizon,
  LearnTab,
} from '@/components/features/learn/shared/types'
import type { LearningType } from '@/server/learn/types'
import {
  learnScheduleHorizonToDays,
  parseLearnScheduleHorizon,
} from '@/components/features/learn/shared/types'
import { LearnLayout } from '@/components/features/learn'
import { LearnPageSkeleton } from '@/components/features/learn/LearnPageSkeleton'
import {
  getLastSelectedBatchIdForUser,
  setLastSelectedBatchIdForUser,
} from '@/lib/learnBatchSelection'
import { setLastSelectedSectionIdForUser } from '@/lib/learnSectionSelection'
import {
  learnModalFiltersFromSearch,
  modalFiltersToApiFilters,
  parseLearnPageSearch,
} from '@/lib/learn/learnPageSearch'
import { fetchLearnPageDataFromApi } from '@/lib/api/learn/learnApi'

const layoutRouteApi = getRouteApi('/(protected)/_layout')

const LEARN_TABS = new Set<LearnTab>(['lectures', 'assignments', 'resources'])

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

function toLearningType(tab: LearnTab): LearningType {
  if (tab === 'assignments') return 'assignment'
  if (tab === 'resources') return 'resource'
  return 'lecture'
}

export type LearnRouteSearch = {
  batchId?: number
  sectionId?: number
  horizon?: LearnScheduleHorizon
  tab?: LearnTab
  page?: number
  search?: string
  module?: string
  category?: string
  type?: string
  instructor?: string
  startDate?: string
  endDate?: string
  optional?: string
  lectureTab?: string
  attendanceStatus?: string
  assignmentTab?: string
}

export const Route = createFileRoute('/(protected)/_layout/learn/')({
  validateSearch: (search: Record<string, unknown>): LearnRouteSearch => {
    const parsed = parseLearnPageSearch(search)
    const tab =
      typeof search.tab === 'string' && LEARN_TABS.has(search.tab as LearnTab)
        ? (search.tab as LearnTab)
        : parsed.tab

    const result: LearnRouteSearch = { batchId: parsed.batchId }
    if (parsed.sectionId) result.sectionId = parsed.sectionId
    if (parsed.horizon) result.horizon = parsed.horizon
    if (tab) result.tab = tab
    if (parsed.page) result.page = parsed.page
    if (parsed.search) result.search = parsed.search

    const module = optionalString(search.module)
    if (module) result.module = module
    const category = optionalString(search.category)
    if (category) result.category = category
    const type = optionalString(search.type)
    if (type) result.type = type
    const instructor = optionalString(search.instructor)
    if (instructor) result.instructor = instructor
    const startDate = optionalString(search.startDate)
    if (startDate) result.startDate = startDate
    const endDate = optionalString(search.endDate)
    if (endDate) result.endDate = endDate
    const optional = optionalString(search.optional)
    if (optional) result.optional = optional
    const lectureTab = optionalString(search.lectureTab)
    if (lectureTab) result.lectureTab = lectureTab
    const attendanceStatus = optionalString(search.attendanceStatus)
    if (attendanceStatus) result.attendanceStatus = attendanceStatus
    const assignmentTab = optionalString(search.assignmentTab)
    if (assignmentTab) result.assignmentTab = assignmentTab

    return result
  },
  // The loader seeds the page once (initial paint / deep links). In-page filter,
  // search and pagination changes are served by React Query in LearnLayout, so they
  // never re-run this loader, never block the route, and never replace the live
  // header/search with a full-page spinner — only the list shows a skeleton.
  loaderDeps: () => ({}),
  loader: async ({ location }) => {
    const search = location.search as LearnRouteSearch
    const tab: LearnTab = search.tab ?? 'lectures'
    const modalFilters = learnModalFiltersFromSearch(search, tab)
    const apiFilters = modalFiltersToApiFilters(tab, modalFilters)
    const hasFilters = Object.values(apiFilters).some(
      (value) => value != null && (!Array.isArray(value) || value.length > 0),
    )

    return fetchLearnPageDataFromApi({
      batchId: search.batchId,
      learningType: toLearningType(tab),
      search: search.search?.trim() || undefined,
      page: search.page ?? 1,
      filters: hasFilters ? apiFilters : undefined,
      sectionId: search.sectionId,
      scheduleHorizonDays: learnScheduleHorizonToDays(
        parseLearnScheduleHorizon(search.horizon),
      ),
    })
  },
  pendingComponent: () => <LearnPageSkeleton />,
  component: LearnPage,
})

function LearnPage() {
  const navigate = Route.useNavigate()
  const pageData = Route.useLoaderData()
  const { user } = layoutRouteApi.useRouteContext()
  const {
    batchId,
    tab = 'lectures',
    lectureTab,
    assignmentTab,
    page = 1,
  } = Route.useSearch()
  const enrolledBatches = pageData.batches

  useEffect(() => {
    const needsLectureTab =
      (tab === 'lectures' || tab === 'resources') && lectureTab == null
    const needsAssignmentTab = tab === 'assignments' && assignmentTab == null
    if (!needsLectureTab && !needsAssignmentTab) {
      return
    }

    navigate({
      search: (prev) => ({
        ...prev,
        lectureTab: needsLectureTab ? 'all' : prev.lectureTab,
        assignmentTab: needsAssignmentTab ? 'all' : prev.assignmentTab,
        page,
      }),
      replace: true,
    })
  }, [assignmentTab, lectureTab, navigate, page, tab])

  useEffect(() => {
    if (batchId != null || enrolledBatches.length === 0) {
      return
    }

    // No usable stored choice → default to the most recent enrolment. `enrolledBatches`
    // is ordered oldest-enrolment-first, so that's the last entry.
    const storedBatchId = Number(getLastSelectedBatchIdForUser(user.id))
    const restoredBatchId =
      Number.isFinite(storedBatchId) &&
      storedBatchId > 0 &&
      enrolledBatches.some((batch) => batch.batchId === storedBatchId)
        ? storedBatchId
        : enrolledBatches[enrolledBatches.length - 1].batchId

    navigate({
      search: (prev) => ({
        ...prev,
        batchId: restoredBatchId,
        tab: prev.tab ?? 'lectures',
        page: prev.page ?? 1,
        lectureTab: prev.lectureTab ?? 'all',
      }),
      replace: true,
    })
  }, [batchId, enrolledBatches, navigate, user.id])

  useEffect(() => {
    if (batchId == null) {
      return
    }

    const isEnrolled = enrolledBatches.some(
      (batch) => batch.batchId === batchId,
    )
    if (!isEnrolled) {
      return
    }

    setLastSelectedBatchIdForUser(user.id, batchId)
  }, [batchId, enrolledBatches, user.id])

  return (
    <LearnLayout
      pageData={pageData}
      userId={user.id}
      onBatchChange={(nextBatchId) => {
        setLastSelectedBatchIdForUser(user.id, nextBatchId)
        navigate({
          search: (prev) => ({
            ...prev,
            batchId: nextBatchId,
            // Section belongs to a batch — drop it so the new batch restores its own
            // stored section (LearnLayout) or defaults to "Any".
            sectionId: undefined,
            page: 1,
          }),
          replace: true,
        })
      }}
      onSectionChange={(nextSectionId) => {
        if (batchId != null) {
          setLastSelectedSectionIdForUser(user.id, batchId, nextSectionId)
        }
        navigate({
          search: (prev) => ({
            ...prev,
            sectionId: nextSectionId ?? undefined,
            page: 1,
          }),
          replace: true,
        })
      }}
    />
  )
}
