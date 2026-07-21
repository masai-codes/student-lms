'use client'

import { Clock, VideoCamera } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type LectureStatePanelProps = {
  icon?: 'clock' | 'video'
  title: string
  description: ReactNode
  action?: ReactNode
  className?: string
  /**
   * Render on a black, video-player-style backdrop. Applies the `midnight`
   * dark-theme token block to this subtree so the foreground/primary text
   * colors flip to light automatically, then paints the panel pure black.
   */
  dark?: boolean
}

export function LectureStatePanel({
  icon = 'clock',
  title,
  description,
  action,
  className,
  dark,
}: LectureStatePanelProps) {
  const Icon = icon === 'video' ? VideoCamera : Clock

  return (
    <div
      data-theme={dark ? 'midnight' : undefined}
      className={cn(
        'flex min-h-[min(52vh,420px)] w-full flex-col items-center justify-center gap-4 px-6 py-12 text-center',
        dark ? 'dark bg-black' : 'bg-muted/30',
        className,
      )}
    >
      <span className="animate-dash-float flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-7" weight="duotone" aria-hidden />
      </span>
      <div className="animate-dash-rise max-w-md space-y-2">
        <h2 className="type-h5 text-foreground">{title}</h2>
        <div className="type-b2-regular text-foreground-muted">
          {description}
        </div>
      </div>
      {action ? (
        <div className="animate-dash-rise mt-2 [--dash-delay:0.08s]">
          {action}
        </div>
      ) : null}
    </div>
  )
}
