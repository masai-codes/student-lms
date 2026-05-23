'use client'

import { LearnEntityDetailLayout } from '../../common/layout/LearnEntityDetailLayout'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'
import type { ReactNode } from 'react'

type ResourceDetailLayoutProps = {
  detail: ResourceDetailPayload
  main: ReactNode
}

export function ResourceDetailLayout({ detail, main }: ResourceDetailLayoutProps) {
  return (
    <LearnEntityDetailLayout
      detail={detail}
      main={main}
      discussionEntityKind="lecture"
      emptyStateContext="resource"
    />
  )
}
