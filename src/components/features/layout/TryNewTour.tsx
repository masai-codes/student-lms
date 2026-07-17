'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { markTryNewTourSeen } from '@/lib/api/profile/profileApi'

/** Padding around the highlighted target, in px. */
const SPOTLIGHT_PADDING = 8

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

/**
 * One-time guided tour highlighting the "Try New" CTA. Shows only when the user
 * hasn't seen it (persisted to users.meta) and the CTA is on screen (i.e. one of
 * the migrated pages). Dependency-free spotlight — works on web and mobile.
 * Extend `STEPS` later to add more steps.
 */
export function TryNewTour({ hasSeen }: { hasSeen: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [rect, setRect] = useState<Rect | null>(null)
  const [dismissed, setDismissed] = useState(hasSeen)

  const { mutate } = useMutation({ mutationFn: markTryNewTourSeen })

  const measure = useCallback(() => {
    const el = getVisibleTarget()
    if (!el) {
      setRect(null)
      return false
    }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    return true
  }, [])

  // Poll briefly for the target after mount / navigation (layout + async render).
  useEffect(() => {
    if (dismissed) return
    let timer = 0
    let tries = 0
    const tick = () => {
      if (measure()) return
      if (tries++ < 20) timer = window.setTimeout(tick, 150)
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [dismissed, pathname, measure])

  // Keep the spotlight glued to the target on resize / scroll.
  useEffect(() => {
    if (dismissed || !rect) return
    const onChange = () => measure()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [dismissed, rect, measure])

  if (dismissed || !rect || typeof document === 'undefined') return null

  const finish = () => {
    setDismissed(true)
    mutate()
  }

  const spotTop = rect.top - SPOTLIGHT_PADDING
  const spotLeft = rect.left - SPOTLIGHT_PADDING
  const spotW = rect.width + SPOTLIGHT_PADDING * 2
  const spotH = rect.height + SPOTLIGHT_PADDING * 2

  const popWidth = Math.min(320, window.innerWidth - 24)
  const popTop = spotTop + spotH + 12
  let popLeft = rect.left + rect.width - popWidth
  if (popLeft < 12) popLeft = 12
  if (popLeft + popWidth > window.innerWidth - 12) {
    popLeft = window.innerWidth - 12 - popWidth
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000]"
      role="dialog"
      aria-modal="true"
      aria-label="Feature tour"
    >
      {/* Spotlight: transparent box with a huge shadow dims everything else. */}
      <div
        className="pointer-events-none absolute rounded-full transition-all duration-200"
        style={{
          top: spotTop,
          left: spotLeft,
          width: spotW,
          height: spotH,
          boxShadow: '0 0 0 9999px rgba(17, 17, 26, 0.6)',
        }}
      />
      {/* Popover */}
      <div
        className="absolute rounded-2xl bg-surface p-4 shadow-xl"
        style={{ top: popTop, left: popLeft, width: popWidth }}
      >
        <h3 className="text-base font-bold text-foreground">
          Try the new experience ✨
        </h3>
        <p className="mt-1 text-sm text-foreground-muted">
          Switch between the new and classic experience anytime from here — you
          can always switch back.
        </p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={finish}
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
