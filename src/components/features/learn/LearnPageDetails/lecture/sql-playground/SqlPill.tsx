import { Database } from '@phosphor-icons/react'

import { askAiPillClass } from '@/components/features/lecture-ai-chat/components/AskAiPill'

/**
 * Same glass-pill visual as the "Ask AI" launcher (see `AskAiPill`) so the two
 * feel like siblings in the video toolbar — just a different icon/label.
 */
export const sqlPillClass = askAiPillClass

/** Inner contents (gloss + icon + label). Needs `group` and a positioning
 *  context on the button — both are in {@link sqlPillClass}. */
export function SqlPillContent() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent"
      />
      <Database
        className="relative size-4 text-[#A5B4FC] transition-transform duration-200 group-hover:scale-110"
        weight="fill"
        aria-hidden
      />
      {/* Icon-only on phones (compact toolbar); labelled from `sm` up. */}
      <span className="relative hidden sm:inline">SQL</span>
    </>
  )
}
