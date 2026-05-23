'use client'

import { ResourceOpenPhaseMain } from '../shared/ResourceOpenPhaseMain'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type DuringNotesResourceProps = {
  detail: ResourceDetailPayload
}

export function DuringNotesResource({ detail }: DuringNotesResourceProps) {
  return <ResourceOpenPhaseMain kind="notes" phase="during" detail={detail} />
}
