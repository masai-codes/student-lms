'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { markTryNewTourSeen } from '@/lib/api/newLmsPreferenceApi'
import { invalidateMeQuery } from '@/query/me/meCache'

/** Padding around the highlighted target, in px. */
const SPOTLIGHT_PADDING = 8
/** Gap between the spotlight and the popover, in px. */
const POPOVER_GAP = 12
/** Minimum distance the popover keeps from the viewport edges, in px. */
const VIEWPORT_MARGIN = 12
const POPOVER_MAX_WIDTH = 320
/** Height assumed for the first frame, before the popover has been measured. */
const POPOVER_FALLBACK_HEIGHT = 170
/** Side of the rotated caret square, in px (`size-3`). */
const CARET_SIZE = 12
/**
 * How long tracking keeps running after the last geometry change, in frames
 * (~3s at 60fps). Long enough for the navbar's async content to land, bounded so
 * the tour isn't measuring forever — resize/scroll restarts it.
 */
const TRACK_FRAMES = 180

type Rect = { top: number; left: number; width: number; height: number }

/** The first visible (rendered, non-zero-size) "Try New" CTA — desktop or mobile. */
function getVisibleTarget(): HTMLElement | null {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>('[data-tour-target="try-new"]'),
  )
  return (
    els.find((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && el.offsetParent !== null
    }) ?? null
  )
}

function sameRect(a: Rect | null, b: Rect | null) {
  if (!a || !b) return a === b
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  )
}

function clamp(value: number, min: number, max: number) {
  // `max` can fall below `min` on very narrow viewports; `min` wins there.
  return Math.max(min, Math.min(value, max))
}

/**
 * One-time guided tour highlighting the "Try New" CTA. Shows only when the user
 * hasn't seen it (persisted to users.meta) and the CTA is on screen (i.e. one of
 * the migrated pages). Dependency-free spotlight — works on web and mobile.
 * Extend `STEPS` later to add more steps.
 */
