'use client'

import { learnDetailChipPalette } from './learnDetailChipPalette'
import type { LearningPriority } from '@/server/learn/types'
import type { ReactNode } from 'react'
import { formatLearnDetailPriorityLabel } from '@/server/learn/utils/formatLearnDetailDisplay'

import { MasaiChips } from '@/components/ui/masai-chips'
import { cn } from '@/lib/utils'

type LearnDetailMetaCardProps = {
  hostName: string
  displayDate: string
  priority: LearningPriority
  tags: Array<string>
  className?: string
  /** Extra chips rendered after the priority chip. */
  trailingChips?: ReactNode
}

/** Single row (wraps): host • date alongside tag chips — no border/card. */
export function LearnDetailMetaCard({
  hostName,
  displayDate,
  priority,
  tags,
  className,
  trailingChips,
}: LearnDetailMetaCardProps) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2',
        className,
      )}
    >
      <p className="type-t1 shrink-0 text-gray-600">
        <span className="text-gray-900">{hostName}</span>
        <span
          className="mx-2 inline-block size-1 rounded-full bg-gray-600 align-middle"
          aria-hidden
        />
        <span>{displayDate}</span>
      </p>
      {tags.map((tag, index) => (
        <MasaiChips
          key={`${tag}-${index}`}
          type="default"
          size="regular"
          label={tag}
          tabIndex={-1}
          className="cursor-default"
          {...learnDetailChipPalette}
        />
      ))}
      <MasaiChips
        type="default"
        size="regular"
        label={formatLearnDetailPriorityLabel(priority)}
        tabIndex={-1}
        className="cursor-default"
        {...learnDetailChipPalette}
      />
      {trailingChips}
    </div>
  )
}
