'use client'

import { AfterMaterialResource } from './AfterMaterialResource'
import { BeforeMaterialResource } from './BeforeMaterialResource'
import { DuringMaterialResource } from './DuringMaterialResource'
import { ResourceDetailLayout } from '../shared/ResourceDetailLayout'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type MaterialResourceContentProps = {
  detail: ResourceDetailPayload
}

function renderMaterialMain(detail: ResourceDetailPayload) {
  switch (detail.phase) {
    case 'before':
      return <BeforeMaterialResource schedule={detail.schedule} />
    case 'during':
      return <DuringMaterialResource detail={detail} />
    case 'after':
      return <AfterMaterialResource detail={detail} />
    default:
      return <BeforeMaterialResource schedule={detail.schedule} />
  }
}

export function MaterialResourceContent({ detail }: MaterialResourceContentProps) {
  return <ResourceDetailLayout detail={detail} main={renderMaterialMain(detail)} />
}
