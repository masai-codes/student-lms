'use client'

import { ResourceOpenPhaseMain } from '../shared/ResourceOpenPhaseMain'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type DuringMaterialResourceProps = {
  detail: ResourceDetailPayload
}

export function DuringMaterialResource({ detail }: DuringMaterialResourceProps) {
  return <ResourceOpenPhaseMain kind="material" phase="during" detail={detail} />
}
