import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { formatScheduleTime } from '../../shared/scheduleUtils'
import type { DashboardScheduleItem } from '../../shared/types'
import { MasaiChips } from '@/components/ui/masai-chips'

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

/**
 * Parse a naive datetime string (no timezone) as IST (UTC+5:30).
 * DB times are stored in IST without a timezone specifier.
 */
function parseIST(raw: string | null): Date | null {
  if (!raw) return null
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  // Append +05:30 only if no tz info present
  const withTz = /[Z+]/.test(normalized) ? normalized : `${normalized}+05:30`
  const d = new Date(withTz)
  return Number.isNaN(d.getTime()) ? null : d
}

function computeJoinState(schedule: string | null, concludes: string | null): JoinState {
  const start = parseIST(schedule)
  if (!start) return null
  const end = parseIST(concludes)

  const now = Date.now()
  const startMs = start.getTime()
  const endMs = end?.getTime() ?? startMs + 60 * 60 * 1000 // fallback: 1 h window

  if (now >= startMs - 10 * 60 * 1000 && now < startMs - 5 * 60 * 1000) return 'soon'
  if (now >= startMs - 5 * 60 * 1000 && now <= endMs) return 'live'
  return null
}

/** Whether this lecture item should show the Join Live button at all. */
function shouldShowJoinButton(item: DashboardScheduleItem): boolean {
  if (item.learningType !== 'lecture') return false
  if (!item.hasZoomLink) return false
  const t = item.lectureType?.toLowerCase() ?? ''
  return t === 'live' || t === 'scrum'
}

function useJoinState(item: DashboardScheduleItem): JoinState {
  const eligible = shouldShowJoinButton(item)
  const [state, setState] = useState<JoinState>(() =>
    eligible ? computeJoinState(item.schedule, item.concludes) : null,
  )

  useEffect(() => {
    if (!eligible) return
    // Re-evaluate every 30 s so the button appears/disappears without page refresh
    const id = setInterval(() => {
      setState(computeJoinState(item.schedule, item.concludes))
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
  const timeDisplay = formatScheduleTime(item)
  const linkProps = buildLinkProps(item)
  const joinState = useJoinState(item)

  const metaParts = [timeDisplay, item.batchName].filter(Boolean)
  const meta = metaParts.join(' • ')

  return (
    <div className="flex items-stretch gap-3">
      {/* Day label column */}
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

      {/* Card */}
      <Link
        {...linkProps}
        className="flex-1 min-w-0 bg-white rounded-[8px] border border-gray-200 p-3 block shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-3">
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
            <p className="type-b1-md truncate">{item.title}</p>
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

          {/* Join Live / Starts Soon button */}
          {joinState === 'live' ? (
            <span className="shrink-0 inline-flex items-center px-4 py-1.5 rounded-full bg-[#4B44A8] text-white text-sm font-semibold whitespace-nowrap">
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
