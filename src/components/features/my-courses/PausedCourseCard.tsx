import { Link } from '@tanstack/react-router'
import { ArrowRight, PauseCircle } from '@phosphor-icons/react'
import type { PausedCourseListItem } from '@/server/api/courses/getMyCourses.service'
import { formatRestrictionDate } from '@/utils/formatRestrictionDate'
import { CourseLogo } from './CourseLogo'
import { myCoursesEntityEvent, pushMyCoursesEvent } from './myCoursesAnalytics'

interface Props {
  course: PausedCourseListItem
}

function CardBody({ course }: { course: PausedCourseListItem }) {
  const pausedOn = formatRestrictionDate(course.pausedOn)

  return (
    <>
      <CourseLogo
        src={course.courseLogo}
        title={course.courseTitle}
        testId={`my-courses-paused-card-logo-${course.batchId}`}
      />

      <div className="mt-2 md:mt-3 min-w-0">
        <h3
          data-testid={`my-courses-paused-card-title-${course.batchId}`}
          className="text-base md:text-lg font-semibold leading-6 md:leading-7 text-foreground break-words"
        >
          {course.courseTitle}
        </h3>
        <p className="mt-1.5 text-sm font-medium leading-5 text-foreground-muted break-words">
          <span className="text-xs font-normal">by </span>
          {course.instituteName}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          data-testid={`my-courses-paused-card-badge-${course.batchId}`}
          className="inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2.5 py-1 text-xs font-medium leading-4 text-warning-subtle-foreground"
        >
          <PauseCircle size={14} weight="fill" />
          Paused
        </span>
        {pausedOn && (
          <span
            data-testid={`my-courses-paused-card-date-${course.batchId}`}
            className="text-xs leading-4 text-foreground-subtle"
          >
            since {pausedOn}
          </span>
        )}
      </div>
    </>
  )
}

/**
 * `h-full` keeps paused cards the same height as their rowmates — see
 * {@link ./MyCourseCard}.
 */
const CARD_CLASSES =
  'flex h-full flex-col rounded-2xl border border-border bg-surface p-4 animate-dash-row-in'

/**
 * One paused program on the "My Programs" listing.
 *
 * A pause is not a cancellation: content scheduled before the pause date stays
 * available, so the card still opens the program (when it has a detail page at
 * all). What it drops is the progress bar — the calendar-elapsed percentage keeps
 * climbing while the student is paused, which would read as progress they aren't
 * making. The pause date is the meaningful number here instead.
 */
export function PausedCourseCard({ course }: Props) {
  if (!course.showBatchDetails) {
    return (
      <div
        data-testid={`my-courses-paused-card-${course.batchId}`}
        className={CARD_CLASSES}
      >
        <CardBody course={course} />
      </div>
    )
  }

  function handleClick() {
    pushMyCoursesEvent(
      myCoursesEntityEvent('paused_card_click', course.batchId),
      {
        batchId: course.batchId,
        courseTitle: course.courseTitle,
        instituteName: course.instituteName,
        pausedOn: course.pausedOn,
      },
    )
  }

  return (
    <Link
      to="/course/$batchId"
      params={{ batchId: String(course.batchId) }}
      onClick={handleClick}
      data-testid={`my-courses-paused-card-${course.batchId}`}
      className={`group dash-lift ${CARD_CLASSES} transition-colors duration-200 hover:border-[#4F6BED]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
    >
      <CardBody course={course} />

      {/* `mt-auto` pins the CTA to the bottom edge on cards taller than their content. */}
      <div className="mt-auto pt-5 flex justify-end">
        {/* Nested inside the card link: a visual affordance, not a second anchor. */}
        <span
          data-testid={`my-courses-paused-card-details-cta-${course.batchId}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2.5 text-sm font-medium text-brand-foreground transition-transform duration-150 ease-out group-hover:-translate-y-px group-active:scale-95"
        >
          Program Details
          <ArrowRight
            size={16}
            weight="bold"
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  )
}
