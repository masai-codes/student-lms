'use client'

import { ResourceOpenPhaseMain } from '../shared/ResourceOpenPhaseMain'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type AfterPreReadResourceProps = {
  detail: ResourceDetailPayload
}

export function AfterPreReadResource({ detail }: AfterPreReadResourceProps) {
  return <ResourceOpenPhaseMain kind="pre-read" phase="after" detail={detail} />
}
