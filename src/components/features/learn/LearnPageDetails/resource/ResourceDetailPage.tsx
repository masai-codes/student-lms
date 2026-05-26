'use client'

import { MaterialResourceContent } from './material/MaterialResourceContent'
import { NotesResourceContent } from './notes/NotesResourceContent'
import { PreReadResourceContent } from './pre-read/PreReadResourceContent'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

type ResourceDetailPageProps = {
  detail: ResourceDetailPayload
}

export function ResourceDetailPage({ detail }: ResourceDetailPageProps) {
  switch (detail.resourceKind) {
    case 'pre-read':
      return <PreReadResourceContent detail={detail} />
    case 'notes':
      return <NotesResourceContent detail={detail} />
    case 'material':
      return <MaterialResourceContent detail={detail} />
  }
}
