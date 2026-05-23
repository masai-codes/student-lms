'use client'

import { AfterPreReadResource } from './AfterPreReadResource'
import { BeforePreReadResource } from './BeforePreReadResource'
import { DuringPreReadResource } from './DuringPreReadResource'
import { ResourceDetailLayout } from '../shared/ResourceDetailLayout'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type PreReadResourceContentProps = {
  detail: ResourceDetailPayload
}

function renderPreReadMain(detail: ResourceDetailPayload) {
  switch (detail.phase) {
    case 'before':
      return <BeforePreReadResource schedule={detail.schedule} />
    case 'during':
      return <DuringPreReadResource detail={detail} />
    case 'after':
      return <AfterPreReadResource detail={detail} />
    default:
      return <BeforePreReadResource schedule={detail.schedule} />
  }
}

export function PreReadResourceContent({ detail }: PreReadResourceContentProps) {
  return <ResourceDetailLayout detail={detail} main={renderPreReadMain(detail)} />
}
