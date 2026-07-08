'use client'

import { useEffect, useReducer } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PlayCircle } from 'lucide-react'
import { fetchNavbarPillEvent } from '@/lib/api/dashboard/dashboardApi'
import { useServerTime } from '@/hooks/useServerTime'
import {
  EVALUATION_TICK_MS,
  LECTURE_TICK_MS,
  formatCountdown,
  resolveNextActionBannerView,
  type NextActionBannerView,
} from '@/lib/nextActionBanner'
import { pushGtmEvent } from '@/utils/gtm'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const REFRESH_MS = 5 * 60 * 1000

/** Force a re-render on an interval so the countdown stays live. */
function useCountdownTick(tickMs: number): void {
  const [, tick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const id = setInterval(tick, tickMs)
    return () => clearInterval(id)
  }, [tickMs])
}

function BannerContent({ view, className }: { view: NextActionBannerView; className?: string }) {
  const { event, label, countdownMs, precise, ctaText } = view

  const handleCtaClick = () => {
    pushGtmEvent(`next_action_banner_cta_click_id_${event.id}`, {
      entity_type: event.eventType,
      entity_id: event.id,
      cta: ctaText,
      title: event.title,
    })
  }

  // Title is intentionally not shown inline (keeps the pill small) — it surfaces
  // in the hover tooltip below. Default view is just: icon · label · countdown/CTA.
  const inner = (
    <>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-[#3F83F8]">
        <PlayCircle size={16} className="text-white" />
      </div>
      <span
        className="whitespace-nowrap text-[12px] font-semibold text-gray-800"
        data-testid="next-action-banner-label"
      >
        {label}
      </span>
      {countdownMs !== null ? (
        <span
          className="shrink-0 whitespace-nowrap rounded-[8px] bg-white px-2.5 py-1 text-[12px] font-bold text-gray-800 shadow-sm"
          data-testid="next-action-banner-countdown"
        >
          {formatCountdown(countdownMs, precise)}
        </span>
      ) : (
        <span
          className="shrink-0 whitespace-nowrap rounded-[8px] bg-[#6962AC] px-2.5 py-1 text-[12px] font-bold text-white"
          data-testid="next-action-banner-cta"
        >
          {ctaText}
        </span>
      )}
    </>
  )

  const contentClass = cn(
    'flex w-fit items-center gap-2 rounded-[14px] bg-[#EBF5FF] px-2.5 py-1.5 transition-colors hover:bg-[#DBEAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
    className,
  )

  // Assignments live on the old student UI; lectures are in-app router routes.
  const trigger =
    event.eventType === 'evaluation' ? (
      <a
        href={`/assignments/${event.id}/assignmentDetails`}
        onClick={handleCtaClick}
        className={contentClass}
        data-testid="next-action-banner"
      >
        {inner}
      </a>
    ) : (
      <Link
        to="/lectures/$lectureId"
        params={{ lectureId: String(event.id) }}
        onClick={handleCtaClick}
        className={contentClass}
        data-testid="next-action-banner"
      >
        {inner}
      </Link>
    )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent data-testid="next-action-banner-title">{event.title}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Compact navbar pill surfacing the student's single most relevant next action —
 * "View" for the highest-priority live lecture or "Start" an evaluation.
 * The backend picks the event (evaluation > live > scrum, within its visible
 * window); this component just renders it and keeps the countdown live. Renders
 * nothing when there is no active event. Sizing/placement is controlled by the
 * caller via `className` (e.g. `max-w-[340px]` in the navbar).
 */
export function NextActionBanner({ className }: { className?: string }) {
  const { data: event } = useQuery({
    queryKey: ['navbar-pill'],
    queryFn: fetchNavbarPillEvent,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
  })

  const tickMs = event?.eventType === 'evaluation' ? EVALUATION_TICK_MS : LECTURE_TICK_MS
  useCountdownTick(tickMs)

  const { now } = useServerTime()
  const view = resolveNextActionBannerView(event, now.valueOf())
  if (!view) return null

  return <BannerContent view={view} className={className} />
}
