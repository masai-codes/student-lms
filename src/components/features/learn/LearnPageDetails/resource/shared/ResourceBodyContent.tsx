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
    <section data-testid="resource-body">
      <h2 className="type-h6 text-gray-900">Description</h2>
      <MarkdownContent
        value={detail.body}
        variant="detail"
        className="type-b2-regular mt-3 text-gray-700"
      />
    </section>
  )
}
