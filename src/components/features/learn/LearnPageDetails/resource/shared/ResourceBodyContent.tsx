'use client'

import { MarkdownContent } from '@/components/shared/markdown-content'
import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type ResourceBodyContentProps = {
  detail: ResourceDetailPayload
}

export function ResourceBodyContent({ detail }: ResourceBodyContentProps) {
  if (detail.hideNotes || detail.body == null) {
    return null
  }

  return (
    <section data-testid="resource-body" className="animate-dash-rise">
      <h2 className="type-h6 inline-flex items-center gap-2 text-foreground">
        <span
          aria-hidden
          // Dark lands on the red brand — indigo/purple accents are light-only.
          className="h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#4F6BED] to-[#7C3AED] dark:bg-none dark:bg-brand"
        />
        Notes
      </h2>
      <MarkdownContent value={detail.body} variant="detail" className="mt-3" />
    </section>
  )
}
