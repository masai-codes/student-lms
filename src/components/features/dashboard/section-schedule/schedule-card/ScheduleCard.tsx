import { Link } from '@tanstack/react-router'
import { formatTimeRange } from '../../shared/scheduleUtils'
import type { DashboardScheduleItem } from '../../shared/types'
import { MasaiChips } from '@/components/ui/masai-chips'

const TYPE_ICON_SRC: Record<DashboardScheduleItem['learningType'], string> = {
  lecture: 'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/lecture.svg',
  assignment: 'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/assignment.svg',
  resource: 'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/resource.svg',
}

const TYPE_ICON_ALT: Record<DashboardScheduleItem['learningType'], string> = {
  lecture: 'Lecture',
  assignment: 'Assignment',
  resource: 'Resource',
}

const tagChipPalette = {
  backgroundClassName: 'bg-gray-50',
  textClassName: '!text-gray-500',
}

function buildLinkProps(item: DashboardScheduleItem) {
  const id = String(item.id)
  if (item.learningType === 'lecture') {
    return { to: '/lectures/$lectureId', params: { lectureId: id } } as const
  }
  if (item.learningType === 'assignment') {
    return { to: '/assignments/$assignmentId', params: { assignmentId: id } } as const
  }
  return { to: '/resources/$resourceId', params: { resourceId: id } } as const
}

interface ScheduleCardProps {
  item: DashboardScheduleItem
  dayLabel: string | null
  isToday: boolean
}

export function ScheduleCard({ item, dayLabel, isToday }: ScheduleCardProps) {
  const timeRange = formatTimeRange(item.schedule, item.concludes)
  const linkProps = buildLinkProps(item)
  const meta = [timeRange, item.batchName].filter(Boolean).join(' • ')

  return (
    <div className="flex items-stretch gap-3">
      <div className="w-[52px] shrink-0 flex flex-col items-center pt-3">
        {dayLabel ? (
          <div
            className={`flex flex-col items-center justify-center rounded-[8px] px-1 py-1.5 min-w-[44px] ${
              isToday ? 'bg-[#3F83F8]' : ''
            }`}
          >
            <span className={`type-t2 font-semibold leading-none ${isToday ? 'text-white' : 'text-[#1F2A37]'}`}>
              {dayLabel.split(' ')[0]}
            </span>
            <span className={`type-b1-md font-bold leading-none mt-0.5 ${isToday ? 'text-white' : 'text-[#1F2A37]'}`}>
              {dayLabel.split(' ')[1]}
            </span>
          </div>
        ) : null}
      </div>

      <Link
        {...linkProps}
        className="flex-1 min-w-0 bg-white rounded-[8px] border border-gray-200 p-3 block transition-colors hover:bg-gray-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start gap-3">
          <img
            src={TYPE_ICON_SRC[item.learningType]}
            alt={TYPE_ICON_ALT[item.learningType]}
            width={40}
            height={40}
            className="size-10 shrink-0 object-contain"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0 flex flex-col gap-1.5 flex-1">
            {/* Line 1: title */}
            <p className="type-b1-md truncate">{item.title}</p>
            {/* Line 2: time/batch + chips all inline */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
              {meta ? (
                <p className="type-t1 text-gray-500 shrink-0">{meta}</p>
              ) : null}
              {item.subType ? (
                <MasaiChips
                  type="default"
                  size="regular"
                  label={item.subType}
                  tabIndex={-1}
                  className="cursor-default border border-grey-200"
                  {...tagChipPalette}
                />
              ) : null}
              {item.moduleName ? (
                <MasaiChips
                  type="default"
                  size="regular"
                  label={item.moduleName}
                  tabIndex={-1}
                  className="cursor-default border border-grey-200"
                  {...tagChipPalette}
                />
              ) : null}
              <MasaiChips
                type="default"
                size="regular"
                label={item.optional === 1 ? 'Recommended' : 'Mandatory'}
                tabIndex={-1}
                className="cursor-default border border-grey-200"
                {...tagChipPalette}
              />
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
