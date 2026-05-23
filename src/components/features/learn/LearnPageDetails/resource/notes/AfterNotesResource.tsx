'use client'

import { ResourceOpenPhaseMain } from '../shared/ResourceOpenPhaseMain'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type AfterNotesResourceProps = {
  detail: ResourceDetailPayload
}

export function AfterNotesResource({ detail }: AfterNotesResourceProps) {
  return <ResourceOpenPhaseMain kind="notes" phase="after" detail={detail} />
}
