import type { ReactNode } from 'react'
import { Warning } from '@phosphor-icons/react'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import { MasaiButton } from '@/components/ui/masai-button'

/**
 * Shared confirmation modal for the profile surfaces (revoke session, sign out
 * everywhere, toggle an email preference). Built on the shared `Modal`, so open
 * *and* close animations, overlay, and the above-tab-bar z-index come for free.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isConfirming,
  testId,
  children,
  onConfirm,
  onCancel,
  tone = 'warning',
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  isConfirming?: boolean
  testId: string
  children?: ReactNode
  onConfirm: () => void
  onCancel: () => void
  tone?: 'warning' | 'danger'
}) {
  return (
    <Modal open={open} onOpenChange={(next) => (next ? null : onCancel())}>
      <ModalContent data-testid={testId} className="max-w-md">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden
            className={`flex size-12 items-center justify-center rounded-full ${
              tone === 'danger'
                ? 'bg-danger-subtle text-danger-subtle-foreground'
                : 'bg-warning-subtle text-warning-subtle-foreground'
            }`}
          >
            <Warning size={26} weight="fill" />
          </span>
          <ModalTitle className="type-h6">{title}</ModalTitle>
          {/* Radix requires a description; fall back to the title for screen readers. */}
          <ModalDescription
            className={
              description
                ? 'type-b2-regular text-foreground-muted'
                : 'sr-only'
            }
          >
            {description ?? title}
          </ModalDescription>
          {children}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <MasaiButton
            type="secondary"
            ctaText="Cancel"
            data-testid={`${testId}-cancel`}
            onClick={onCancel}
          />
          <MasaiButton
            ctaText={isConfirming ? 'Working…' : confirmLabel}
            disabled={isConfirming}
            data-testid={`${testId}-confirm`}
            onClick={onConfirm}
          />
        </div>
      </ModalContent>
    </Modal>
  )
}
