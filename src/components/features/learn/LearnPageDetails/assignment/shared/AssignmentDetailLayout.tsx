'use client'

import { MarkdownContent } from '@/components/shared/markdown-content'
import { LearnEntityDetailLayout } from '../../common/layout/LearnEntityDetailLayout'
import {
  AssignmentDetailFooterInlineNotices,
  AssignmentDetailStickyFooter,
} from './AssignmentDetailStickyFooter'
import { AssignmentNotStartedBanner } from './AssignmentNotStartedBanner'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'
import type { ReactNode } from 'react'

type AssignmentDetailLayoutProps = {
  detail: AssignmentDetailPayload
  main: ReactNode
}

export function AssignmentDetailLayout({ detail, main }: AssignmentDetailLayoutProps) {
  const footerPadClass = detail.footer.visible
    ? 'pb-28 md:pb-20'
    : ''

  return (
    <>
      <div className={footerPadClass}>
        <LearnEntityDetailLayout
          detail={detail}
          main={
            <>
              <AssignmentDetailFooterInlineNotices footer={detail.footer} />
              {main}
            </>
          }
          discussionEntityKind="assignment"
          emptyStateContext="assignment"
          fullWidthBanner={
            detail.phase === 'before' ? (
              <AssignmentNotStartedBanner detail={detail} />
            ) : null
          }
          mainFooter={
            detail.instructions ? (
              <section data-testid="assignment-instructions">
                <h2 className="type-h6 text-gray-900">Instructions</h2>
                <MarkdownContent
                  value={detail.instructions}
                  variant="detail"
                  className="mt-3"
                />
              </section>
            ) : null
          }
        />
      </div>
      <AssignmentDetailStickyFooter detail={detail} />
    </>
  )
}
