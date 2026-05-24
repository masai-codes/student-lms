'use client'

import { ResourceBodyContent } from './ResourceBodyContent'
import { ResourcePhaseContent } from './ResourcePhaseContent'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type ResourceOpenPhaseMainProps = {
  detail: ResourceDetailPayload
}

export function ResourceOpenPhaseMain({ detail }: ResourceOpenPhaseMainProps) {
  return (
    <div className="flex flex-col gap-6">
      <ResourcePhaseContent content={detail.phaseContent} />
      <ResourceBodyContent detail={detail} />
    </div>
  )
}
