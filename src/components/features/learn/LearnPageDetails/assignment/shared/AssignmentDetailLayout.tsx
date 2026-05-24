'use client'

import { MarkdownContent } from '@/components/shared/markdown-content'
import { LearnEntityDetailLayout } from '../../common/layout/LearnEntityDetailLayout'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'
import type { ReactNode } from 'react'

type AssignmentDetailLayoutProps = {
  detail: AssignmentDetailPayload
  main: ReactNode
}

export function AssignmentDetailLayout({ detail, main }: AssignmentDetailLayoutProps) {
  return (
    <LearnEntityDetailLayout
      detail={detail}
      main={main}
      discussionEntityKind="assignment"
      emptyStateContext="assignment"
      mainFooter={
        detail.instructions ? (
          <section data-testid="assignment-instructions">
            <h2 className="type-h6 text-gray-900">Instructions</h2>
            <MarkdownContent
              value={detail.instructions}
              variant="detail"
              className="type-b2-regular mt-3 text-gray-700"
            />
          </section>
        ) : null
      }
    />
  )
}
