import { useState } from 'react'
import { LinkedinLogo } from '@phosphor-icons/react'
import { X } from 'lucide-react'
import { ConfettiOverlay } from '@/components/ui/confetti-overlay'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import { MasaiButton } from '@/components/ui/masai-button'
import {
  buildCertificateShareText,
  buildLinkedInShareUrl,
  resolveViewableCertificateUrl,
} from '@/lib/certificates/certificateShare'

export interface CertificateCardData {
  certificateObjectId: string
  code?: string | null
  pdfUrl: string | null
  verificationUrl: string | null
  certificateTitle: string | null
  certificateType: string | null
  issuedDateIso: string | null
  batchName: string
}

interface CertificateCardProps {
  certificate: CertificateCardData
}

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

/**
 * Copies the post text and opens LinkedIn's composer — the old LMS's behaviour.
 * The previous implementation silently wrote a URL to the clipboard with no
 * feedback and never opened LinkedIn, so "Share" looked like it did nothing.
 */
export async function shareCertificate(
  certificate: CertificateCardData,
): Promise<void> {
  const text = buildCertificateShareText(certificate)
  try {
    await navigator.clipboard?.writeText(text)
  } catch {
    // Clipboard permission is optional — still open the composer.
  }
  window.open(buildLinkedInShareUrl(text), '_blank', 'noopener,noreferrer')
}

export function CertificateViewModal({
  open,
  onClose,
  certificate,
}: {
  open: boolean
  onClose: () => void
  certificate: CertificateCardData
}) {
  // Only ever hand an iframe a validated http(s) URL.
  const viewUrl = resolveViewableCertificateUrl(certificate)

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <ModalContent
        className="max-w-[1000px] w-full rounded-[20px] p-6 shadow-xl overflow-hidden"
        showCloseButton={false}
        data-testid="certificate-view-modal"
      >
        {/* Confetti canvas — covers the entire modal */}
        <ConfettiOverlay active={open} />

        <div className="relative z-20 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* ModalTitle/Description (not a bare h2/p) so Radix can wire
                  aria-labelledby / aria-describedby on the dialog. */}
              <ModalTitle className="text-lg font-bold text-foreground">
                {certificate.certificateTitle ?? 'Certificate'}
              </ModalTitle>
              <ModalDescription className="text-sm text-foreground-muted mt-0.5">
                Congratulations on earning this certification! Share your
                achievement or open it in a new tab.
              </ModalDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="certificate-view-close"
              className="shrink-0 text-foreground-subtle hover:text-foreground-muted transition-colors focus-visible:outline-none"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {viewUrl ? (
            <div
              className="rounded-[12px] overflow-hidden border border-border bg-surface-muted"
              style={{ height: '480px' }}
            >
              <iframe
                src={viewUrl}
                title={certificate.certificateTitle ?? 'Certificate'}
                data-testid="certificate-view-frame"
                className="w-full h-full border-0"
                allow="fullscreen"
              />
            </div>
          ) : (
            <div
              data-testid="certificate-view-unavailable"
              className="flex flex-col items-center justify-center gap-1 h-40 rounded-[12px] bg-surface-muted border border-border text-center px-6"
            >
              <p className="text-sm font-medium text-foreground">
                This certificate can&apos;t be previewed yet
              </p>
              <p className="text-sm text-foreground-subtle">
                Its verification link hasn&apos;t been published. You can still
                share your achievement.
              </p>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <MasaiButton
              type="secondary"
              ctaText="Share on LinkedIn"
              icon={<LinkedinLogo size={16} weight="fill" aria-hidden />}
              iconDirection="left"
              data-testid="certificate-view-share"
              onClick={() => void shareCertificate(certificate)}
            />
            {viewUrl ? (
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="certificate-view-open-new-tab"
                className="inline-flex items-center rounded-[10px] bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-transform duration-150 ease-out hover:-translate-y-px active:scale-95"
              >
                Open in new tab
              </a>
            ) : null}
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const [viewOpen, setViewOpen] = useState(false)
  // View needs something displayable; Share never does — the post text stands
  // on its own. This mirrors the old LMS, where Share always rendered and only
  // View was disabled.
  const canView = resolveViewableCertificateUrl(certificate) !== null

  return (
    <>
      <div className="rounded-[12px] border border-border bg-surface p-5 flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-foreground leading-snug">
          {certificate.certificateTitle ?? 'Certificate'}
        </h3>

        <div className="flex flex-col gap-1 text-sm text-foreground-muted">
          <p>
            <span className="font-medium text-foreground">Type:</span>{' '}
            {certificate.certificateType ?? '-'}
          </p>
          <p>
            <span className="font-medium text-foreground">Issue date:</span>{' '}
            {formatDate(certificate.issuedDateIso)}
          </p>
          <p>
            <span className="font-medium text-foreground">Batch:</span>{' '}
            {certificate.batchName || '-'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <MasaiButton
            ctaText="View"
            size="sm"
            disabled={!canView}
            data-testid="certificate-card-view"
            title={
              canView ? undefined : 'Verification link not published yet'
            }
            onClick={() => setViewOpen(true)}
          />
          <MasaiButton
            type="secondary"
            size="sm"
            ctaText="Share"
            icon={<LinkedinLogo size={14} weight="fill" aria-hidden />}
            iconDirection="left"
            data-testid="certificate-card-share"
            onClick={() => void shareCertificate(certificate)}
          />
        </div>
      </div>

      <CertificateViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        certificate={certificate}
      />
    </>
  )
}
