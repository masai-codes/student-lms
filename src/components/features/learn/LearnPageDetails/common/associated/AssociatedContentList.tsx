'use client'

import { ChevronRight } from 'lucide-react'

import { getLearnAssociatedItemHref } from './getLearnAssociatedItemHref'
import {
  ASSOCIATED_CONTENT_KIND_ORDER,
  ASSOCIATED_CONTENT_SECTION_LABELS,
} from './associatedContentLabels'

import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import { cn } from '@/lib/utils'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

type AssociatedContentListProps = {
  items: Array<LearnAssociatedListItem>
  className?: string
}

function openAssociatedItem(item: LearnAssociatedListItem) {
  const href = getLearnAssociatedItemHref(item)
  window.open(href, '_blank', 'noopener,noreferrer')
}

export function AssociatedContentList({
  items,
  className,
}: AssociatedContentListProps) {
  if (items.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {ASSOCIATED_CONTENT_KIND_ORDER.map(kind => {
        const sectionItems = items.filter(item => item.kind === kind)
        if (sectionItems.length === 0) return null

        return (
          <section key={kind}>
            <h3 className="type-s1-md mb-3 text-gray-900">
              {ASSOCIATED_CONTENT_SECTION_LABELS[kind]}
            </h3>
            <ul className="flex flex-col gap-3">
              {sectionItems.map(item => (
                <li key={`${item.kind}-${item.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      pushLearnEvent(
                        learnEntityEvent(item.kind, 'associated_open', item.id),
                        {
                          content_id: item.id,
                          content_type: item.kind,
                          title: item.title,
                        },
                      )
                      openAssociatedItem(item)
                    }}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="type-b2-md truncate text-gray-900">
                        {item.title}
                      </p>
                      {item.meta ? (
                        <p className="type-t2 mt-1 text-gray-500">{item.meta}</p>
                      ) : null}
                    </div>
                    <ChevronRight
                      className="size-5 shrink-0 text-gray-400 group-hover:text-gray-700"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
