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
}

export function LectureStatePanel({
  icon = 'clock',
  title,
  description,
  action,
  className,
}: LectureStatePanelProps) {
  const Icon = icon === 'video' ? VideoCamera : Clock

  return (
    <div
      className={cn(
        'flex min-h-[min(52vh,420px)] w-full flex-col items-center justify-center gap-4 bg-muted/30 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-7" weight="duotone" aria-hidden />
      </span>
      <div className="max-w-md space-y-2">
        <h2 className="type-h5 text-gray-900">{title}</h2>
        <div className="type-b2-regular text-gray-600">{description}</div>
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
