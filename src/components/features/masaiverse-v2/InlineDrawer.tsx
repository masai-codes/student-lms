import { X } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

type InlineDrawerProps = {
  /** Whether the right-hand panel is open. */
  open: boolean
  /** Content rendered inside the panel (e.g. the calendar). */
  panel: ReactNode
  /** Main content; shrinks to make room when the panel opens. */
  children: ReactNode
  /** Panel width in px when open. */
  panelWidth?: number
  /** When provided, a close button is shown at the top of the panel. */
  onClose?: () => void
  /** Optional heading shown next to the close button. */
  title?: string
}

/** Top offset (global nav height) so the panel sits below the top bar. */
const TOP_OFFSET = 72

/**
 * Reusable docs-style inline drawer. The main content shrinks to make room
 * (animated) while the panel itself is pinned to the viewport with
 * `position: fixed`, so it always opens anchored to the top — its header and
 * first items are visible no matter how far the page is scrolled — and scrolls
 * internally when its content is taller than the viewport.
 */
export default function InlineDrawer({
  open,
  panel,
  children,
  panelWidth = 340,
  onClose,
  title,
}: InlineDrawerProps) {
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
        className={`fixed right-0 z-30 flex flex-col border-l border-[#E5E7EB] bg-white shadow-[-8px_0_24px_rgba(17,24,39,0.06)] transition-transform duration-300 ease-out ${
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
            <span className="text-[15px] font-bold text-[#111827]">
              {title ?? ''}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="flex size-8 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
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
