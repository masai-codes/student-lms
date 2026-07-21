'use client'

import { ResourceBodyContent } from './ResourceBodyContent'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type ResourceOpenPhaseMainProps = {
  detail: ResourceDetailPayload
}

export function ResourceOpenPhaseMain({ detail }: ResourceOpenPhaseMainProps) {
  return <ResourceBodyContent detail={detail} />
}
