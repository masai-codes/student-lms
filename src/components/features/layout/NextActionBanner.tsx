'use client'

import { useEffect, useReducer } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PlayCircle } from 'lucide-react'
import { fetchNavbarPillEvent } from '@/lib/api/dashboard/dashboardApi'
import { useServerTime } from '@/hooks/useServerTime'
import {
  LECTURE_TICK_MS,
  formatCountdown,
  resolveNextActionBannerView,
  type NextActionBannerView,
} from '@/lib/nextActionBanner'
import { pushGtmEvent } from '@/utils/gtm'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const REFRESH_MS = 5 * 60 * 1000

/**
 * Force a re-render so the countdown stays live.
 *
 * `tickMs` drives the periodic refresh (coarse for lectures — the label only
 * changes by the minute). `msUntilStart` adds a precise one-shot re-render at
 * the exact start boundary, so the pill flips to the "View" CTA the instant the
 * countdown hits zero rather than up to `tickMs` later (keeps it in sync with
 * the second-accurate lecture-details countdown). No network cost either way.
 */
function useCountdownTick(tickMs: number, msUntilStart: number | null): void {
  const [, tick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const id = setInterval(tick, tickMs)
    return () => clearInterval(id)
  }, [tickMs])
  useEffect(() => {
    if (msUntilStart == null || msUntilStart <= 0) return
    // +50ms so the adjusted clock has provably crossed the start time on fire.
    const id = setTimeout(tick, msUntilStart + 50)
    return () => clearTimeout(id)
  }, [msUntilStart])
}

function BannerContent({
  view,
  className,
}: {
  view: NextActionBannerView
  className?: string
}) {
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
      <div className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-info">
        <PlayCircle size={16} className="text-info-foreground" />
      </div>
      <span
        className="whitespace-nowrap text-[12px] font-semibold text-foreground"
        data-testid="next-action-banner-label"
      >
        {label}
      </span>
      {countdownMs !== null ? (
        <span
          className="shrink-0 whitespace-nowrap rounded-[8px] bg-surface px-2.5 py-1 text-[12px] font-bold text-foreground shadow-sm"
          data-testid="next-action-banner-countdown"
        >
          {formatCountdown(countdownMs, precise)}
        </span>
      ) : (
        <span
          className="shrink-0 whitespace-nowrap rounded-[8px] bg-brand px-2.5 py-1 text-[12px] font-bold text-brand-foreground"
          data-testid="next-action-banner-cta"
        >
          {ctaText}
        </span>
      )}
    </>
  )

  const contentClass = cn(
    'flex w-fit items-center gap-2 rounded-[14px] bg-[#EBF5FF] px-2.5 py-1.5 transition-colors hover:bg-[#DBEAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:bg-info-subtle dark:hover:bg-info-subtle',
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
      <TooltipContent data-testid="next-action-banner-title">
        {event.title}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Fetches the next-action event and resolves it to the live pill view (or
 * `null` when there's nothing active), keeping the countdown ticking. Shared so
 * callers can branch on whether a pill would render (e.g. the mobile header
 * shows the pill in place of the greeting only when this is non-null).
 */
export function useNextActionBannerView(): NextActionBannerView | null {
  const { data: event } = useQuery({
    queryKey: ['navbar-pill'],
    queryFn: fetchNavbarPillEvent,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
  })

  const { now } = useServerTime()
  const view = resolveNextActionBannerView(event, now.valueOf())

  // `view.tickMs` already picks the right cadence (1s evaluations / 30s
  // lectures); `view.countdownMs` is the ms remaining until start (null once
  // started), which doubles as the precise flip-to-CTA boundary.
  useCountdownTick(view?.tickMs ?? LECTURE_TICK_MS, view?.countdownMs ?? null)

  return view
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
  const view = useNextActionBannerView()
  if (!view) return null

  return <BannerContent view={view} className={className} />
}
