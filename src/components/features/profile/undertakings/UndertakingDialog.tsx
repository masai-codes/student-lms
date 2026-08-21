import { MapPin } from '@phosphor-icons/react'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import { MasaiButton } from '@/components/ui/masai-button'
import type { PendingUndertaking } from '@/server/api/profile/profile.types'

/**
 * The acknowledgement document plus its Accept action.
 *
 * The location notice is shown *before* the browser prompt fires (the prompt is
 * triggered by Accept), so the student knows why they are being asked. The old
 * flow prompted silently on tab load and dead-ended if you declined.
 */
export function UndertakingDialog({
  undertaking,
  isAccepting,
  error,
  onAccept,
  onClose,
}: {
  undertaking: PendingUndertaking | null
  isAccepting: boolean
  error: string | null
  onAccept: () => void
  onClose: () => void
}) {
  return (
    <Modal
      open={undertaking !== null}
      onOpenChange={(next) => (next ? null : onClose())}
    >
      <ModalContent
        data-testid="profile-undertaking-dialog"
        className="max-w-3xl"
      >
        <ModalTitle className="type-h6 pr-8">
          {undertaking?.heading ?? 'Acknowledgement'}
        </ModalTitle>
        <ModalDescription className="mt-1 type-caption text-foreground-subtle">
          {undertaking?.sectionName}
        </ModalDescription>

        {undertaking ? (
          <iframe
            key={undertaking.pdfUrl}
            src={undertaking.pdfUrl}
            title={`${undertaking.heading} document`}
            data-testid="profile-undertaking-pdf"
            className="mt-4 h-[55vh] w-full rounded-xl border border-border bg-surface-muted"
          />
        ) : null}

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface-muted p-3">
          <MapPin
            size={18}
            className="mt-0.5 shrink-0 text-foreground-subtle"
            aria-hidden
          />
          <p className="type-caption text-foreground-muted">
            Accepting records your approximate location and IP address alongside
            your signature. Your browser will ask for location permission when
            you accept.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            data-testid="profile-undertaking-error"
            className="mt-3 rounded-xl border border-danger bg-danger-subtle px-3 py-2 type-caption text-danger-subtle-foreground"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <MasaiButton
            type="secondary"
            ctaText="Close"
            data-testid="profile-undertaking-close"
            onClick={onClose}
          />
          {undertaking ? (
            <MasaiButton
              ctaText={
                isAccepting
                  ? 'Recording…'
                  : error
                    ? 'Try again'
                    : 'Accept acknowledgement'
              }
              disabled={isAccepting}
              data-testid="profile-undertaking-accept"
              onClick={onAccept}
            />
          ) : null}
        </div>
      </ModalContent>
    </Modal>
  )
}
