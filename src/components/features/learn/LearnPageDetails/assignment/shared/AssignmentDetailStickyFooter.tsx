'use client'

import { ClipboardText, WarningCircle } from '@phosphor-icons/react'

import { MasaiButton } from '@/components/ui/masai-button'
import { MasaiChips } from '@/components/ui/masai-chips'
import { getAssignmentStatusChipStyles } from './getAssignmentStatusChipStyles'

import type { AssignmentDetailFooter } from '@/server/learn/assignmentDetailFooterTypes'
import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

type AssignmentDetailStickyFooterProps = {
  detail: AssignmentDetailPayload
}

function ScorePolicyNotice({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full bg-[#FFF9E6] px-3 py-2 font-poppins"
      data-testid="assignment-footer-score-policy"
    >
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-yellow-400 bg-white text-sm font-bold text-yellow-400"
        aria-hidden
      >
        !
      </span>
      <p className="type-b3-md text-gray-700">{message}</p>
    </div>
  )
}

function PracticeModeChip() {
  return (
    <MasaiChips
      label="Practice Mode"
      size="regular"
      backgroundClassName="bg-teal-50 border border-teal-100"
      textClassName="!text-teal-600"
      className="pointer-events-none"
      tabIndex={-1}
      aria-hidden
    />
  )
}

export function AssignmentDetailStickyFooter({
  detail,
}: AssignmentDetailStickyFooterProps) {
  const { footer } = detail

  if (!footer.visible) {
    return null
  }

  const hasLeft =
    footer.showPracticeModeChip ||
    footer.statusChip != null ||
    footer.score != null ||
    footer.notices.some((n) => n.variant === 'score-policy')

  const hasRight = footer.actions.length > 0

  if (!hasLeft && !hasRight) {
    return null
  }

  return (
    <footer
      data-testid="assignment-detail-sticky-footer"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-[80] flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-3 shadow-[0_1px_4px_0_rgba(0,0,0,0.20)] md:bottom-0 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        {footer.showPracticeModeChip ? <PracticeModeChip /> : null}
        {footer.statusChip ? (
          <MasaiChips
            label={
              getAssignmentStatusChipStyles(
                footer.statusChip.status,
                footer.statusChip.label,
              ).label
            }
            size="regular"
            backgroundClassName={
              getAssignmentStatusChipStyles(footer.statusChip.status)
                .backgroundClassName
            }
            textClassName={
              getAssignmentStatusChipStyles(footer.statusChip.status)
                .textClassName
            }
            className="pointer-events-none"
            tabIndex={-1}
            data-testid="assignment-footer-status-chip"
          />
        ) : null}
        {footer.notices
          .filter((notice) => notice.variant === 'score-policy')
          .map((notice) => (
            <ScorePolicyNotice key={notice.message} message={notice.message} />
          ))}
        {footer.score ? (
          <div
            className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5"
            data-testid="assignment-footer-score"
          >
            <ClipboardText
              className="size-5 text-blue-500"
              aria-hidden
              weight="duotone"
            />
            <span className="type-b3-md text-gray-600">{footer.score.label}</span>
          </div>
        ) : null}
      </div>

      {hasRight ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {footer.actions.map((action) => (
            <MasaiButton
              key={action.kind}
              type={action.variant === 'secondary' ? 'secondary' : 'primary'}
              size="md"
              ctaText={action.label}
              htmlType="button"
              disabled={!action.enabled}
              data-testid={`assignment-footer-action-${action.kind}`}
              onClick={() => undefined}
            />
          ))}
        </div>
      ) : null}
    </footer>
  )
}

/** Inline notices that belong in main content (not the sticky bar). */
export function AssignmentDetailFooterInlineNotices({
  footer,
}: {
  footer: AssignmentDetailFooter
}) {
  const inlineNotices = footer.notices.filter(
    (n) => n.variant === 'practice-after-deadline',
  )

  if (inlineNotices.length === 0) return null

  return (
    <div className="space-y-3" data-testid="assignment-footer-inline-notices">
      {inlineNotices.map((notice) => (
        <div
          key={notice.message}
          className="flex items-start gap-2 rounded-lg bg-[#FFF9E5] p-3"
        >
          <WarningCircle
            className="mt-0.5 size-5 shrink-0 text-amber-600"
            weight="fill"
            aria-hidden
          />
          <p className="type-b3-md text-gray-700">{notice.message}</p>
        </div>
      ))}
    </div>
  )
}
