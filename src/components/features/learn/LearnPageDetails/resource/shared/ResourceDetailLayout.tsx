'use client'

import { AssociatedContentEntryCta } from '../../common/associated/AssociatedContentEntryCta'
import { LearnEntityDetailLayout } from '../../common/layout/LearnEntityDetailLayout'
import { ResourceDetailActions } from './ResourceDetailActions'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'
import type { ReactNode } from 'react'

type ResourceDetailLayoutProps = {
  detail: ResourceDetailPayload
  main: ReactNode
}

export function ResourceDetailLayout({
  detail,
  main,
}: ResourceDetailLayoutProps) {
  return (
    <LearnEntityDetailLayout
      detail={detail}
      main={main}
      discussionEntityKind="lecture"
      emptyStateContext="resource"
      headerActions={
        <ResourceDetailActions
          resourceId={detail.id}
          initialIsBookmarked={detail.isBookmarked}
        />
      }
      fullWidthBanner={
        <AssociatedContentEntryCta items={detail.associatedItems} />
      }
    />
  )
}
