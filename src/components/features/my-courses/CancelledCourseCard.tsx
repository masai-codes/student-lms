import type { CancelledCourseListItem } from '@/server/api/courses/getMyCourses.service'
import { formatRestrictionDate } from '@/utils/formatRestrictionDate'
import { CourseLogo } from './CourseLogo'

interface Props {
  course: CancelledCourseListItem
}

/**
 * A program the student's enrolment in has been cancelled. Read-only by design —
 * the content is gone, so there is nothing to link to.
 */
export function CancelledCourseCard({ course }: Props) {
  const cancelledOn = formatRestrictionDate(course.cancelledOn)

  return (
    <div
      data-testid={`my-courses-cancelled-card-${course.batchId}`}
      className="flex flex-col rounded-2xl border border-border bg-surface-muted p-4 animate-dash-row-in"
    >
      <CourseLogo
        src={course.courseLogo}
        title={course.courseTitle}
        muted
        testId={`my-courses-cancelled-card-logo-${course.batchId}`}
      />

      <div className="mt-2 md:mt-3 min-w-0">
        <h3
          data-testid={`my-courses-cancelled-card-title-${course.batchId}`}
          className="text-base md:text-lg font-semibold leading-6 md:leading-7 text-foreground-muted break-words"
        >
          {course.courseTitle}
        </h3>
        <p className="mt-1.5 text-sm font-medium leading-5 text-foreground-subtle break-words">
          <span className="text-xs font-normal">by </span>
          {course.instituteName}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-danger-subtle px-2.5 py-1 text-xs font-medium leading-4 text-danger-subtle-foreground">
          Enrolment cancelled
        </span>
        {cancelledOn && (
          <span
            data-testid={`my-courses-cancelled-card-date-${course.batchId}`}
            className="text-xs leading-4 text-foreground-subtle"
          >
            on {cancelledOn}
          </span>
        )}
      </div>
    </div>
  )
}
