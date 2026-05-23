'use client'

import { AfterNotesResource } from './AfterNotesResource'
import { BeforeNotesResource } from './BeforeNotesResource'
import { DuringNotesResource } from './DuringNotesResource'
import { ResourceDetailLayout } from '../shared/ResourceDetailLayout'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type NotesResourceContentProps = {
  detail: ResourceDetailPayload
}

function renderNotesMain(detail: ResourceDetailPayload) {
  switch (detail.phase) {
    case 'before':
      return <BeforeNotesResource schedule={detail.schedule} />
    case 'during':
      return <DuringNotesResource detail={detail} />
    case 'after':
      return <AfterNotesResource detail={detail} />
    default:
      return <BeforeNotesResource schedule={detail.schedule} />
  }
}

export function NotesResourceContent({ detail }: NotesResourceContentProps) {
  return <ResourceDetailLayout detail={detail} main={renderNotesMain(detail)} />
}
