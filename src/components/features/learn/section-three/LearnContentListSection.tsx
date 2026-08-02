import type { LearnContentItem } from '../shared/types'
import { LearnContentCard } from './content-card/LearnContentCard'

export function LearnContentListSection({
  items,
}: {
  items: LearnContentItem[]
}) {
  if (!items.length) {
    return (
      <section
        data-testid="learn-content-list-empty"
        className="my-[20px] rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
      >
        <span className="animate-dash-pop mb-2 block text-2xl" aria-hidden>
          🔍
        </span>
        No items match your current selection.
      </section>
    )
  }

  return (
    <section data-testid="learn-content-list" className="mt-[16px] space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          // Stable automation hook per row, keyed by content type so suites can
          // target e.g. [data-testid="lecture-list-item"]. See CLAUDE.md →
          // Automation Test Hooks and the `browser-verify` skill.
          data-testid={`${item.type}-list-item`}
          data-content-id={item.id}
          className="rounded-xl"
        >
          <LearnContentCard item={item} />
        </div>
      ))}
    </section>
  )
}
