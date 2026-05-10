import type { LearnContentItem } from '../shared/types'
import { LearnContentCard } from './content-card/LearnContentCard'

interface LearnContentListSectionProps {
  items: LearnContentItem[]
}

export function LearnContentListSection({
  items,
}: LearnContentListSectionProps) {
  if (!items.length) {
    return (
      <section className="my-[20px] rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No items match your current selection.
      </section>
    )
  }

  return (
    <section className="mt-[16px] space-y-3">
      {items.map((item) => (
        <LearnContentCard key={item.id} item={item} />
      ))}
    </section>
  )
}
