import { CaretDown } from '@phosphor-icons/react'
import { useState } from 'react'
import type { CancelledCourseListItem } from '@/server/api/courses/getMyCourses.service'
import { CancelledCourseCard } from './CancelledCourseCard'
import { pushMyCoursesEvent } from './myCoursesAnalytics'

interface Props {
  courses: Array<CancelledCourseListItem>
}

/**
 * Cancelled enrolments are historical context, not something the student acts on,
 * so a long list must never bury the active programs above it — past
 * {@link COLLAPSE_THRESHOLD} entries the tail collapses behind a toggle.
 */
const COLLAPSE_THRESHOLD = 3
const COLLAPSED_COUNT = 2

export function CancelledCoursesSection({ courses }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (courses.length === 0) return null

  const collapsible = courses.length >= COLLAPSE_THRESHOLD
  const visible =
    collapsible && !expanded ? courses.slice(0, COLLAPSED_COUNT) : courses
  const hiddenCount = courses.length - visible.length

  function handleToggle() {
    const next = !expanded
    setExpanded(next)
    pushMyCoursesEvent('l_my_courses_cancelled_section_toggle', {
      expanded: next,
      cancelledCount: courses.length,
    })
  }

  return (
    <section
      data-testid="my-courses-cancelled-section"
      aria-labelledby="my-courses-cancelled-heading"
      className="mt-8 md:mt-10 animate-dash-rise"
    >
      <h2
        id="my-courses-cancelled-heading"
        className="text-base md:text-xl font-bold text-foreground"
      >
        Cancelled Enrolments
      </h2>
      <p className="mt-2 mb-5 text-sm leading-5 text-foreground-muted">
        Your enrolment in these programs has been cancelled, so the program
        content is no longer available.
      </p>

      <ul
        data-testid="my-courses-cancelled-grid"
        className="grid list-none auto-rows-fr grid-cols-1 gap-4 p-0 md:grid-cols-2 md:gap-6"
      >
        {visible.map((course) => (
          <li key={course.batchId} className="min-w-0">
            <CancelledCourseCard course={course} />
          </li>
        ))}
      </ul>

      {collapsible && (
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={expanded}
          data-testid="my-courses-cancelled-toggle"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground-muted transition-all duration-150 ease-out hover:-translate-y-px hover:border-[#4F6BED]/35 hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? 'Show less' : `Show ${hiddenCount} more`}
          <CaretDown
            size={14}
            weight="bold"
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </section>
  )
}
