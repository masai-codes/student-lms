'use client'

import { ResourceDetailLayout } from '../shared/ResourceDetailLayout'
import { ResourceOpenPhaseMain } from '../shared/ResourceOpenPhaseMain'
import { ResourcePhaseContent } from '../shared/ResourcePhaseContent'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type NotesResourceContentProps = {
  detail: ResourceDetailPayload
}

function renderNotesMain(detail: ResourceDetailPayload) {
  if (detail.phase === 'before') {
    return <ResourcePhaseContent content={detail.phaseContent} />
  }
  return <ResourceOpenPhaseMain detail={detail} />
}

export function NotesResourceContent({ detail }: NotesResourceContentProps) {
  return <ResourceDetailLayout detail={detail} main={renderNotesMain(detail)} />
}
