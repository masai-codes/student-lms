'use client'

import { Rectangle } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

type LectureTheaterModeToggleProps = {
  isTheaterMode: boolean
  onToggle: () => void
  className?: string
}

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
          : 'Switch to theater mode (full-width video)'
      }
      title={
        isTheaterMode
          ? 'Theater mode (click for video + chat split)'
          : 'Theater mode'
      }
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
        'bg-black/60 text-xs font-medium text-white backdrop-blur-sm',
        'transition-colors hover:bg-black/80',
        isTheaterMode && 'bg-white/20 ring-1 ring-white/50',
        className,
      )}
    >
      <Rectangle className="size-4" weight="bold" />
      <span className="hidden sm:inline">Theater</span>
    </button>
  )
}
