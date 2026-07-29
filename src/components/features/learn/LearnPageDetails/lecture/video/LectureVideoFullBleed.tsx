'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type LectureVideoFullBleedProps = {
  children: ReactNode
  className?: string
  testId?: string
}

/** Full viewport-width video; breaks out of any centered content column. */
export function LectureVideoFullBleed({
  children,
  className,
  testId,
}: LectureVideoFullBleedProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'relative w-screen max-w-[100vw] shrink-0',
        'left-1/2 -translate-x-1/2',
        'flex flex-col bg-black',
        className,
      )}
    >
      <div className="flex h-full min-h-0 w-full flex-1 flex-col">
        {children}
      </div>
    </div>
  )
}
