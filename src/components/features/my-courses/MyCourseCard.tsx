import { Link } from '@tanstack/react-router'
import { ArrowRight } from '@phosphor-icons/react'
import type { MyCourseListItem } from '@/server/api/courses/getMyCourses.service'
import { CourseLogo } from './CourseLogo'
import { myCoursesEntityEvent, pushMyCoursesEvent } from './myCoursesAnalytics'

interface Props {
  course: MyCourseListItem
}

function CardBody({ course }: { course: MyCourseListItem }) {
  return (
    <>
      <CourseLogo
        src={course.courseLogo}
        title={course.courseTitle}
        testId={`my-courses-card-logo-${course.batchId}`}
      />

      <div className="mt-2 md:mt-3 min-w-0">
        <h3
          data-testid={`my-courses-card-title-${course.batchId}`}
          className="text-base md:text-lg font-semibold leading-6 md:leading-7 text-foreground break-words"
        >
          {course.courseTitle}
        </h3>
        <p className="mt-1.5 text-sm font-medium leading-5 text-foreground-muted break-words">
          <span className="text-xs font-normal">by </span>
          {course.instituteName}
        </p>
      </div>
    </>
  )
}

function CourseProgress({ course }: { course: MyCourseListItem }) {
  return (
    <div className="mt-4">
      <div
        role="progressbar"
        aria-valuenow={course.courseProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${course.courseTitle} program progress`}
        data-testid={`my-courses-card-progress-${course.batchId}`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-success-subtle"
      >
        {/* Vivid green fill — matches CourseHeroCard and reads on both themes' track. */}
        <div
          className="h-full rounded-full bg-[#31C48D] transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${course.courseProgress}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium leading-4 text-foreground-muted">
          Program Progress
        </span>
        <span className="text-xs font-medium leading-4 text-foreground">
          {course.courseProgress}%
        </span>
      </div>
    </div>
  )
}

/**
 * `h-full` + the grid's `auto-rows-fr` keep every card the same height regardless
 * of title wrapping or a missing progress bar / CTA — the content stays
 * top-aligned and the card grows into the row instead of shrink-wrapping.
 */
const CARD_CLASSES =
  'flex h-full flex-col rounded-2xl border border-border bg-surface p-4 animate-dash-row-in'

/**
 * One program on the "My Programs" listing.
 *
 * Programs without `showBatchDetails` have no detail page to open, so — matching
 * the legacy LMS — the card is a plain, non-interactive block: no progress bar,
 * no CTA, no hover affordance advertising a click that would go nowhere. The
 * listing sorts these cards last so a dead end never sits above a program the
 * student can open.
 */
export function MyCourseCard({ course }: Props) {
  if (!course.showBatchDetails) {
    return (
      <div
        data-testid={`my-courses-card-${course.batchId}`}
        className={CARD_CLASSES}
      >
        <CardBody course={course} />
      </div>
    )
  }

  function handleClick(action: string) {
    pushMyCoursesEvent(myCoursesEntityEvent(action, course.batchId), {
      batchId: course.batchId,
      courseTitle: course.courseTitle,
      instituteName: course.instituteName,
      courseProgress: course.courseProgress,
    })
  }

  return (
    <Link
      to="/course/$batchId"
      params={{ batchId: String(course.batchId) }}
      onClick={() => handleClick('card_click')}
      data-testid={`my-courses-card-${course.batchId}`}
      className={`group dash-lift ${CARD_CLASSES} transition-colors duration-200 hover:border-[#4F6BED]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
    >
      <CardBody course={course} />
      <CourseProgress course={course} />

      {/* `mt-auto` pins the CTA to the bottom edge on cards taller than their content. */}
      <div className="mt-auto pt-5 flex justify-end">
        {/* Nested inside the card link: a visual affordance, not a second anchor. */}
        <span
          data-testid={`my-courses-card-details-cta-${course.batchId}`}
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
