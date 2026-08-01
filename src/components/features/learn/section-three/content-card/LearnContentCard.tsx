import { Link } from '@tanstack/react-router'
import type { LearnContentItem, LearnContentType } from '../../shared/types'
import { learnEntityEvent, pushLearnEvent } from '../../shared/learnAnalytics'
import { LectureAttendanceInline } from '@/components/features/learn/attendance/LectureAttendanceInline'
import { LectureOptionalAttendanceInfo } from '@/components/features/learn/attendance/LectureOptionalAttendanceInfo'
import { getAssignmentStatusChipStyles } from '@/components/features/learn/LearnPageDetails/assignment/shared/getAssignmentStatusChipStyles'
import { LearnListingJoinLiveCta } from '@/components/features/learn/section-three/content-card/LearnListingJoinLiveCta'
import { LocalTimeWithIstTooltip } from '@/components/shared/local-time-with-ist-tooltip'
import { MasaiChips } from '@/components/ui/masai-chips'
import {
  getLearnListingAttendancePresentation,
  shouldShowAssignmentStatusChip,
} from '@/lib/learn/listingCardPresentation'
import { cn } from '@/lib/utils'
import { BookIcon, CirclePlayIcon, NotepadTextIcon } from 'lucide-react'
import { CommonIcon } from '@/components/common/Icon'

const learnContentTagChipPalette = {
  backgroundClassName: 'bg-surface-muted',
  textClassName: '!text-foreground-muted',
}

// Evaluation tags get a distinct yellow treatment so graded evaluations stand
// out from ordinary type/category/module tags.
const learnContentEvaluationTagChipPalette = {
  backgroundClassName:
    'bg-yellow-50 border border-yellow-100 dark:bg-warning-subtle dark:border-warning-subtle',
  textClassName: '!text-yellow-600 dark:!text-warning-subtle-foreground',
}

function resolveTagChipPalette(tag: string) {
  return tag.trim().toLowerCase() === 'evaluation'
    ? learnContentEvaluationTagChipPalette
    : learnContentTagChipPalette
}

/**
 * `assignments.settings.weightagePercentage`, shown alongside the tags in the
 * same blue treatment as the assignment detail header badge.
 */
function LearnAssignmentWeightageChip({
  weightage,
}: {
  weightage: number | null | undefined
}) {
  if (weightage == null) {
    return null
  }

  return (
    <MasaiChips
      data-testid="learn-assignment-weightage"
      type="default"
      size="regular"
      label={`${weightage}% Weightage`}
      tabIndex={-1}
      className="pointer-events-none"
      backgroundClassName="bg-blue-50 border border-blue-100 dark:bg-info-subtle dark:border-info-subtle"
      textClassName="!text-blue-600 dark:!text-info-subtle-foreground"
    />
  )
}

function LearnTypeIcon({ type }: Pick<LearnContentItem, 'type'>) {
  const color =
    type === 'lecture'
      ? '#3F83F8'
      : type === 'assignment'
        ? '#16BDCA'
        : '#FF8A4C'
  return (
    <CommonIcon className="size-6 md:size-8" style={{ color }} name={type} />
  )
}

