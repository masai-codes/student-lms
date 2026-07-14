'use client'

import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { useCountdown } from './hooks/useCountdown'
import {
  JOIN_UI_ACTIVE_MINUTES_BEFORE_START,
  JOIN_UI_VISIBLE_MINUTES_BEFORE_START,
} from '@/server/learn/utils/lectureScheduleConstants'
import { parseMysqlDatetimeIST } from '@/utils/timeZoneHandler'

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const UNLOCK_LEAD_MS = JOIN_UI_VISIBLE_MINUTES_BEFORE_START * MINUTE_MS

/**
 * Time-before-start marks (ms) at which the server-computed join state changes.
 * Since that state is a fetch-time snapshot, the client can't recompute it — so
 * as the live countdown crosses each mark we refetch the route to pull a fresh
 * snapshot, flipping the UI automatically instead of waiting for a reload:
 *   • 10 min → `hidden → disabled` and `before → during` (join card appears)
 *   • 5 min  → `disabled → active`  (Join live session button enables)
 */
const REFETCH_MARKS_MS = [
  JOIN_UI_VISIBLE_MINUTES_BEFORE_START * MINUTE_MS,
  JOIN_UI_ACTIVE_MINUTES_BEFORE_START * MINUTE_MS,
]

type CountdownUnit = { key: string; value: number; label: string }

function splitDuration(remainingMs: number): Array<CountdownUnit> {
  const days = Math.floor(remainingMs / DAY_MS)
  const hours = Math.floor((remainingMs % DAY_MS) / HOUR_MS)
  const minutes = Math.floor((remainingMs % HOUR_MS) / MINUTE_MS)
  const seconds = Math.floor((remainingMs % MINUTE_MS) / 1000)

  const units: Array<CountdownUnit> = [
    { key: 'h', value: hours, label: 'Hours' },
    { key: 'm', value: minutes, label: 'Mins' },
    { key: 's', value: seconds, label: 'Secs' },
  ]

  // Days only surface when the lecture is more than a day out, keeping the row
  // compact for the common same-day case.
  if (days > 0)
    units.unshift({ key: 'd', value: days, label: days === 1 ? 'Day' : 'Days' })

  return units
}

/** Two-digit face for one time unit; the digits flip up whenever the value changes. */
function CountdownTile({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, '0')

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Tiles shrink a notch below 400px so the four-tile (days) row still
          fits inside the card at 320px viewports. */}
      <div className="relative flex h-14 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm shadow-primary/5 backdrop-blur-sm min-[400px]:h-16 min-[400px]:w-14 sm:h-[4.5rem] sm:w-16">
        {/* Faint divider that hints at a split-flap clock. */}
        <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gray-900/5" />
        <span
          // Remounting on value change replays the flip animation each tick.
          key={padded}
          className="animate-countdown-digit-in type-h4 tabular-nums font-semibold text-gray-900"
        >
          {padded}
        </span>
      </div>
      <span className="type-caption uppercase tracking-[0.14em] text-gray-500">
        {label}
      </span>
    </div>
  )
}

type LectureStartsInCountdownProps = {
  schedule: string | null
}

/**
 * Live "Live lecture starts in HH:MM:SS" countdown to the scheduled start.
 * Shown in the `before` phase and kept alive through the `during` phase so it
 * counts all the way down to 00:00:00 alongside the join button. As it crosses
 * each `REFETCH_MARKS_MS` boundary it refetches the route so the join CTA
 * appears / enables automatically, without the student reloading.
 */
export function LectureStartsInCountdown({
  schedule,
}: LectureStartsInCountdownProps) {
  const router = useRouter()
  const targetMs = parseMysqlDatetimeIST(schedule)?.valueOf() ?? null
  const remainingMs = useCountdown(targetMs)
  const prevRemainingMs = useRef<number | null>(null)
  const firedMarks = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (remainingMs == null) return
    const prev = prevRemainingMs.current
    prevRemainingMs.current = remainingMs

    // Only fire on a genuine downward crossing (prev strictly above the mark,
    // now at/below it). The `prev != null` guard means a mark already in the
    // past when this mounts never fires — we only react to live transitions.
    for (const mark of REFETCH_MARKS_MS) {
      if (firedMarks.current.has(mark)) continue
      if (prev != null && prev > mark && remainingMs <= mark) {
        firedMarks.current.add(mark)
        void router.invalidate()
      }
    }
  }, [remainingMs, router])

  // Nothing to count down to, or the start time has arrived — the lecture is
  // now live, so the timer has served its purpose and hides itself.
  if (remainingMs == null || remainingMs <= 0) return null

  const units = splitDuration(remainingMs)
  const isImminent = remainingMs <= UNLOCK_LEAD_MS

  return (
    <div
      data-testid="lecture-starts-in-countdown"
      className="animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-500 relative w-full max-w-sm overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-5 shadow-lg shadow-primary/5"
    >
      {/* Sweeping sheen across the card. */}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-countdown-sheen bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      <div className="relative flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          {/* Pulsing "live" dot with an expanding ring. */}
          <span className="relative flex size-2.5 items-center justify-center">
            <span className="absolute inline-flex size-2.5 animate-countdown-ring rounded-full bg-primary/60" />
            <span className="animate-countdown-pulse relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="type-b3-md uppercase tracking-[0.18em] text-primary">
            {isImminent ? 'Starting soon' : 'Live lecture starts in'}
          </span>
        </div>

        <div className="flex items-end gap-1 min-[400px]:gap-1.5">
          {units.map((unit, index) => (
            <div
              key={unit.key}
              className="flex items-end gap-1 min-[400px]:gap-1.5"
            >
              <CountdownTile value={unit.value} label={unit.label} />
              {index < units.length - 1 ? (
                <span
                  className="type-h4 animate-countdown-pulse pb-6 font-semibold text-primary/50 min-[400px]:pb-7"
                  aria-hidden
                >
                  :
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
