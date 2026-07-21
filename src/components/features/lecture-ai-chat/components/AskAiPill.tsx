import { Sparkle } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

/**
 * Shared visual for the "Ask AI" launcher so the floating popup launcher and the
 * in-player controls pill read as exactly the same feature. Callers supply their
 * own positioning / display / open-close-state classes on top of this base.
 */
export const askAiPillClass = cn(
  'group relative h-11 items-center justify-center gap-2 overflow-hidden rounded-full px-4',
  // Elegant dark glass that stands out over both the page and the video.
  'border border-white/15 bg-neutral-900/80 text-sm font-medium text-white shadow-lg shadow-black/30 backdrop-blur-md',
  'transition-[transform,opacity,background-color] duration-300 ease-out motion-reduce:transition-none',
  'hover:bg-neutral-800/85 active:scale-[0.99]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
)

/** Inner contents (gloss + sparkle + label + hover sheen). Needs `group` and a
 *  positioning context on the button — both are in {@link askAiPillClass}. */
export function AskAiPillContent() {
  return (
    <>
      {/* Glassy top gloss behind the label. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent"
      />
      <Sparkle
        className="relative size-4 text-[#A5B4FC] transition-transform duration-200 group-hover:scale-110"
        weight="fill"
        aria-hidden
      />
      <span className="relative">Ask AI</span>
    </>
  )
}
