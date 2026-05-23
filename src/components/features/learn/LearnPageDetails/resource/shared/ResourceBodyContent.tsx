'use client'

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
      <div className="type-b2-regular mt-3 whitespace-pre-wrap text-gray-700">
        {detail.body}
      </div>
    </section>
  )
}