export function TryNewTour({ hasSeen }: { hasSeen: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [rect, setRect] = useState<Rect | null>(null)
  const [popHeight, setPopHeight] = useState(0)
  const [dismissed, setDismissed] = useState(hasSeen)
  const popRef = useRef<HTMLDivElement | null>(null)
  // Mirrors of the state above, so the rAF loop can diff without re-subscribing.
  const rectRef = useRef<Rect | null>(null)
  const popHeightRef = useRef(0)

  const queryClient = useQueryClient()
  // `hasSeenTryNewTour` comes from the cached `me` payload, so the cache has to
  // go once the flag is persisted — otherwise the tour reappears for up to
  // `ME_STALE_TIME` on a later navigation.
  const { mutate } = useMutation({
    mutationFn: markTryNewTourSeen,
    onSuccess: () => invalidateMeQuery(queryClient),
  })

  /** Reads the target + popover geometry; returns true when something moved. */
  const measure = useCallback(() => {
    const el = getVisibleTarget()
    const next = el
      ? (() => {
          const r = el.getBoundingClientRect()
          return { top: r.top, left: r.left, width: r.width, height: r.height }
        })()
      : null
    const h = popRef.current?.offsetHeight ?? 0
    let changed = false
    if (!sameRect(rectRef.current, next)) {
      rectRef.current = next
      setRect(next)
      changed = true
    }
    if (Math.abs(popHeightRef.current - h) >= 0.5) {
      popHeightRef.current = h
      setPopHeight(h)
      changed = true
    }
    return changed
  }, [])

  // Track the target while the navbar settles. It fills in asynchronously around
  // the toggle (lecture banner, nav items, icons that depend on `me`), and each
  // of those reflows moves the toggle sideways — a one-shot measurement leaves
  // the spotlight and popover next to where the toggle *used* to be. So re-read
  // every frame, keep going for a while after each change, and stop once the
  // geometry has held still (resize/scroll restarts the loop).
  useEffect(() => {
    if (dismissed) return
    let frame = 0
    let budget = TRACK_FRAMES
    const tick = () => {
      if (measure()) budget = TRACK_FRAMES
      budget -= 1
      frame = budget > 0 ? window.requestAnimationFrame(tick) : 0
    }
    const restart = () => {
      budget = TRACK_FRAMES
      if (!frame) frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    window.addEventListener('resize', restart)
    window.addEventListener('scroll', restart, true)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', restart)
      window.removeEventListener('scroll', restart, true)
    }
  }, [dismissed, pathname, measure])

  if (dismissed || !rect || typeof document === 'undefined') return null

  const finish = () => {
    setDismissed(true)
    mutate()
  }

  const spotTop = rect.top - SPOTLIGHT_PADDING
  const spotLeft = rect.left - SPOTLIGHT_PADDING
  const spotW = rect.width + SPOTLIGHT_PADDING * 2
  const spotH = rect.height + SPOTLIGHT_PADDING * 2

  const popWidth = Math.min(
    POPOVER_MAX_WIDTH,
    window.innerWidth - VIEWPORT_MARGIN * 2,
  )
  const popH = popHeight || POPOVER_FALLBACK_HEIGHT

  // Below the target by default; flip above when the viewport bottom is closer
  // than the popover is tall (mobile bottom nav, short windows).
  const below = spotTop + spotH + POPOVER_GAP + popH
  const placeAbove =
    below > window.innerHeight - VIEWPORT_MARGIN &&
    spotTop - POPOVER_GAP - popH > VIEWPORT_MARGIN
  const popTop = placeAbove
    ? spotTop - POPOVER_GAP - popH
    : spotTop + spotH + POPOVER_GAP

  // Centre on the target so the popover reads as belonging to the switch, then
  // clamp to the viewport; the caret keeps pointing at the switch either way.
  const targetCentre = rect.left + rect.width / 2
  const popLeft = clamp(
    targetCentre - popWidth / 2,
    VIEWPORT_MARGIN,
    window.innerWidth - VIEWPORT_MARGIN - popWidth,
  )
  const caretLeft = clamp(
    targetCentre - popLeft,
    CARET_SIZE + 4,
    popWidth - CARET_SIZE - 4,
  )

  return createPortal(
    <div
      className="fixed inset-0 z-[1000]"
      role="dialog"
      aria-modal="true"
      aria-label="Feature tour"
      data-testid="try-new-tour"
    >
      {/* Spotlight: transparent box with a huge shadow dims everything else.
          Dimming alone can't carry the highlight on the dark theme — the
          surroundings are already near-black, so the cut-out reads as more of the
          same. Hence the brand ring + glow (purple in light, red in dark, both
          straight off `--brand`), and a darker scrim in dark so the un-dimmed
          switch still separates from it. */}
      <div
        className="pointer-events-none absolute rounded-full [--tour-scrim:rgba(17,17,26,0.6)] dark:[--tour-scrim:rgba(0,0,0,0.8)]"
        data-testid="try-new-tour-spotlight"
        style={{
          // All one property: Tailwind's `ring-*` also compiles to `box-shadow`,
          // so an inline shadow would drop the ring. Layers paint first-on-top,
          // which is why the scrim comes last.
          top: spotTop,
          left: spotLeft,
          width: spotW,
          height: spotH,
          boxShadow: [
            '0 0 0 2px var(--brand)',
            '0 0 0 6px color-mix(in srgb, var(--brand) 40%, transparent)',
            '0 0 24px 4px color-mix(in srgb, var(--brand) 55%, transparent)',
            '0 0 0 9999px var(--tour-scrim)',
          ].join(', '),
        }}
      />
      {/* Popover */}
      <div
        ref={popRef}
        // The border earns its keep on the dark theme, where the surface would
        // otherwise blend into the scrim behind it.
        className="absolute rounded-2xl border border-border bg-surface p-4 shadow-xl"
        style={{ top: popTop, left: popLeft, width: popWidth }}
      >
        {/* Caret — a rotated square tucked under the popover's edge. */}
        <span
          aria-hidden
          className="absolute size-3 rotate-45 rounded-[2px] bg-surface"
          style={{
            left: caretLeft - CARET_SIZE / 2,
            ...(placeAbove ? { bottom: -5 } : { top: -5 }),
          }}
        />
        <h3 className="text-base font-bold text-foreground">
          You're on the new lms experience ✨
        </h3>
        <p className="mt-1 text-sm text-foreground-muted">
          This is our redesigned experience. You can switch back to the classic
          one anytime from here.
        </p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={finish}
            data-testid="try-new-tour-got-it"
            className="rounded-[10px] bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
