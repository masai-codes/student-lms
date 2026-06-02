import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchLmsSupportInfo } from '@/lib/api/dashboard/dashboardApi'
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

type CardState = 'generic' | 'join' | 'cancelled'

function computeCardState(info: LmsSupportInfo): CardState {
  if (info.isCancelledToday) return 'cancelled'

  const start = parseIST(info.todaySchedule)
  if (!start) return 'generic'

  const end = parseIST(info.todayConcludes)
  const now = Date.now()
  const startMs = start.getTime()
  const endMs = end?.getTime() ?? startMs + 60 * 60 * 1000 // 1-hour fallback

  // Show "Join" from 5 min before schedule until concludes
  if (now >= startMs - 5 * 60 * 1000 && now <= endMs) return 'join'

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
      <div className="shrink-0 w-[136px] self-stretch">
        <img
          src="/SupportDashboard.svg"
          alt="LMS Support"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-col gap-2 p-4 flex-1 min-w-0">
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
    <div className="rounded-[16px] border border-blue-100 bg-blue-50 overflow-hidden flex items-center gap-0">
      <div className="shrink-0 w-[136px] self-stretch">
        <img
          src="/SupportDashboard.svg"
          alt="LMS Support"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-col gap-2.5 p-4 flex-1 min-w-0">
        <p className="text-base font-bold text-gray-900 leading-snug">LMS Support Session</p>
        <p className="text-sm text-gray-600 leading-snug">We're live now to help you</p>
        {zoomLink ? (
          <a
            href={zoomLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex self-start items-center px-5 py-1.5 rounded-full bg-[#4B44A8] text-white text-sm font-semibold hover:bg-[#3d379a] transition-colors"
          >
            Join Now
          </a>
        ) : (
          <span className="inline-flex self-start items-center px-5 py-1.5 rounded-full bg-[#4B44A8] text-white text-sm font-semibold opacity-70 cursor-not-allowed">
            Join Now
          </span>
        )}
      </div>
    </div>
  )
}

function CancelledCard({ nextSchedule }: { nextSchedule: string | null }) {
  const label = formatNextSession(nextSchedule)
  return (
    <div className="rounded-[16px] border-2 border-blue-400 bg-white overflow-hidden flex items-center gap-0">
      <div className="shrink-0 w-[136px] self-stretch">
        <img
          src="/SupportDashboard.svg"
          alt="LMS Support"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-col gap-2 p-4 flex-1 min-w-0">
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

export function LmsSupportPanel() {
  const { data: info } = useQuery({
    queryKey: ['lms-support-info'],
    queryFn: fetchLmsSupportInfo,
    staleTime: 5 * 60 * 1000,
  })

  const cardState = useCardState(info)

  // Not visible (not in section 5996, or no lectures scheduled)
  if (info && !info.visible) return null

  // While loading, show generic as placeholder
  if (!info || cardState === 'generic') return <GenericCard />
  if (cardState === 'join') return <JoinCard zoomLink={info.todayZoomLink} />
  return <CancelledCard nextSchedule={info.nextSchedule} />
}
