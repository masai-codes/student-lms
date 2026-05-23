'use client'

import { ResourceOpenPhaseMain } from '../shared/ResourceOpenPhaseMain'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type DuringPreReadResourceProps = {
  detail: ResourceDetailPayload
}

export function DuringPreReadResource({ detail }: DuringPreReadResourceProps) {
  return <ResourceOpenPhaseMain kind="pre-read" phase="during" detail={detail} />
}
