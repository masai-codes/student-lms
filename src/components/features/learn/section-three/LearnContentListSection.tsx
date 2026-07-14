import type { CSSProperties } from 'react'
import type { LearnContentItem } from '../shared/types'
import { LearnContentCard } from './content-card/LearnContentCard'

/** Cap the cascade so long lists don't keep late rows invisible for seconds. */
const MAX_STAGGER_STEPS = 8

export function LearnContentListSection({
  items,
}: {
  items: LearnContentItem[]
}) {
  if (!items.length) {
    return (
      <section className="my-[20px] rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        <span className="animate-dash-pop mb-2 block text-2xl" aria-hidden>
          🔍
        </span>
        No items match your current selection.
      </section>
    )
  }

  return (
    <section className="mt-[16px] space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="dash-lift animate-dash-row-in rounded-[8px]"
          style={
            {
              '--dash-delay': `${Math.min(index, MAX_STAGGER_STEPS) * 0.05}s`,
            } as CSSProperties
          }
        >
          <LearnContentCard item={item} />
        </div>
      ))}
    </section>
  )
}
