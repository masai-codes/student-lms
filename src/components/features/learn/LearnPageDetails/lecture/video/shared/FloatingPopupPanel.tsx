'use client'

import { useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { CaretDown, CaretUp } from '@phosphor-icons/react'

import BottomDrawer from '@/components/ui/bottom-drawer'
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport'
import { cn } from '@/lib/utils'

/** Default panel geometry / constraints (px), within the viewport. */
const DEFAULT_WIDTH = 420
const DEFAULT_HEIGHT = 520
const PANEL_MARGIN = 16
const MIN_WIDTH = 300
const MIN_HEIGHT = 220
/** Minimized geometry — collapsed to just the header bar, bottom-right corner. */
const MINIMIZED_WIDTH = 280
const MINIMIZED_HEIGHT = 56

type Corner = 'nw' | 'ne' | 'sw' | 'se'

/** Panel position (top-left) + size, in px within the viewport. */
type Geom = { x: number; y: number; w: number; h: number }

/** Live drag/resize gesture, captured at pointer-down. */
type Gesture = {
  kind: 'drag' | 'resize'
  corner?: Corner
  startX: number
  startY: number
  x: number
  y: number
  w: number
  h: number
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(value, lo), hi)
}

/** Compute the default panel geometry (bottom-right of the viewport). */
function defaultGeom(): Geom {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT }
  }
  const bw = window.innerWidth
  const bh = window.innerHeight
  const w = Math.min(DEFAULT_WIDTH, bw - PANEL_MARGIN * 2)
  const h = Math.min(DEFAULT_HEIGHT, bh - PANEL_MARGIN * 2)
  return { x: bw - w - PANEL_MARGIN, y: bh - h - PANEL_MARGIN, w, h }
}

/** Keep a geometry fully inside the current viewport. */
function clampToViewport(g: Geom): Geom {
  const bw = window.innerWidth
  const bh = window.innerHeight
  const w = Math.min(g.w, bw)
  const h = Math.min(g.h, bh)
  return { w, h, x: clamp(g.x, 0, bw - w), y: clamp(g.y, 0, bh - h) }
}

const RESIZE_HANDLES: ReadonlyArray<{ corner: Corner; className: string }> = [
  { corner: 'nw', className: 'left-0 top-0 cursor-[nwse-resize]' },
  { corner: 'ne', className: 'right-0 top-0 cursor-[nesw-resize]' },
  { corner: 'sw', className: 'bottom-0 left-0 cursor-[nesw-resize]' },
  { corner: 'se', className: 'bottom-0 right-0 cursor-[nwse-resize]' },
]

export type FloatingPopupPanelProps = {
  title: string
  ariaLabel: string
  testId: string
  /** Whether the video player is currently in fullscreen. */
  isFullscreen: boolean
  /**
   * Element to portal into. The Fullscreen API renders only the fullscreen
   * element and its descendants — a portal to `document.body` (a sibling of
   * it) is hidden by the browser the moment the video goes fullscreen, no
   * matter its z-index. Pass the video player's fullscreen root while
   * fullscreen so the popup stays a descendant and remains visible; pass
   * `null`/omit otherwise so it falls back to `document.body` — nesting it
   * inside the (possibly `overflow`-clipped) player container while NOT
   * fullscreen would clip the popup instead of letting it drag across the
   * whole page. Callers should remount this component (e.g. via `key`) when
   * the target changes rather than relying on an in-place re-portal, so the
   * popup always opens fresh in the container that's actually current.
   */
  portalContainer?: HTMLElement | null
  /** Rendered content area; receives `interacting` so cross-origin iframes can
   * disable pointer events during drag/resize. */
  children: (opts: { interacting: boolean }) => ReactNode
  /** Rendered above the content area (e.g. a "skip to next concept" overlay). */
  overlay?: ReactNode
  /**
   * Rendered as a ribbon below the content area (e.g. the quiz "Continue"
   * action). Hidden while minimized, like the content itself.
   */
  footer?: ReactNode
}

