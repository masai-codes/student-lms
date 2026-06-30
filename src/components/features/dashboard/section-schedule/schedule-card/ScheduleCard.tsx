import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { formatScheduleTime, formatScheduleTimeIST } from '../../shared/scheduleUtils'
import type { DashboardScheduleItem } from '../../shared/types'
import { MasaiChips } from '@/components/ui/masai-chips'
import { useServerTime } from '@/hooks/useServerTime'
import { parseMysqlDatetimeIST } from '@/utils/timeZoneHandler'

const TYPE_ICON_SRC: Record<DashboardScheduleItem['learningType'], string> = {
  lecture: 'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/lecture.svg',
  assignment: 'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/assignment.svg',
  resource: 'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/resource.svg',
  quiz: 'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/lecture.svg',
}

const TYPE_ICON_ALT: Record<DashboardScheduleItem['learningType'], string> = {
  lecture: 'Lecture',
  assignment: 'Assignment',
  resource: 'Resource',
  quiz: 'Quiz',
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

// ── Join Live button logic ────────────────────────────────────────────────────

type JoinState = 'soon' | 'live' | null

function computeJoinState(
  schedule: string | null,
  concludes: string | null,
  nowMs: number,
): JoinState {
  const start = parseMysqlDatetimeIST(schedule)
  if (!start) return null
  const end = parseMysqlDatetimeIST(concludes)

  const startMs = start.valueOf()
  const endMs = end?.valueOf() ?? startMs + 60 * 60 * 1000

  if (nowMs >= startMs - 10 * 60 * 1000 && nowMs < startMs - 5 * 60 * 1000) return 'soon'
  if (nowMs >= startMs - 5 * 60 * 1000 && nowMs <= endMs) return 'live'
  return null
}

/** Whether this lecture item should show the Join Live button at all. */
function shouldShowJoinButton(item: DashboardScheduleItem): boolean {
  if (item.learningType !== 'lecture') return false
  if (!item.hasZoomLink) return false
  const t = item.lectureType?.toLowerCase() ?? ''
  return t === 'live' || t === 'scrum'
}

function useJoinState(item: DashboardScheduleItem, nowMs: number): JoinState {
  const eligible = shouldShowJoinButton(item)
  const [state, setState] = useState<JoinState>(() =>
    eligible ? computeJoinState(item.schedule, item.concludes, nowMs) : null,
  )

  useEffect(() => {
    if (!eligible) return
    setState(computeJoinState(item.schedule, item.concludes, Date.now()))
    const id = setInterval(() => {
      setState(computeJoinState(item.schedule, item.concludes, Date.now()))
    }, 30_000)
    return () => clearInterval(id)
  }, [eligible, item.schedule, item.concludes])

  return eligible ? state : null
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ScheduleCardProps {
  item: DashboardScheduleItem
  dayLabel: string | null
  isToday: boolean
}

export function ScheduleCard({ item, dayLabel, isToday }: ScheduleCardProps) {
  const { now } = useServerTime()
  const timeDisplay = formatScheduleTime(item)
  const timeDisplayIST = formatScheduleTimeIST(item) // IST hardcoded — tooltip
  const linkProps = buildLinkProps(item)
  const joinState = useJoinState(item, now.valueOf())


  return (
    <div className="flex items-start gap-3">
      {/* Day label column */}
      <div className="w-8 shrink-0 flex flex-col items-center">
        {dayLabel ? (
          <div className={`flex flex-col items-center justify-center rounded-[6px] p-1 w-8 h-8 ${isToday ? 'bg-[#3F83F8]' : ''}`}>
            <span className={`text-xs font-medium leading-none ${isToday ? 'text-white' : 'text-[#374151]'}`}>
              {dayLabel.split(' ')[0]}
            </span>
            <span className={`text-xs font-semibold leading-none mt-0.5 ${isToday ? 'text-white' : 'text-[#1F2A37]'}`}>
              {dayLabel.split(' ')[1]}
            </span>
          </div>
        ) : null}
      </div>

      {/* Card */}
      <Link
        {...linkProps}
        className="flex-1 min-w-0 bg-white rounded-[8px] border border-gray-200 px-2 py-2.5 block shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2">
          <img
            src={TYPE_ICON_SRC[item.learningType]}
            alt={TYPE_ICON_ALT[item.learningType]}
            width={24}
            height={24}
            className="size-6 shrink-0 object-contain"
            loading="lazy"
            decoding="async"
          />

          <div className="min-w-0 flex flex-col gap-1.5 flex-1">
            <p className="text-[14px] font-medium text-[#1F2A37] truncate leading-5">{item.title}</p>

            {/* Mobile: time and chips in separate rows */}
            <div className="flex lg:hidden flex-col gap-1.5">
              {(timeDisplay || item.batchName) && (
                <span className="relative group/time">
                  <p className="text-xs font-medium text-gray-500 cursor-default leading-4">
                    {timeDisplay}{item.batchName ? ` • ${item.batchName}` : ''}
                  </p>
                  <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 z-20
                    opacity-0 group-hover/time:opacity-100 transition-opacity duration-150
                    whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5
                    text-xs font-medium text-white shadow-lg">
                    {timeDisplayIST}
                    <span className="absolute top-full left-4 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </span>
                </span>
              )}
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {item.subType ? (
                  <MasaiChips type="default" size="regular" label={item.subType} tabIndex={-1} className="cursor-default border border-grey-200" {...tagChipPalette} />
                ) : null}
                {item.moduleName ? (
                  <MasaiChips type="default" size="regular" label={item.moduleName} tabIndex={-1} className="cursor-default border border-grey-200" {...tagChipPalette} />
                ) : null}
                <MasaiChips type="default" size="regular" label={item.optional === 1 ? 'Recommended' : 'Mandatory'} tabIndex={-1} className="cursor-default border border-grey-200" {...tagChipPalette} />
              </div>
            </div>

            {/* Desktop: time and chips inline on the same row */}
            <div className="hidden lg:flex flex-wrap items-center gap-x-2 gap-y-1">
              {(timeDisplay || item.batchName) && (
                <span className="relative group/time">
                  <p className="text-xs font-medium text-gray-500 cursor-default leading-4">
                    {timeDisplay}{item.batchName ? ` • ${item.batchName}` : ''}
                  </p>
                  <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 z-20
                    opacity-0 group-hover/time:opacity-100 transition-opacity duration-150
                    whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5
                    text-xs font-medium text-white shadow-lg">
                    {timeDisplayIST}
                    <span className="absolute top-full left-4 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </span>
                </span>
              )}
              {item.subType ? (
                <MasaiChips type="default" size="regular" label={item.subType} tabIndex={-1} className="cursor-default border border-grey-200" {...tagChipPalette} />
              ) : null}
              {item.moduleName ? (
                <MasaiChips type="default" size="regular" label={item.moduleName} tabIndex={-1} className="cursor-default border border-grey-200" {...tagChipPalette} />
              ) : null}
              <MasaiChips type="default" size="regular" label={item.optional === 1 ? 'Recommended' : 'Mandatory'} tabIndex={-1} className="cursor-default border border-grey-200" {...tagChipPalette} />
            </div>
          </div>

          {/* Join Live / Starts Soon button */}
          {joinState === 'live' ? (
            <span className="shrink-0 inline-flex items-center px-4 py-1.5 rounded-full bg-[#6962AC] text-white text-sm font-semibold whitespace-nowrap">
              Join Live
            </span>
          ) : joinState === 'soon' ? (
            <span className="shrink-0 inline-flex items-center px-4 py-1.5 rounded-full bg-gray-200 text-gray-500 text-sm font-semibold whitespace-nowrap cursor-not-allowed">
              Starts Soon
            </span>
          ) : null}
        </div>
      </Link>
    </div>
  )
}
