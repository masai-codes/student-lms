'use client'

import { ResourceOpenPhaseMain } from '../shared/ResourceOpenPhaseMain'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type AfterMaterialResourceProps = {
  detail: ResourceDetailPayload
}

export function AfterMaterialResource({ detail }: AfterMaterialResourceProps) {
  return <ResourceOpenPhaseMain kind="material" phase="after" detail={detail} />
}
