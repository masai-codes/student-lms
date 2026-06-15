import { useState, useEffect } from 'react'
import type { LmsSupportInfo } from '@/server/api/dashboard/getLmsSupportInfo.service'
import { parseMysqlDatetimeIST, getTzLabel } from '@/utils/timeZoneHandler'
import { useServerTime } from '@/hooks/useServerTime'

function formatNextSession(raw: string | null, skewMs = 0): string {
  if (!raw) return ''
  const parsed = parseMysqlDatetimeIST(raw)
  if (!parsed) return ''
  const date = new Date(parsed.valueOf() - skewMs)
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = date.getDate()
  const month = MONTHS[date.getMonth()]
  const h = date.getHours() % 12 || 12
  const min = date.getMinutes()
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM'
  const timePart = min === 0 ? `${h} ${ampm}` : `${h}:${String(min).padStart(2, '0')} ${ampm}`
  return `${day} ${month} at ${timePart} (${getTzLabel()})`
}

// ── Join-state computation ─────────────────────────────────────────────────────

type CardState = 'generic' | 'scheduled-today' | 'join' | 'next-session'

function computeCardState(info: LmsSupportInfo, nowMs: number): CardState {
  const start = parseMysqlDatetimeIST(info.todaySchedule)

  if (start) {
    const end = parseMysqlDatetimeIST(info.todayConcludes)
    const startMs = start.valueOf()
    const endMs = end?.valueOf() ?? startMs + 60 * 60 * 1000

    if (nowMs >= startMs - 5 * 60 * 1000 && nowMs <= endMs) return 'join'
    return 'scheduled-today'
  }

  if (info.nextSchedule) return 'next-session'
  return 'generic'
}

function useCardState(info: LmsSupportInfo | undefined, nowMs: number): CardState {
  const [state, setState] = useState<CardState>(() =>
    info ? computeCardState(info, nowMs) : 'generic',
  )

  useEffect(() => {
    if (!info) return
    setState(computeCardState(info, Date.now()))
    const id = setInterval(() => setState(computeCardState(info, Date.now())), 30_000)
    return () => clearInterval(id)
  }, [info])

  return state
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GenericCard() {
  return (
    <div className="rounded-[16px] border border-gray-200 bg-[#F9FAFB] overflow-hidden flex items-center gap-0">
      <div className="shrink-0 w-[120px]">
        <img
          src="/SupportDashboard.svg"
          alt="LMS Support"
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-col gap-2 px-3 py-4 flex-1 min-w-0">
        <p className="text-base font-bold text-gray-900 leading-snug">LMS Support Session</p>
        <p className="text-sm text-gray-500 leading-snug">
          Join our daily session to get your questions answered
        </p>
        <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-[#FEF9C3] text-sm font-semibold text-[#713F12]">
          Everyday at 6:30 PM
        </span>
      </div>
    </div>
  )
}

function JoinCard({ zoomLink }: { zoomLink: string | null }) {
  return (
    <div className="rounded-[16px] border border-gray-200 bg-blue-50 overflow-hidden flex items-center gap-0">
      <div className="shrink-0 w-[120px]">
        <img
          src="/SupportDashboard.svg"
          alt="LMS Support"
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-col gap-2.5 px-3 py-4 flex-1 min-w-0">
        <p className="text-base font-bold text-gray-900 leading-snug">LMS Support Session</p>
        <p className="text-sm text-gray-600 leading-snug">We're live now to help you</p>
        {zoomLink ? (
          <a
            href={zoomLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex self-start items-center px-5 py-1.5 rounded-md bg-[#6962AC] text-white text-sm font-semibold hover:bg-[#5a54a0] transition-colors"
          >
            Join Now
          </a>
        ) : (
          <span className="inline-flex self-start items-center px-5 py-1.5 rounded-md bg-[#6962AC] text-white text-sm font-semibold opacity-70 cursor-not-allowed">
            Join Now
          </span>
        )}
      </div>
    </div>
  )
}

function ScheduledTodayCard({ schedule, skewMs }: { schedule: string | null; skewMs: number }) {
  const label = formatNextSession(schedule, skewMs)
  return (
    <div className="rounded-[16px] border border-gray-200 bg-[#F9FAFB] overflow-hidden flex items-center gap-0">
      <div className="shrink-0 w-[120px]">
        <img
          src="/SupportDashboard.svg"
          alt="LMS Support"
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-col gap-2 px-3 py-4 flex-1 min-w-0">
        <p className="text-base font-bold text-gray-900 leading-snug">LMS Support Session</p>
        <p className="text-sm text-gray-500 leading-snug">Today's session is scheduled at</p>
        {label ? (
          <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-[#FEF9C3] text-sm font-semibold text-[#713F12]">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function NextSessionCard({ nextSchedule, skewMs }: { nextSchedule: string | null; skewMs: number }) {
  const label = formatNextSession(nextSchedule, skewMs)
  return (
    <div className="rounded-[16px] border border-gray-200 bg-white overflow-hidden flex items-center gap-0">
      <div className="shrink-0 w-[120px]">
        <img
          src="/SupportDashboard.svg"
          alt="LMS Support"
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-col gap-2 px-3 py-4 flex-1 min-w-0">
        <p className="text-base font-bold text-gray-900 leading-snug">LMS Support Session</p>
        <p className="text-sm text-gray-500 leading-snug">
          No session today, the next session is scheduled for
        </p>
        {label ? (
          <span className="inline-flex self-start items-center px-3 py-1 rounded-full bg-[#FEF9C3] text-sm font-semibold text-[#713F12]">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────────

export function LmsSupportPanel({ info }: { info: LmsSupportInfo | undefined }) {
  const { now, skewMs } = useServerTime()
  const cardState = useCardState(info, now.valueOf())

  if (info && !info.visible) return null

  if (!info || cardState === 'generic') return <GenericCard />
  if (cardState === 'join') return <JoinCard zoomLink={info.todayZoomLink} />
  if (cardState === 'scheduled-today') return <ScheduledTodayCard schedule={info.todaySchedule} skewMs={skewMs} />
  return <NextSessionCard nextSchedule={info.nextSchedule} skewMs={skewMs} />
}
