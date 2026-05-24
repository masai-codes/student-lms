'use client'

import { Lock } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type LearnDetailFullWidthBannerProps = {
  title: string
  children: ReactNode
  className?: string
  testId?: string
}

/** Full-width status banner above the main/aside detail grid (e.g. locked / not started). */
export function LearnDetailFullWidthBanner({
  title,
  children,
  className,
  testId,
}: LearnDetailFullWidthBannerProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 md:py-3.5',
        className,
      )}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-500 p-2.5 md:size-[72px] md:p-5"
        aria-hidden
      >
        <Lock weight="duotone" className="size-5 text-white md:size-8" />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="type-h6 text-gray-900">{title}</h2>
        <p className="type-b2-regular text-gray-600">{children}</p>
      </div>
    </div>
  )
}
