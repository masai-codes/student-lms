import { useQuery } from '@tanstack/react-query'
import { fetchMyCourses } from '@/lib/api/courses/coursesApi'
import { MyCourseCard } from './MyCourseCard'
import { CancelledCoursesSection } from './CancelledCoursesSection'
import {
  MyCoursesEmptyState,
  MyCoursesErrorState,
  MyCoursesSkeleton,
} from './MyCoursesStates'

const STALE_TIME_MS = 5 * 60 * 1000

/**
 * "My Programs" — every batch the student is enrolled in, plus a record of any
 * cancelled enrolments. Horizontal gutters come from the shared `<main>`
 * (`layout-page`); this page must not add its own.
 */
export function MyCoursesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-courses'],
    queryFn: fetchMyCourses,
    staleTime: STALE_TIME_MS,
  })

  const active = data?.active ?? []
  const cancelled = data?.cancelled ?? []
  const isEmpty = !isLoading && !isError && active.length === 0 && cancelled.length === 0

  return (
    <div
      data-testid="my-courses-page"
      className="mx-auto flex w-full max-w-[1280px] flex-col py-4 md:py-6"
    >
      <h1
        data-testid="my-courses-heading"
        className="mb-5 text-base md:text-xl font-bold text-foreground animate-dash-rise"
      >
        My Programs
      </h1>

      {isLoading && <MyCoursesSkeleton />}
      {isError && <MyCoursesErrorState />}
      {isEmpty && <MyCoursesEmptyState />}

      {active.length > 0 && (
        <ul
          data-testid="my-courses-grid"
          className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 md:gap-6"
        >
          {active.map((course) => (
            <li key={course.batchId} className="min-w-0">
              <MyCourseCard course={course} />
            </li>
          ))}
        </ul>
      )}

      <CancelledCoursesSection courses={cancelled} />
    </div>
  )
}
