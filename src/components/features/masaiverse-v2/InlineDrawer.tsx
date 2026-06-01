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

/**
 * Reusable docs-style inline drawer. Instead of overlaying, the panel pushes
 * in from the right and the main content shrinks to make room (animated).
 * Pass whatever you want to render via the `panel` prop.
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
      <div
        className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${
          open ? 'border-l border-[#E5E7EB] bg-white' : ''
        }`}
        style={{ width: open ? panelWidth : 0 }}
        aria-hidden={!open}
      >
        <div
          className="sticky top-[100px] max-h-[calc(100vh-120px)] overflow-y-auto px-5 py-1"
          style={{ width: panelWidth }}
        >
          {onClose ? (
            <div className="mb-3 flex items-center justify-between">
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
          {panel}
        </div>
      </div>
    </div>
  )
}
