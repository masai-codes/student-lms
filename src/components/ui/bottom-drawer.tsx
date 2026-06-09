'use client'

import { X } from '@phosphor-icons/react'
import { Drawer } from 'vaul'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type BottomDrawerProps = {
  /** Whether the drawer is open. */
  open: boolean
  /** Called when the drawer should close (swipe down, overlay click, escape, close button). */
  onClose?: () => void
  /** Optional heading shown next to the close button. */
  title?: string
  /** Drawer body content. */
  children: ReactNode
  /** Extra classes for the sheet container. */
  className?: string
  /** Extra classes for the scrollable body. */
  bodyClassName?: string
}

/**
 * Reusable mobile bottom sheet, built on `vaul` for native-feeling, swipeable
 * behaviour: the user can flick/drag it down to dismiss, it follows the finger,
 * and it animates back into place on release. Floats over the page content
 * (above the mobile tab bar) with an internal scroll area, a grab handle, and a
 * header.
 *
 * It is presentation-only: pass the same content you would render on desktop —
 * the caller decides when to use this vs. an inline/side panel.
 */
export default function BottomDrawer({
  open,
  onClose,
  title,
  children,
  className,
  bodyClassName,
}: BottomDrawerProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.()
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[215] bg-black/50" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-[220] flex max-h-[88svh] flex-col rounded-t-2xl border-t border-[#E5E7EB] bg-white font-poppins shadow-[0_-8px_24px_rgba(17,24,39,0.12)] outline-none',
            className,
          )}
        >
          {/* Swipe handle — vaul makes the whole content draggable; this is the
              visual affordance. */}
          <div className="flex shrink-0 cursor-grab justify-center pt-2.5 active:cursor-grabbing">
            <Drawer.Handle className="!h-1 !w-10 !bg-[#E5E7EB]" />
          </div>

          <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-3">
            <Drawer.Title className="text-[15px] font-bold text-[#111827]">
              {title ?? ''}
            </Drawer.Title>
            <Drawer.Close
              aria-label="Close"
              className="flex size-8 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
            >
              <X size={18} />
            </Drawer.Close>
          </div>

          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1rem,env(safe-area-inset-bottom))]',
              bodyClassName,
            )}
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
