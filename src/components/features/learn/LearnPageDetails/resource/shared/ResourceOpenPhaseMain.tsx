'use client'

import { ResourceBodyContent } from './ResourceBodyContent'
import { ResourcePhaseContent } from './ResourcePhaseContent'

import type {
  ResourceDetailPayload,
  ResourceKind,
  ResourcePhase,
} from '@/server/learn/resourceDetailTypes'

type ResourceOpenPhaseMainProps = {
  kind: ResourceKind
  phase: Extract<ResourcePhase, 'during' | 'after'>
  detail: ResourceDetailPayload
}

export function ResourceOpenPhaseMain({
  kind,
  phase,
  detail,
}: ResourceOpenPhaseMainProps) {
  return (
    <div className="flex flex-col gap-6">
      <ResourcePhaseContent kind={kind} phase={phase} schedule={detail.schedule} />
      <ResourceBodyContent detail={detail} />
    </div>
  )
}
