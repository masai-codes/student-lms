'use client'

import { ResourceDetailLayout } from '../shared/ResourceDetailLayout'
import { ResourceOpenPhaseMain } from '../shared/ResourceOpenPhaseMain'
import { ResourcePhaseContent } from '../shared/ResourcePhaseContent'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type MaterialResourceContentProps = {
  detail: ResourceDetailPayload
}

function renderMaterialMain(detail: ResourceDetailPayload) {
  if (detail.phase === 'before') {
    return <ResourcePhaseContent content={detail.phaseContent} />
  }
  return <ResourceOpenPhaseMain detail={detail} />
}

export function MaterialResourceContent({
  detail,
}: MaterialResourceContentProps) {
  return (
    <ResourceDetailLayout detail={detail} main={renderMaterialMain(detail)} />
  )
}
