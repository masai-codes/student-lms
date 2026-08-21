import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { CertificateViewModal } from './CertificateCard'
import type { CertificateCardData } from './CertificateCard'

interface Props {
  certificate: CertificateCardData
  subtitle: string
}

export function CertificateFileCard({ certificate, subtitle }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div
        className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3"
        style={{
          boxShadow: '0px 1px 2px rgba(0,0,0,0.08)',
          minHeight: 72,
          flex: 1,
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 py-3">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg shrink-0 bg-[#EBF5FF] dark:bg-info-subtle">
            <ShieldCheck
              size={24}
              strokeWidth={1.5}
              className="text-[#3F83F8] dark:text-info-subtle-foreground"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="font-medium text-base leading-6 text-foreground truncate">
              {certificate.certificateTitle ??
                certificate.certificateType ??
                'Certificate'}
            </span>
            {subtitle && (
              <span className="text-sm text-foreground-muted truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pl-3">
          {certificate.verificationUrl && (
            <button
              onClick={() =>
                void navigator.clipboard?.writeText(
                  certificate.verificationUrl!,
                )
              }
              className="flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer bg-[#EBF5FF] text-brand dark:bg-brand-subtle dark:text-brand-subtle-foreground"
              style={{
                padding: '10px 16px',
                height: 40,
              }}
            >
              Share
            </button>
          )}
          {(certificate.pdfUrl || certificate.verificationUrl) && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center rounded-lg text-sm font-medium bg-brand text-brand-foreground cursor-pointer"
              style={{ padding: '10px 16px', height: 40 }}
            >
              View
            </button>
          )}
        </div>
      </div>

      <CertificateViewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        certificate={certificate}
      />
    </>
  )
}