export function LearnContentCard({
  item,
  fromDashboard = false,
  isAssociatedCard = false,
}: {
  item: LearnContentItem
  /** Compact dashboard layout: meta + tags on one row (shorter card). */
  fromDashboard?: boolean
  /** Rendered in an associated-content surface; only tags the analytics source. */
  isAssociatedCard?: boolean
}) {
  const attendancePresentation = getLearnListingAttendancePresentation(
    item.listingCtas,
    item.attendance,
  )
  const assignmentStatusStyles =
    item.type === 'assignment' &&
    shouldShowAssignmentStatusChip(item.assignmentStatusChip) &&
    item.assignmentStatusChip !== 'practice-mode'
      ? getAssignmentStatusChipStyles(item.assignmentStatusChip)
      : null

  const id = String(item.id)
  const linkProps =
    item.type === 'lecture'
      ? ({
          to: '/learn/lectures/$lectureId',
          params: { lectureId: id },
        } as const)
      : item.type === 'assignment'
        ? ({
            to: '/learn/assignments/$assignmentId',
            params: { assignmentId: id },
          } as const)
        : ({
            to: '/learn/resources/$resourceId',
            params: { resourceId: id },
          } as const)

  return (
    <Link
      {...linkProps}
      onClick={() =>
        pushLearnEvent(learnEntityEvent(item.type, 'card_click', item.id), {
          content_id: item.id,
          content_type: item.type,
          title: item.title,
          category: item.category,
          priority: item.priority,
          source: isAssociatedCard
            ? 'associated'
            : fromDashboard
              ? 'dashboard'
              : 'learn_listing',
        })
      }
      className="group rounded-lg border border-border p-3 block transition-colors duration-200 hover:border-brand/35 hover:bg-surface-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn(
          'flex flex-col gap-3',
          // Associated cards render inside a narrow drawer, so they stay in the
          // mobile stacked layout at every viewport instead of the desktop row
          // split (which squeezes host/tags into cramped, per-word-wrapping
          // columns).
          !isAssociatedCard && 'md:flex-row md:items-start md:justify-between',
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <LearnTypeIcon type={item.type} />
          <div className="min-w-0 flex-1">
            <p
              title={item.title}
              className={
                fromDashboard
                  ? 'line-clamp-2 break-words text-sm leading-snug text-foreground transition-colors duration-200 group-hover:text-brand md:text-lg font-semibold'
                  : 'type-b1-md break-words transition-colors duration-200 group-hover:text-brand'
              }
            >
              {item.title}
            </p>
            {fromDashboard ? (
              // Keep time+course and tags on separate rows so the compact card
              // doesn't force each tag onto its own line on narrow mobile
              // widths; they sit side-by-side from `md` up.
              <div
                data-testid="learn-card-dashboard-meta"
                className="mt-[4px] flex flex-col gap-2 md:flex-row md:items-center"
              >
                <div className="type-t1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <LocalTimeWithIstTooltip
                    local={item.date}
                    ist={item.dateTooltip}
                  />
                  {item.courseName ? (
                    <>
                      <span
                        className="size-1 shrink-0 rounded-full bg-foreground-muted"
                        aria-hidden
                      />
                      <span className="max-w-[10ch] truncate md:max-w-[15ch]">
                        {item.courseName}
                      </span>
                    </>
                  ) : null}
                </div>
                {item.tags.length > 0 || item.assignmentWeightage != null ? (
                  <div
                    data-testid="learn-card-dashboard-tags"
                    className="flex flex-wrap items-center gap-2"
                  >
                    {item.tags.map((tag, index) => (
                      <MasaiChips
                        key={`${tag}-${index}`}
                        type="default"
                        size="regular"
                        label={tag}
                        tabIndex={-1}
                        className="cursor-default transition-colors duration-200"
                        {...resolveTagChipPalette(tag)}
                      />
                    ))}
                    {item.type === 'assignment' ? (
                      <LearnAssignmentWeightageChip
                        weightage={item.assignmentWeightage}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                {/* Keep host+time and tags stacked on mobile, but sit them
                    side-by-side from `md` up so the card is 2 rows on desktop
                    instead of 3. */}
                <div
                  className={cn(
                    'mt-[4px] flex flex-col gap-2',
                    !isAssociatedCard && 'md:flex-row md:items-center',
                  )}
                >
                  <p className="type-t1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0">{item.hostName}</span>
                    <span
                      className="size-1 shrink-0 rounded-full bg-foreground-muted"
                      aria-hidden
                    />
                    <LocalTimeWithIstTooltip
                      local={item.date}
                      ist={item.dateTooltip}
                    />
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.tags.map((tag, index) => (
                      <MasaiChips
                        key={`${tag}-${index}`}
                        type="default"
                        size="regular"
                        label={tag}
                        tabIndex={-1}
                        className="cursor-default transition-colors duration-200"
                        {...resolveTagChipPalette(tag)}
                      />
                    ))}
                    <MasaiChips
                      type="default"
                      size="regular"
                      label={item.priority}
                      tabIndex={-1}
                      className="cursor-default"
                      {...learnContentTagChipPalette}
                    />
                    {item.type === 'assignment' ? (
                      <LearnAssignmentWeightageChip
                        weightage={item.assignmentWeightage}
                      />
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className="flex shrink-0 flex-wrap items-center justify-end gap-2"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onKeyDown={(event) => {
            event.stopPropagation()
          }}
        >
          {item.type === 'lecture' && item.priority === 'recommended' ? (
            <div className="flex items-center gap-4">
              <MasaiChips
                label="Optional session"
                size="regular"
                backgroundClassName="bg-yellow-50 border border-yellow-100 dark:bg-warning-subtle dark:border-warning-subtle"
                textClassName="!text-yellow-600 dark:!text-warning-subtle-foreground"
                className="pointer-events-none"
                tabIndex={-1}
              />
              {item.optionalAttendance ? (
                <LectureOptionalAttendanceInfo
                  attendance={item.optionalAttendance}
                  isLiveLecture={
                    item.learningSubType === 'live' ||
                    item.learningSubType === 'scrum'
                  }
                />
              ) : null}
            </div>
          ) : null}
          {item.type === 'lecture' && attendancePresentation ? (
            <LectureAttendanceInline
              {...attendancePresentation}
              forceRow={isAssociatedCard}
            />
          ) : null}
          {item.type === 'assignment' && item.assignmentDeadlineLabel ? (
            <span
              data-testid="learn-assignment-deadline"
              className="type-t1 whitespace-nowrap text-foreground-muted"
            >
              {item.assignmentDeadlineLabel}
            </span>
          ) : null}
          {item.type === 'assignment' &&
          item.assignmentStatusChip === 'practice-mode' ? (
            <MasaiChips
              label="Practice Mode"
              size="regular"
              backgroundClassName="bg-teal-50 border border-teal-100 dark:bg-info-subtle dark:border-info-subtle"
              textClassName="!text-teal-600 dark:!text-info-subtle-foreground"
              className="pointer-events-none"
              tabIndex={-1}
            />
          ) : null}
          {item.type === 'assignment' &&
          typeof item.assignmentScore === 'number' ? (
            <MasaiChips
              data-testid="learn-assignment-score"
              label={`${item.assignmentScore.toFixed(2)}/10`}
              size="regular"
              backgroundClassName="bg-blue-50 border border-blue-100 dark:bg-info-subtle dark:border-info-subtle"
              textClassName="!text-blue-600 dark:!text-info-subtle-foreground"
              className="pointer-events-none"
              tabIndex={-1}
            />
          ) : null}
          {item.type === 'assignment' && assignmentStatusStyles ? (
            <MasaiChips
              label={assignmentStatusStyles.label}
              size="regular"
              backgroundClassName={assignmentStatusStyles.backgroundClassName}
              textClassName={assignmentStatusStyles.textClassName}
              className="pointer-events-none"
              tabIndex={-1}
            />
          ) : null}
          {item.type === 'lecture' ? (
            <LearnListingJoinLiveCta
              joinLive={item.listingCtas.joinLive}
              joinZoomLink={item.listingCtas.joinZoomLink}
              isNewZoomRedirection={item.listingCtas.isNewZoomRedirection}
              enableZoomWebView={item.listingCtas.enableZoomWebView}
              lectureId={item.id}
              title={item.title}
            />
          ) : null}
        </div>
      </div>
    </Link>
  )
}
