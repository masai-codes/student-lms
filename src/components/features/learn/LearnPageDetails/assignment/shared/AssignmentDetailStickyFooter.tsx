'use client'

import { ClipboardText, WarningCircle } from '@phosphor-icons/react'

import { MasaiButton } from '@/components/ui/masai-button'
import { MasaiChips } from '@/components/ui/masai-chips'
import { AssessmentPlatformRedirectModal } from './AssessmentPlatformRedirectModal'
import { getAssignmentStatusChipStyles } from './getAssignmentStatusChipStyles'
import { useAssignmentFooterActions } from './useAssignmentFooterActions'

import type { AssignmentDetailFooter } from '@/server/learn/assignmentDetailFooterTypes'
import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

export const ASSIGNMENT_DETAIL_STICKY_FOOTER_SELECTOR =
  '[data-testid="assignment-detail-sticky-footer"]'

type AssignmentDetailStickyFooterProps = {
  detail: AssignmentDetailPayload
}

function ScorePolicyNotice({ message }: { message: string }) {
  return (
    <div
      className="flex min-w-0 items-center gap-2 rounded-full bg-warning-subtle px-3 py-2 font-poppins"
      data-testid="assignment-footer-score-policy"
    >
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-warning bg-surface text-sm font-bold text-warning"
        aria-hidden
      >
        !
      </span>
      <p className="type-b3-md min-w-0 break-words text-foreground">
        {message}
      </p>
    </div>
  )
}

function PracticeModeChip() {
  return (
    <MasaiChips
      label="Practice Mode"
      size="regular"
      backgroundClassName="bg-teal-50 border border-teal-100 dark:bg-info-subtle dark:border-info-subtle"
      textClassName="!text-teal-600 dark:!text-info-subtle-foreground"
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
  const {
    modalOpen,
    setModalOpen,
    loading,
    errorMessage,
    handleAction,
    confirmModal,
  } = useAssignmentFooterActions(detail)

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
    <>
      <footer
        data-testid="assignment-detail-sticky-footer"
        // Hidden on mobile: assignment actions must be performed on a
        // laptop/desktop (see AssignmentMobileAttemptNotice). md+ only.
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-[80] hidden flex-col gap-3 border-t border-border bg-surface px-4 py-3 shadow-[0_1px_4px_0_rgba(0,0,0,0.20)] md:bottom-0 md:flex md:flex-row md:items-center md:justify-between"
      >
        {/* Entrance animates the content, not the fixed element's position. */}
        <div className="animate-dash-rise flex min-w-0 flex-1 flex-wrap items-center gap-3">
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
              <ScorePolicyNotice
                key={notice.message}
                message={notice.message}
              />
            ))}
          {footer.score ? (
            <div
              className="flex min-w-0 items-center gap-2 rounded-full border border-info-subtle bg-surface px-3 py-1.5 transition-colors duration-200 hover:border-info/60"
              data-testid="assignment-footer-score"
            >
              <ClipboardText
                className="size-5 text-info"
                aria-hidden
                weight="duotone"
              />
              <span className="type-b3-md text-foreground-muted">
                {footer.score.label}
              </span>
            </div>
          ) : null}
        </div>

        <div className="animate-dash-rise flex min-w-0 flex-col items-stretch gap-2 md:items-end">
          {errorMessage ? (
            <p className="type-b3-md text-danger" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {hasRight ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {footer.actions.map((action) => (
                <MasaiButton
                  key={action.kind}
                  type={
                    action.variant === 'secondary' ? 'secondary' : 'primary'
                  }
                  size="md"
                  ctaText={action.label}
                  htmlType="button"
                  className={
                    action.variant === 'secondary'
                      ? 'transition-all duration-200 ease-out active:scale-95'
                      : // Primary CTA: indigo glow + hover lift + press squish.
                        'shadow-[0_4px_14px_-4px_rgb(79_107_237_/_0.6)] transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-[0_6px_18px_-4px_rgb(79_107_237_/_0.7)] active:translate-y-0 active:scale-95'
                  }
                  disabled={!action.enabled || loading}
                  data-testid={`assignment-footer-action-${action.kind}`}
                  onClick={() => {
                    pushLearnEvent(
                      learnEntityEvent(
                        'assignment',
                        'footer_action',
                        detail.id,
                      ),
                      { assignment_id: detail.id, action: action.kind },
                    )
                    void handleAction(action.kind)
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </footer>

      <AssessmentPlatformRedirectModal
        open={modalOpen}
        loading={loading}
        onOpenChange={setModalOpen}
        onConfirm={confirmModal}
      />
    </>
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
          className="flex items-start gap-2 rounded-lg bg-warning-subtle p-3"
        >
          <WarningCircle
            className="mt-0.5 size-5 shrink-0 text-warning"
            weight="fill"
            aria-hidden
          />
          <p className="type-b3-md text-foreground">{notice.message}</p>
        </div>
      ))}
    </div>
  )
}
