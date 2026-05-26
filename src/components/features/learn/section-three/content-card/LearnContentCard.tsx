import { Link } from '@tanstack/react-router'
import type { LearnContentItem, LearnContentType } from '../../shared/types'
import { LectureAttendanceInline } from '@/components/features/learn/attendance/LectureAttendanceInline'
import { getAssignmentStatusChipStyles } from '@/components/features/learn/LearnPageDetails/assignment/shared/getAssignmentStatusChipStyles'
import { LearnListingJoinLiveCta } from '@/components/features/learn/section-three/content-card/LearnListingJoinLiveCta'
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

export function LearnContentCard({ item }: { item: LearnContentItem }) {
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
        : ({ to: '/resources/$resourceId', params: { resourceId: id } } as const)

  return (
    <Link
      {...linkProps}
      className="bg-white rounded-[8px] border border-gray-200 p-3 block transition-colors hover:bg-gray-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <LearnTypeIcon type={item.type} />
          <div>
            <p className="type-b1-md">{item.title}</p>
            <p className="mt-[4px] type-t1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="min-w-0">{item.hostName}</span>
              <span
                className="size-1 shrink-0 rounded-full bg-gray-600"
                aria-hidden
              />
              <span>{item.date ?? 'No schedule'}</span>
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
          {item.type === 'lecture' && attendancePresentation ? (
            <LectureAttendanceInline {...attendancePresentation} />
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
            <LearnListingJoinLiveCta joinLive={item.listingCtas.joinLive} />
          ) : null}
        </div>
      </div>
    </Link>
  )
}
