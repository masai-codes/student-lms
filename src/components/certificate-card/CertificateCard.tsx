import { useState } from 'react'
import { Share2, X } from 'lucide-react'
import { ConfettiOverlay } from '@/components/ui/confetti-overlay'
import { Modal, ModalContent } from '@/components/ui/modal'

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

export function CertificateViewModal({
  open,
  onClose,
  certificate,
}: {
  open: boolean
  onClose: () => void
  certificate: CertificateCardData
}) {
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
      >
        {/* Confetti canvas — covers the entire modal */}
        <ConfettiOverlay active={open} />

        <div className="relative z-20 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {certificate.certificateTitle ?? 'Certificate'}
              </h2>
              <p className="text-sm text-foreground-muted mt-0.5">
                Congratulations on earning this certification! Share your
                achievement or open it in a new tab.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-foreground-subtle hover:text-foreground-muted transition-colors focus-visible:outline-none"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Certificate iframe */}
          {certificate.verificationUrl ? (
            <div
              className="rounded-[12px] overflow-hidden border border-border bg-surface-muted"
              style={{ height: '480px' }}
            >
              <iframe
                src={certificate.verificationUrl}
                title={certificate.certificateTitle ?? 'Certificate'}
                className="w-full h-full border-0"
                allow="fullscreen"
              />
            </div>
          ) : certificate.pdfUrl ? (
            <div
              className="rounded-[12px] overflow-hidden border border-border bg-surface-muted"
              style={{ height: '480px' }}
            >
              <iframe
                src={certificate.pdfUrl}
                title={certificate.certificateTitle ?? 'Certificate'}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 rounded-[12px] bg-surface-muted border border-border">
              <p className="text-sm text-foreground-subtle">
                Certificate not available
              </p>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {certificate.verificationUrl && (
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(
                    certificate.verificationUrl!,
                  )
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
              >
                <Share2 size={15} />
                Share
              </button>
            )}
            {(certificate.verificationUrl || certificate.pdfUrl) && (
              <a
                href={certificate.verificationUrl ?? certificate.pdfUrl ?? ''}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-[10px] bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 transition-colors"
              >
                Open in new tab
              </a>
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const [viewOpen, setViewOpen] = useState(false)

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
            {certificate.batchName}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setViewOpen(true)}
            className="px-4 py-2 rounded-[8px] bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 transition-colors"
          >
            View
          </button>
          {certificate.verificationUrl && (
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(
                  certificate.verificationUrl!,
                )
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
            >
              <Share2 size={14} />
              Share
            </button>
          )}
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
