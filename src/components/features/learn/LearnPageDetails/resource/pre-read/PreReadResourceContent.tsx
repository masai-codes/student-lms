'use client'

import { ResourceDetailLayout } from '../shared/ResourceDetailLayout'
import { ResourceOpenPhaseMain } from '../shared/ResourceOpenPhaseMain'
import { ResourcePhaseContent } from '../shared/ResourcePhaseContent'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type PreReadResourceContentProps = {
  detail: ResourceDetailPayload
}

function renderPreReadMain(detail: ResourceDetailPayload) {
  if (detail.phase === 'before') {
    return <ResourcePhaseContent content={detail.phaseContent} />
  }
  return <ResourceOpenPhaseMain detail={detail} />
}

export function PreReadResourceContent({ detail }: PreReadResourceContentProps) {
  return <ResourceDetailLayout detail={detail} main={renderPreReadMain(detail)} />
}
