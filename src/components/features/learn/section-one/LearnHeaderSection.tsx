import { MessagesSquare } from 'lucide-react'
import { LearnBatchSwitcher } from './LearnBatchSwitcher'
import { Link, getRouteApi } from '@tanstack/react-router'
import { useSelectedLearnBatchId } from '@/hooks/useSelectedLearnBatchId'

const layoutRouteApi = getRouteApi('/(protected)/_layout')

export function LearnHeaderSection() {
  const { user } = layoutRouteApi.useRouteContext()
  const batchId = useSelectedLearnBatchId(user.id)

  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between layout-gutter-x">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {/* Program picker: compact pill/dropdown style, inline only on mobile
            (no Tier 2 nav there yet) — desktop gets the same compact navbar
            version below, portaled into the navbar's Tier 2 row. Always
            rendered, even for a single enrolled program. A Discussions link
            sits alongside it on mobile since there's no Tier 2 row to host
            it there (desktop's Discussions lives in the navbar's Tier 2). */}
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <LearnBatchSwitcher compact />
          <Link
            to="/learn/discussions"
            search={batchId != null ? { batchId } : {}}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-brand"
          >
            <MessagesSquare className="size-4" aria-hidden />
            <span className="hidden">Discussions</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
