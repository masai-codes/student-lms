import { useState, useEffect } from 'react'
import type { LmsSupportInfo } from '@/server/api/dashboard/getLmsSupportInfo.service'

// ── IST time helpers ───────────────────────────────────────────────────────────

/**
 * Parse a naive datetime string (stored in IST, no tz specifier) as IST.
 * Appends +05:30 only when no timezone info is present.
 */
function parseIST(raw: string | null): Date | null {
  if (!raw) return null
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const withTz = /[Z+]/.test(normalized) ? normalized : `${normalized}+05:30`
  const d = new Date(withTz)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Format an IST datetime string as "27 Feb at 6:30 PM"
 */
function formatNextSession(raw: string | null): string {
  if (!raw) return ''
  const d = parseIST(raw)
  if (!d) return ''
  const datePart = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  })
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
  return `${datePart} at ${timePart}`
}

// ── Join-state computation ─────────────────────────────────────────────────────

type CardState = 'generic' | 'scheduled-today' | 'join' | 'next-session'

function computeCardState(info: LmsSupportInfo): CardState {
  const start = parseIST(info.todaySchedule)

  if (start) {
    const end = parseIST(info.todayConcludes)
    const now = Date.now()
    const startMs = start.getTime()
    const endMs = end?.getTime() ?? startMs + 60 * 60 * 1000

    // Live: 5 min before start until concludes
    if (now >= startMs - 5 * 60 * 1000 && now <= endMs) return 'join'

    // Scheduled later today
    return 'scheduled-today'
  }

  // No lecture today but upcoming
  if (info.nextSchedule) return 'next-session'

  return 'generic'
}

function useCardState(info: LmsSupportInfo | undefined): CardState {
  const [state, setState] = useState<CardState>(() =>
    info ? computeCardState(info) : 'generic',
  )

  useEffect(() => {
    if (!info) return
    setState(computeCardState(info))
    const id = setInterval(() => setState(computeCardState(info)), 30_000)
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

function ScheduledTodayCard({ schedule }: { schedule: string | null }) {
  const label = formatNextSession(schedule)
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

function NextSessionCard({ nextSchedule }: { nextSchedule: string | null }) {
  const label = formatNextSession(nextSchedule)
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
  const cardState = useCardState(info)

  if (info && !info.visible) return null

  if (!info || cardState === 'generic') return <GenericCard />
  if (cardState === 'join') return <JoinCard zoomLink={info.todayZoomLink} />
  if (cardState === 'scheduled-today') return <ScheduledTodayCard schedule={info.todaySchedule} />
  return <NextSessionCard nextSchedule={info.nextSchedule} />
}
