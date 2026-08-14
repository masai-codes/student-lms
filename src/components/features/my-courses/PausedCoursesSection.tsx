import type { PausedCourseListItem } from '@/server/api/courses/getMyCourses.service'
import { PausedCourseCard } from './PausedCourseCard'

interface Props {
  courses: Array<PausedCourseListItem>
}

/**
 * Paused programs, split out of the main listing so a pause is visible at a glance
 * rather than something the student discovers by finding content missing. Unlike
 * Cancelled Enrolments this section never collapses — a paused program is still
 * live and still worth opening, so it sits directly under the active programs.
 */
export function PausedCoursesSection({ courses }: Props) {
  if (courses.length === 0) return null

  return (
    <section
      data-testid="my-courses-paused-section"
      aria-labelledby="my-courses-paused-heading"
      className="mt-8 md:mt-10 animate-dash-rise"
    >
      <h2
        id="my-courses-paused-heading"
        className="text-base md:text-xl font-bold text-foreground"
      >
        Paused Programs
      </h2>
      <p className="mt-2 mb-5 text-sm leading-5 text-foreground-muted">
        These programs are paused. Content published before the pause date is
        still available.
      </p>

      <ul
        data-testid="my-courses-paused-grid"
        className="grid list-none auto-rows-fr grid-cols-1 gap-4 p-0 md:grid-cols-2 md:gap-6"
      >
        {courses.map((course) => (
          <li key={course.batchId} className="min-w-0">
            <PausedCourseCard course={course} />
          </li>
        ))}
      </ul>
    </section>
  )
}
