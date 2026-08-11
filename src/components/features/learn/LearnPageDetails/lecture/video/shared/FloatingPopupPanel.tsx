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
/**
 * Movement (px) past which a press on the mobile pill is a drag rather than a
 * tap. A finger never holds perfectly still, so without a slop every tap would
 * nudge the pill and swallow the restore.
 */
const PILL_DRAG_SLOP = 6

type Corner = 'nw' | 'ne' | 'sw' | 'se'

/** Panel position (top-left) + size, in px within the viewport. */
type Geom = { x: number; y: number; w: number; h: number }

/** Mobile pill position (top-left), in px within the viewport. */
type Point = { x: number; y: number }

/** Live drag of the mobile pill, captured at pointer-down. */
type PillGesture = Point & {
  startX: number
  startY: number
  w: number
  h: number
  /** Whether the pointer has travelled past {@link PILL_DRAG_SLOP}. */
  moved: boolean
}

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

/**
 * Keep the dragged pill inside the viewport. Its size is content-driven (the
 * title can be any length), so it's measured off the live element rather than
 * carried in state.
 */
function clampPillToViewport(pos: Point, el: HTMLElement | null): Point {
  const w = el?.offsetWidth ?? 0
  const h = el?.offsetHeight ?? 0
  return {
    x: clamp(pos.x, PANEL_MARGIN, window.innerWidth - w - PANEL_MARGIN),
    y: clamp(pos.y, PANEL_MARGIN, window.innerHeight - h - PANEL_MARGIN),
  }
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
 * one of two things, decided by `useIsMobileViewport` — a phone-sized viewport,
 * measured on its short edge so that fullscreen's landscape lock doesn't flip a
 * phone onto the tablet surface mid-lecture:
 *
 * - **tablet and up** — a non-blocking floating panel: portaled (to
 *   `portalContainer`, see above), `position: fixed`, dragged by the header and
 *   resized from any corner (pointer capture keeps the gesture alive over
 *   cross-origin content), collapsible to its header bar. A tablet has room for
 *   it, and the embedded quiz keeps its wide layout.
 * - **phones** — a {@link BottomDrawer} bottom sheet. A resizable floating panel
 *   on a phone screen is pointless and would sit on top of the mobile tab bar;
 *   the sheet is the pattern the rest of the app already uses at this width.
 *   Collapsing it leaves a pill centered above that tab bar, in place of the
 *   panel's minimized header bar. That pill is draggable anywhere in the
 *   viewport, the same as the panel's header bar — tap to restore, drag to move.
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
  // Mobile pill only. `null` means "wherever the default classes put it";
  // dragging pins it to explicit viewport coordinates instead. It survives a
  // restore/re-minimize round trip on purpose — the user parked it there.
  const [pillPos, setPillPos] = useState<Point | null>(null)
  const pillRef = useRef<HTMLButtonElement | null>(null)
  const pillGestureRef = useRef<PillGesture | null>(null)
  // Whether the press that's about to produce a `click` was a drag.
  const pillDraggedRef = useRef(false)

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
    const onResize = () => {
      setGeom(clampToViewport)
      setPillPos((prev) =>
        prev ? clampPillToViewport(prev, pillRef.current) : prev,
      )
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const beginPillDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // Pointer capture keeps the drag alive when the finger slides over the
    // video (or a cross-origin iframe) underneath.
    e.currentTarget.setPointerCapture(e.pointerId)
    pillDraggedRef.current = false
    pillGestureRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      // Read off the rendered box: until the first drag the pill is positioned
      // by classes, so there are no coordinates in state to start from.
      x: rect.left,
      y: rect.top,
      w: rect.width,
      h: rect.height,
      moved: false,
    }
  }

  const onPillPointerMove = (e: ReactPointerEvent) => {
    const g = pillGestureRef.current
    if (!g) return
    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY
    if (!g.moved && Math.hypot(dx, dy) < PILL_DRAG_SLOP) return
    g.moved = true
    setPillPos(
      clampPillToViewport({ x: g.x + dx, y: g.y + dy }, pillRef.current),
    )
  }

  const endPillDrag = (e: ReactPointerEvent) => {
    const g = pillGestureRef.current
    if (!g) return
    pillGestureRef.current = null
    pillDraggedRef.current = g.moved
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* pointer already released */
    }
  }

  const onPillClick = () => {
    // A drag ends in a `click` as well; only a tap should restore the sheet.
    // Keyboard activation never sets the flag, so Enter/Space still restores.
    if (pillDraggedRef.current) {
      pillDraggedRef.current = false
      return
    }
    toggleMinimized()
  }

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

  // Nothing renders until the mount effect has run — the portal has no target
  // before then. Note `isMobile` stays live afterwards: crossing the breakpoint
  // swaps surfaces, and since these are different component types React
  // remounts the subtree, reloading the quiz iframe. Fullscreen already
  // remounts deliberately (callers key on it), and the short-edge breakpoint
  // means plain rotation no longer crosses it on a phone.
  if (!portalTarget) return null

  if (isMobile) {
    // Collapsed sheet: a pill above the mobile tab bar, the sheet's stand-in for
    // the panel's header-bar minimized state. Tapping it brings the sheet back;
    // dragging moves it, so it can be parked off whatever it's covering (it
    // starts centered over the video's own controls).
    if (minimized) {
      return createPortal(
        <button
          type="button"
          ref={pillRef}
          aria-label="Restore"
          onPointerDown={beginPillDrag}
          onPointerMove={onPillPointerMove}
          onPointerUp={endPillDrag}
          onPointerCancel={endPillDrag}
          onClick={onPillClick}
          data-testid={testId}
          // `touch-none`: without it the browser claims the gesture as a page
          // scroll and the pill never sees the moves.
          style={pillPos ? { left: pillPos.x, top: pillPos.y } : undefined}
          className={cn(
            'fixed z-[210] flex max-w-[min(90vw,22rem)] touch-none cursor-grab select-none items-center gap-3 rounded-2xl bg-brand px-5 py-3 shadow-[0_4px_24px_rgba(17,24,39,0.28)] active:cursor-grabbing',
            // Default placement. Portrait clears the mobile tab bar. Landscape
            // is the fullscreen player instead (the orientation lock puts it
            // there), where 4.5rem would sit right on the progress track — so
            // drop to the player chrome's own bottom padding, which lands the
            // pill in the empty middle of the button row. Both use the same
            // `max(0.5rem, safe-area)` as the chrome, so they shift together on
            // a notched device and the ~13px gap to the visible bar holds.
            !pillPos &&
              'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 landscape:bottom-[max(0.5rem,env(safe-area-inset-bottom))]',
          )}
        >
          <span className="type-b1-md truncate text-brand-foreground">
            {title}
          </span>
          {/* A `span`, not a nested `button` — the whole pill is already the
              button. It's styled as a circular one purely so the chevron reads
              as a tappable affordance rather than decoration. */}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-foreground/20">
            <CaretUp
              size={16}
              weight="bold"
              className="text-brand-foreground"
            />
          </span>
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
          // Circular and filled at rest, matching the pill's chevron — a
          // hover-only background left it reading as decoration on first look.
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-foreground/20 transition-colors hover:bg-brand-foreground/35"
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
