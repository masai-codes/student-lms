import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PlayCircle } from 'lucide-react'
import type { NavbarPillEvent } from '@/server/api/dashboard/getNavbarPill.service'
import { fetchNavbarPillEvent } from '@/lib/api/dashboard/dashboardApi'

function parseToMs(raw: string): number {
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const withTz = /[Z+]/.test(normalized) ? normalized : `${normalized}+05:30`
  return new Date(withTz).getTime()
}

function formatMmSs(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000))
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatMins(ms: number): string {
  const mins = Math.ceil(ms / 60000)
  return `${mins} mins`
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function PillContent({ event }: { event: NavbarPillEvent }) {
  const now = useNow(event.eventType === 'evaluation' ? 1000 : 30000)
  const startMs = parseToMs(event.schedule)
  const endMs = parseToMs(event.concludes)
  const msUntilStart = startMs - now
  const isStarted = now >= startMs
  const isEnded = now >= endMs

  if (isEnded) return null

  const isEvaluation = event.eventType === 'evaluation'
  const label = isStarted
    ? `${isEvaluation ? 'Evaluation' : 'Lecture'} has started`
    : isEvaluation
      ? 'Upcoming evaluation'
      : 'Upcoming lecture'

  const countdown = isStarted
    ? null
    : isEvaluation
      ? formatMmSs(msUntilStart)
      : formatMins(msUntilStart)

  const pillClass = "hidden lg:flex items-center gap-3 bg-[#EBF5FF] hover:bg-[#DBEAFE] transition-colors rounded-[14px] px-3 py-2 max-w-[340px] min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"

  const inner = (
    <>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#3F83F8]">
        <PlayCircle size={18} className="text-white" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[11px] font-medium text-[#4B5563] leading-none mb-0.5">{label}</span>
        <span className="text-[13px] font-bold text-gray-900 truncate leading-snug">{event.title}</span>
      </div>
      {countdown !== null ? (
        <span className="shrink-0 bg-white rounded-[10px] px-3 py-1.5 text-[13px] font-bold text-gray-800 shadow-sm whitespace-nowrap">{countdown}</span>
      ) : (
        <span className="shrink-0 bg-[#3F83F8] rounded-[10px] px-3 py-1.5 text-[13px] font-bold text-white whitespace-nowrap">{isEvaluation ? 'Start' : 'Join Now'}</span>
      )}
    </>
  )

  if (isEvaluation) {
    return (
      <a href={`/assignments/${event.id}/assignmentDetails`} className={pillClass}>
        {inner}
      </a>
    )
  }

  return (
    <Link
      to="/lectures/$lectureId"
      params={{ lectureId: String(event.id) }}
      className={pillClass}
    >
      {inner}
    </Link>
  )
}

export function UpcomingLecturePill() {
  const { data } = useQuery({
    queryKey: ['navbar-pill'],
    queryFn: fetchNavbarPillEvent,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })

  if (!data) return null
  return <PillContent event={data} />
}
