'use client'

import { LectureTheaterModeIcon } from './LectureTheaterModeIcon'

import { cn } from '@/lib/utils'

type LectureTheaterModeToggleProps = {
  isTheaterMode: boolean
  onToggle: () => void
  className?: string
}

/** YouTube-style theater control: icon-only, highlighted when theater mode is on. */
export function LectureTheaterModeToggle({
  isTheaterMode,
  onToggle,
  className,
}: LectureTheaterModeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isTheaterMode}
      aria-label={
        isTheaterMode
          ? 'Theater mode on — switch to split view with chat'
          : 'Theater mode'
      }
      title={
        isTheaterMode
          ? 'Theater mode (click for video + chat split)'
          : 'Theater mode'
      }
      className={cn(
        'lecture-theater-mode-toggle',
        'flex size-9 shrink-0 items-center justify-center rounded-full',
        'text-white transition-colors',
        'hover:bg-white/20',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80',
        isTheaterMode && 'lecture-theater-mode-toggle--active',
        className,
      )}
    >
      <LectureTheaterModeIcon isTheaterMode={isTheaterMode} />
    </button>
  )
}
