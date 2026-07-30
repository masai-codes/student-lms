'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CaretUp, Minus } from '@phosphor-icons/react'

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
}

/**
 * Non-blocking, draggable/resizable popup panel shared by in-lecture quiz and
 * poll modals. Portaled (to `portalContainer`, see above) and positioned with
 * `position: fixed` so it renders as a compact floating popup that can be
 * dragged/resized anywhere on the page.
 *
 * Drag by the header; resize from any corner (pointer capture keeps the
 * gesture alive over cross-origin content). Opening/closing by playback
 * window is owned by the caller's hook.
 */
export function FloatingPopupPanel({
  title,
  ariaLabel,
  testId,
  isFullscreen,
  portalContainer,
  children,
  overlay,
}: FloatingPopupPanelProps) {
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

  if (!portalTarget) return null

  const panelStyle: CSSProperties = {
    left: geom.x,
    top: geom.y,
    width: geom.w,
    height: geom.h,
  }

  return createPortal(
    <div
      className="fixed z-[1000] flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      style={panelStyle}
      role="dialog"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      <header
        onPointerDown={beginGesture('drag')}
        {...gestureHandlers}
        className={cn(
          'flex cursor-move select-none items-center justify-between gap-2 px-5 py-3',
          !minimized && 'border-b border-border',
        )}
      >
        <p className="type-b1-md truncate text-foreground">{title}</p>
        <button
          type="button"
          aria-label={minimized ? 'Restore' : 'Minimize'}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleMinimized}
          className={cn(
            'group flex h-3.5 w-3.5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/10 transition-[filter] hover:brightness-95 active:brightness-90',
            minimized ? 'bg-[#28C840]' : 'bg-[#FEBC2E]',
          )}
        >
          {minimized ? (
            <CaretUp
              size={9}
              weight="bold"
              className="text-[#0E5C1D] opacity-0 group-hover:opacity-100"
            />
          ) : (
            <Minus
              size={9}
              weight="bold"
              className="text-[#985712] opacity-0 group-hover:opacity-100"
            />
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
