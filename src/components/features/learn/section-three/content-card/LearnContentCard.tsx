import { Link } from '@tanstack/react-router'
import type { LearnContentItem, LearnContentType } from '../../shared/types'
import { Badge } from '@/components/ui/badge'
import { MasaiChips } from '@/components/ui/masai-chips'

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

const dummyAttendanceClassName: Record<'Present' | 'Absent', string> = {
  Present: 'bg-emerald-100 text-emerald-700',
  Absent: 'bg-rose-100 text-rose-700',
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
  const dummyAttendance: 'Present' | 'Absent' =
    item.title.length % 2 === 0 ? 'Present' : 'Absent'

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
          <div className="">
            <LearnTypeIcon type={item.type} />
          </div>
          <div className="">
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

        <Badge className={dummyAttendanceClassName[dummyAttendance]}>
          {dummyAttendance}
        </Badge>
      </div>
    </Link>
  )
}
