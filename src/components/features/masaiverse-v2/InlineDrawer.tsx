import { X } from '@phosphor-icons/react'
import { useEffect, useState, type ReactNode } from 'react'

import BottomDrawer from '@/components/ui/bottom-drawer'

type InlineDrawerProps = {
  /** Whether the panel is open. */
  open: boolean
  /** Content rendered inside the panel (e.g. the calendar). Shared across breakpoints. */
  panel: ReactNode
  /** Main content; shrinks to make room when the panel opens (desktop only). */
  children: ReactNode
  /** Panel width in px when open (desktop only; mobile uses a full-width bottom sheet). */
  panelWidth?: number
  /** When provided, a close button is shown at the top of the panel. */
  onClose?: () => void
  /** Optional heading shown next to the close button. */
  title?: string
}

/** Top offset (global nav height) so the desktop panel sits below the top bar. */
const TOP_OFFSET = 72

/** `md` breakpoint — desktop shows the inline side panel, mobile a bottom sheet. */
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'

/**
 * Tracks whether the viewport is at the desktop breakpoint. Mirrors the
 * `useResolvedDirection` pattern used by the card drawers. Defaults to `true`
 * so the (closed) desktop layout renders first; the panel itself is only
 * visible after a user action, so there is no mobile/desktop flash.
 */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true)
  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const sync = () => setIsDesktop(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener('change', sync)
    return () => mediaQuery.removeEventListener('change', sync)
  }, [])
  return isDesktop
}

/**
 * Reusable responsive drawer. The body content (`panel`) is identical across
 * breakpoints — only the presentation differs:
 *
 * - Desktop (≥768px): a docs-style inline side panel. The main content shrinks
 *   to make room (animated) while the panel is pinned to the viewport with
 *   `position: fixed`, so it always opens anchored to the top and scrolls
 *   internally when taller than the viewport.
 * - Mobile (<768px): a bottom sheet that floats over the content, avoiding the
 *   broken layout caused by a narrow fixed side panel on small screens.
 */
export default function InlineDrawer({
  open,
  panel,
  children,
  panelWidth = 340,
  onClose,
  title,
}: InlineDrawerProps) {
  const isDesktop = useIsDesktop()

  // Mobile: render content full-width and present the panel as a bottom sheet.
  if (!isDesktop) {
    return (
      <>
        {children}
        <BottomDrawer open={open} onClose={onClose} title={title}>
          {panel}
        </BottomDrawer>
      </>
    )
  }

  // Desktop: inline side panel that shrinks the main content.
  return (
    <div className={`flex w-full items-stretch ${open ? 'gap-6' : ''}`}>
      <div className="min-w-0 flex-1">{children}</div>

      {/* Reserves horizontal space so the content shrinks; the visible panel is
          fixed to the viewport (below) and slides over this reserved column. */}
      <div
        className="shrink-0 transition-[width] duration-300 ease-out"
        style={{ width: open ? panelWidth : 0 }}
        aria-hidden={!open}
      />

      <aside
        className={`fixed right-0 z-30 flex flex-col border-l border-border bg-surface shadow-[-8px_0_24px_rgba(17,24,39,0.06)] transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
        style={{
          top: TOP_OFFSET,
          width: panelWidth,
          height: `calc(100vh - ${TOP_OFFSET}px)`,
        }}
        aria-hidden={!open}
      >
        {onClose ? (
          <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
            <span className="text-[15px] font-bold text-foreground">
              {title ?? ''}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="flex size-8 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{panel}</div>
      </aside>
    </div>
  )
}
