'use client'

import { learnDetailChipPalette } from './learnDetailChipPalette'
import type { LearningPriority } from '@/server/learn/types'

import { MasaiChips } from '@/components/ui/masai-chips'


type LearnDetailMetaCardProps = {
  hostName: string
  displayDate: string
  priority: LearningPriority
  tags: Array<string>
}

export function LearnDetailMetaCard({
  hostName,
  displayDate,
  priority,
  tags,
}: LearnDetailMetaCardProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="type-t1 text-gray-600">
        <span className="text-gray-900">{hostName}</span>
        <span
          className="mx-2 inline-block size-1 rounded-full bg-gray-600 align-middle"
          aria-hidden
        />
        <span>{displayDate}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
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
          label={priority}
          tabIndex={-1}
          className="cursor-default"
          {...learnDetailChipPalette}
        />
      </div>
    </section>
  )
}
