'use client'

import { AssociatedContentEntryCta } from '../../common/associated/AssociatedContentEntryCta'
import { LearnEntityDetailLayout } from '../../common/layout/LearnEntityDetailLayout'
import { AssignmentDetailActions } from './AssignmentDetailActions'
import { AssignmentCompletedBanner } from './AssignmentCompletedBanner'
import { AssignmentHeaderBadges } from './AssignmentHeaderBadges'
import { AssignmentLiveAnalytics } from './AssignmentLiveAnalytics'
import { AssignmentProblemList } from './AssignmentProblemList'
import {
  ASSIGNMENT_DETAIL_STICKY_FOOTER_SELECTOR,
  AssignmentDetailFooterInlineNotices,
  AssignmentDetailStickyFooter,
} from './AssignmentDetailStickyFooter'
import { AssignmentNotStartedBanner } from './AssignmentNotStartedBanner'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'
import type { ReactNode } from 'react'
import { MarkdownContent } from '@/components/shared/markdown-content'

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
              <AssignmentCompletedBanner completedDetails={detail.completedDetails} />
              <AssignmentLiveAnalytics liveAnalytics={detail.liveAnalytics} />
              {main}
              <AssignmentProblemList
                assignmentId={detail.id}
                problems={detail.problems}
              />
            </>
          }
          discussionEntityKind="assignment"
          emptyStateContext="assignment"
          headerActions={
            <AssignmentDetailActions
              assignmentId={detail.id}
              initialIsBookmarked={detail.isBookmarked}
            />
          }
          overviewTrailingChips={<AssignmentHeaderBadges badges={detail.headerBadges} />}
          fullWidthBanner={
            <div className="flex flex-col gap-4">
              {detail.phase === 'before' ? (
                <AssignmentNotStartedBanner detail={detail} />
              ) : null}
              <AssociatedContentEntryCta
                items={detail.associatedItems}
                reserveViewportBottomFrom={
                  detail.footer.visible
                    ? ASSIGNMENT_DETAIL_STICKY_FOOTER_SELECTOR
                    : undefined
                }
              />
            </div>
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
