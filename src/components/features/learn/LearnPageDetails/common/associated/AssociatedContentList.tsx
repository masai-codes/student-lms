'use client'

import {
  ASSOCIATED_CONTENT_KIND_ORDER,
  ASSOCIATED_CONTENT_SECTION_LABELS,
} from './associatedContentLabels'

import type { LearningItem } from '@/server/learn/types'
import { cn } from '@/lib/utils'
import { LearnContentCard } from '@/components/features/learn/section-three/content-card/LearnContentCard'
import { mapLearningItemToContent } from '@/components/features/learn/shared/mapLearningItemToContent'

type AssociatedContentListProps = {
  items: Array<LearningItem>
  className?: string
}

// Renders associated content with the exact `/learn` listing card, grouped into
// the same Lectures / Resources / Assignments sections.
export function AssociatedContentList({
  items,
  className,
}: AssociatedContentListProps) {
  if (items.length === 0) return null

  return (
    <div
      className={cn('flex flex-col gap-6', className)}
      data-testid="learn-associated-content-list"
    >
      {ASSOCIATED_CONTENT_KIND_ORDER.map(kind => {
        const sectionItems = items.filter(item => item.learningType === kind)
        if (sectionItems.length === 0) return null

        return (
          <section key={kind} data-testid={`learn-associated-section-${kind}`}>
            <h3 className="type-s1-md mb-3 text-gray-900">
              {ASSOCIATED_CONTENT_SECTION_LABELS[kind]}
            </h3>
            <div className="flex flex-col gap-3">
              {sectionItems.map(item => (
                <LearnContentCard
                  key={item.id}
                  item={mapLearningItemToContent(item)}
                  isAssociatedCard
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