/**
 * Popup surface shared by the in-lecture quiz and poll modals. It renders as
 * one of two things, decided by `useIsMobileViewport` (`max-width: 767px`, i.e.
 * below Tailwind's `md`):
 *
 * - **tablet and up** — a non-blocking floating panel: portaled (to
 *   `portalContainer`, see above), `position: fixed`, dragged by the header and
 *   resized from any corner (pointer capture keeps the gesture alive over
 *   cross-origin content), collapsible to its header bar. A tablet has room for
 *   it, and the embedded quiz keeps its wide layout.
 * - **phones** — a {@link BottomDrawer} bottom sheet. Dragging a popup around a
 *   phone screen is pointless, and the floating panel would sit on top of the
 *   mobile tab bar; the sheet is the pattern the rest of the app already uses at
 *   this width. Collapsing it leaves a pill centered above that tab bar, in
 *   place of the panel's minimized header bar.
 *
 * Opening/closing by playback window is owned by the caller's hook either way.
 */
export function FloatingPopupPanel({
  title,
  ariaLabel,
  testId,
  isFullscreen,
  portalContainer,
  children,
  overlay,
  footer,
}: FloatingPopupPanelProps) {
  const isMobile = useIsMobileViewport()
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [geom, setGeom] = useState<Geom>(defaultGeom)
  const [interacting, setInteracting] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const gestureRef = useRef<Gesture | null>(null)
  // The pre-minimize geometry, restored when un-minimizing.
  const restoreGeomRef = useRef<Geom | null>(null)

  useEffect(() => {
    setPortalTarget(portalContainer ?? document.body)
  }, [portalContainer])

  // Keep the popup inside the viewport as it resizes / fullscreen toggles.
  useEffect(() => {
    setGeom(clampToViewport)
  }, [isFullscreen])

  const toggleMinimized = () => {
    setMinimized((prev) => {
      if (!prev) {
        // Entering minimized: remember the current geometry, snap to the
        // bottom-right corner at a fixed, header-only size.
        restoreGeomRef.current = geom
        const bw = window.innerWidth
        const bh = window.innerHeight
        setGeom({
          x: bw - MINIMIZED_WIDTH - PANEL_MARGIN,
          y: bh - MINIMIZED_HEIGHT - PANEL_MARGIN,
          w: MINIMIZED_WIDTH,
          h: MINIMIZED_HEIGHT,
        })
      } else {
        setGeom(clampToViewport(restoreGeomRef.current ?? defaultGeom()))
      }
      return !prev
    })
  }

  useEffect(() => {
    const onResize = () => setGeom(clampToViewport)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const beginGesture =
    (kind: Gesture['kind'], corner?: Corner) => (e: ReactPointerEvent) => {
      e.preventDefault()
      if (kind === 'resize') e.stopPropagation()
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      gestureRef.current = {
        kind,
        corner,
        startX: e.clientX,
        startY: e.clientY,
        x: geom.x,
        y: geom.y,
        w: geom.w,
        h: geom.h,
      }
      setInteracting(true)
    }

  const onPointerMove = (e: ReactPointerEvent) => {
    const g = gestureRef.current
    if (!g) return
    const bw = window.innerWidth
    const bh = window.innerHeight
    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY

    if (g.kind === 'drag') {
      setGeom((prev) => ({
        ...prev,
        x: clamp(g.x + dx, 0, bw - g.w),
        y: clamp(g.y + dy, 0, bh - g.h),
      }))
      return
    }

    const corner = g.corner ?? 'se'
    const hasN = corner[0] === 'n'
    const hasS = corner[0] === 's'
    const hasW = corner[1] === 'w'
    const hasE = corner[1] === 'e'
    let { x, y, w, h } = g
    if (hasE) w = clamp(g.w + dx, MIN_WIDTH, bw - g.x)
    if (hasS) h = clamp(g.h + dy, MIN_HEIGHT, bh - g.y)
    if (hasW) {
      x = clamp(g.x + dx, 0, g.x + g.w - MIN_WIDTH)
      w = g.x + g.w - x
    }
    if (hasN) {
      y = clamp(g.y + dy, 0, g.y + g.h - MIN_HEIGHT)
      h = g.y + g.h - y
    }
    setGeom({ x, y, w, h })
  }

  const endGesture = (e: ReactPointerEvent) => {
    if (!gestureRef.current) return
    gestureRef.current = null
    setInteracting(false)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* pointer already released */
    }
  }

  const gestureHandlers = {
    onPointerMove,
    onPointerUp: endGesture,
    onPointerCancel: endGesture,
  }

  // Nothing renders until the mount effect has run, so the surface is picked
  // once — mounting one and swapping to the other would reload the quiz iframe
  // underneath.
  if (!portalTarget) return null

  if (isMobile) {
    // Collapsed sheet: a pill above the mobile tab bar, the sheet's stand-in for
    // the panel's header-bar minimized state. Tapping it brings the sheet back.
    if (minimized) {
      return createPortal(
        <button
          type="button"
          aria-label="Restore"
          onClick={toggleMinimized}
          data-testid={testId}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-[210] flex max-w-[min(90vw,22rem)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-brand px-5 py-3 shadow-[0_4px_24px_rgba(17,24,39,0.28)]"
        >
          <span className="type-b1-md truncate text-brand-foreground">
            {title}
          </span>
          <CaretUp size={16} weight="bold" className="text-brand-foreground" />
        </button>,
        portalTarget,
      )
    }

    return (
      <BottomDrawer
        open
        title={title}
        // Same `data-testid` as the panel: automation finds the popup by one
        // selector whichever surface the viewport picked.
        testId={testId}
        // Swipe-down and the header button both collapse to the pill rather
        // than closing — the popup has no dismiss on either surface.
        onClose={toggleMinimized}
        closeIcon={<CaretDown size={18} weight="bold" />}
        closeLabel="Minimize"
        // Same fullscreen reasoning as the panel's portal — see `portalContainer`.
        container={portalContainer}
        // A definite height, not just `max-h`: the quiz iframe sizes itself with
        // `h-full`, which collapses to nothing inside a content-height sheet.
        className="h-[85svh]"
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden px-0 pb-0"
      >
        <div className="relative min-h-0 flex-1 bg-surface-muted">
          {children({ interacting: false })}
          {overlay}
        </div>
        {footer != null ? (
          <div className="shrink-0 border-t border-border bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </BottomDrawer>
    )
  }

  const panelStyle: CSSProperties = {
    left: geom.x,
    top: geom.y,
    width: geom.w,
    height: geom.h,
  }

  return createPortal(
    <div
      className="fixed z-[1000] flex flex-col overflow-hidden rounded-xl border border-brand bg-surface shadow-2xl"
      style={panelStyle}
      role="dialog"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {/* Brand-filled in both states: collapsed to a bare header bar it would
          otherwise read as just another white card floating over the page (the
          chat composer sits right there), and keeping the fill while expanded
          means the popup looks like one object either way. */}
      <header
        onPointerDown={beginGesture('drag')}
        {...gestureHandlers}
        className="flex cursor-move select-none items-center justify-between gap-2 bg-brand px-5 py-3 text-brand-foreground"
      >
        {/* `text-brand-foreground` has to sit on the element itself: the
            `type-*` classes declare their own `color`, which beats anything
            inherited from the header. */}
        <p className="type-b1-md truncate text-brand-foreground">{title}</p>
        <button
          type="button"
          aria-label={minimized ? 'Restore' : 'Minimize'}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleMinimized}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-brand-foreground/15"
        >
          {minimized ? (
            <CaretUp size={16} weight="bold" />
          ) : (
            <CaretDown size={16} weight="bold" />
          )}
        </button>
      </header>

      {/* CSS-hidden rather than unmounted while minimized, so content like a
          quiz iframe keeps its state and doesn't reload on restore. */}
      <div
        className={cn(
          'relative flex-1 bg-surface-muted',
          minimized && 'hidden',
        )}
      >
        {children({ interacting })}
        {overlay}
      </div>

      {footer != null && !minimized ? (
        <div className="shrink-0 border-t border-border bg-surface px-4 py-3">
          {footer}
        </div>
      ) : null}

      {/* Resize handles — one per corner. Hidden while minimized. */}
      {!minimized &&
        RESIZE_HANDLES.map(({ corner, className }) => (
          <div
            key={corner}
            onPointerDown={beginGesture('resize', corner)}
            {...gestureHandlers}
            className={cn('absolute z-10 h-4 w-4 touch-none', className)}
            aria-hidden
          />
        ))}
    </div>,
    portalTarget,
  )
}
