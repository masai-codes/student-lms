import { Link } from '@tanstack/react-router'
import type { LearnContentItem, LearnContentType } from '../../shared/types'
import { learnEntityEvent, pushLearnEvent } from '../../shared/learnAnalytics'
import { LectureAttendanceInline } from '@/components/features/learn/attendance/LectureAttendanceInline'
import { getAssignmentStatusChipStyles } from '@/components/features/learn/LearnPageDetails/assignment/shared/getAssignmentStatusChipStyles'
import { LearnListingJoinLiveCta } from '@/components/features/learn/section-three/content-card/LearnListingJoinLiveCta'
import { LocalTimeWithIstTooltip } from '@/components/shared/local-time-with-ist-tooltip'
import { MasaiChips } from '@/components/ui/masai-chips'
import {
  getLearnListingAttendancePresentation,
  shouldShowAssignmentStatusChip,
} from '@/lib/learn/listingCardPresentation'

const LEARN_TYPE_ICON_SRC: Record<LearnContentType, string> = {
  lecture:
    'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/lecture.svg',
  assignment:
    'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/assignment.svg',
  resource:
    'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/resource.svg',
}

const LEARN_TYPE_ICON_ALT: Record<LearnContentType, string> = {
  lecture: 'Lecture',
  assignment: 'Assignment',
  resource: 'Resource',
}

const learnContentTagChipPalette = {
  backgroundClassName: 'bg-gray-50',
  textClassName: '!text-gray-500',
}

function LearnTypeIcon({ type }: Pick<LearnContentItem, 'type'>) {
  return (
    <img
      src={LEARN_TYPE_ICON_SRC[type]}
      alt={LEARN_TYPE_ICON_ALT[type]}
      width={40}
      height={40}
      className="size-10 shrink-0 object-contain"
      loading="lazy"
      decoding="async"
    />
  )
}

export function LearnContentCard({
  item,
  fromDashboard = false,
}: {
  item: LearnContentItem
  /** Compact dashboard layout: meta + tags on one row (shorter card). */
  fromDashboard?: boolean
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
      ? ({ to: '/lectures/$lectureId', params: { lectureId: id } } as const)
      : item.type === 'assignment'
        ? ({
            to: '/assignments/$assignmentId',
            params: { assignmentId: id },
          } as const)
        : ({
            to: '/resources/$resourceId',
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
          source: fromDashboard ? 'dashboard' : 'learn_listing',
        })
      }
      className="bg-white rounded-[8px] border border-gray-200 p-3 block transition-colors hover:bg-gray-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <LearnTypeIcon type={item.type} />
          <div className="min-w-0 flex-1">
            <p
              title={item.title}
              className={
                fromDashboard
                  ? 'line-clamp-2 break-words text-sm font-medium leading-snug text-gray-900 md:text-base'
                  : 'type-b1-md break-words'
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
                      <span className="size-1 shrink-0 rounded-full bg-gray-600" aria-hidden />
                      <span className="max-w-[10ch] truncate md:max-w-[15ch]">
                        {item.courseName}
                      </span>
                    </>
                  ) : null}
                </div>
                {item.tags.length > 0 ? (
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
                        className="cursor-default"
                        {...learnContentTagChipPalette}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <p className="mt-[4px] type-t1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0">{item.hostName}</span>
                  <span
                    className="size-1 shrink-0 rounded-full bg-gray-600"
                    aria-hidden
                  />
                  <LocalTimeWithIstTooltip
                    local={item.date}
                    ist={item.dateTooltip}
                  />
                </p>
                <div className="flex flex-wrap gap-2 mt-[8px]">
                  {item.tags.map((tag, index) => (
                    <MasaiChips
                      key={`${tag}-${index}`}
                      type="default"
                      size="regular"
                      label={tag}
                      tabIndex={-1}
                      className="cursor-default"
                      {...learnContentTagChipPalette}
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
            <MasaiChips
              label="Optional session"
              size="regular"
              backgroundClassName="bg-yellow-50 border border-yellow-100"
              textClassName="!text-yellow-600"
              className="pointer-events-none"
              tabIndex={-1}
            />
          ) : null}
          {item.type === 'lecture' && attendancePresentation ? (
            <LectureAttendanceInline {...attendancePresentation} />
          ) : null}
          {item.type === 'assignment' && item.assignmentDeadlineLabel ? (
            <span
              data-testid="learn-assignment-deadline"
              className="type-t1 whitespace-nowrap text-gray-500"
            >
              {item.assignmentDeadlineLabel}
            </span>
          ) : null}
          {item.type === 'assignment' &&
          item.assignmentStatusChip === 'practice-mode' ? (
            <MasaiChips
              label="Practice Mode"
              size="regular"
              backgroundClassName="bg-teal-50 border border-teal-100"
              textClassName="!text-teal-600"
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
              lectureId={item.id}
              title={item.title}
            />
          ) : null}
        </div>
      </div>
    </Link>
  )
}
