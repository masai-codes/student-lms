import { ArrowSquareOut } from '@phosphor-icons/react'
import { pushDashboardEvent } from '../../../shared/dashboardAnalytics'
import { CheckboxField } from '@/components/ui/form-fields'

interface AgreementPdfViewerProps {
  heading: string
  pdfUrl: string
  accepted: boolean
  onAcceptChange: (accepted: boolean) => void
  error?: string | null
}

/** One agreement document: an embedded PDF + an "I accept" consent checkbox. */
export function AgreementPdfViewer({ heading, pdfUrl, accepted, onAcceptChange, error }: AgreementPdfViewerProps) {
  return (
    <div className="flex flex-col gap-3" data-testid="agreement-pdf-viewer">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-gray-900">{heading}</h4>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            pushDashboardEvent('l_dashboard_guided_tour_agreement_pdf_open', { heading })
          }
          className="inline-flex items-center gap-1 text-sm font-medium text-[#6962AC] hover:underline"
          data-testid="agreement-pdf-open"
        >
          Open <ArrowSquareOut className="size-4" aria-hidden />
        </a>
      </div>
      <iframe
        src={`${pdfUrl}#toolbar=0`}
        title={heading}
        className="h-[55vh] min-h-[320px] w-full rounded-lg border border-gray-200"
        data-testid="agreement-pdf-iframe"
      />
      <CheckboxField id={`accept-${heading}`} checked={accepted} onChange={onAcceptChange} error={error} data-testid="agreement-accept">
        I acknowledge that I have read and accept the <strong>{heading}</strong>.
      </CheckboxField>
    </div>
  )
}
