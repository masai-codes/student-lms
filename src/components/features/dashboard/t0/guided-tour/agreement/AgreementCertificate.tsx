import { CheckCircle, FilePdf } from '@phosphor-icons/react'
import { pushDashboardEvent } from '../../../shared/dashboardAnalytics'
import type { AgreementFormValues } from '@/server/api/dashboard/agreement/agreementShared'

interface AgreementCertificateProps {
  values: AgreementFormValues
  referenceNumber: string
  /** When signed, shows the completed state + a link to the generated PDF. */
  completed?: boolean
  agreementPdfUrl?: string | null
}

const SUMMARY_ROWS: Array<{ key: keyof AgreementFormValues; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'dateOfBirth', label: 'Date of birth' },
  { key: 'address', label: 'Address' },
  { key: 'location', label: 'Location' },
  { key: 'parentsName', label: "Parent's name" },
]

/**
 * Signature-summary panel: shows the key details + reference number before
 * submit, and once signed, a success banner + a link to the generated PDF.
 */
export function AgreementCertificate({ values, referenceNumber, completed, agreementPdfUrl }: AgreementCertificateProps) {
  return (
    <div className="flex flex-col gap-4" data-testid="agreement-certificate">
      {completed ? (
        <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle weight="fill" className="size-5" aria-hidden />
          You&apos;ve signed this agreement.
        </div>
      ) : (
        <p className="text-sm text-gray-600">Review your details, then submit to sign the agreement.</p>
      )}

      <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
          <dt className="text-gray-500">Reference number</dt>
          <dd className="text-right font-medium text-gray-900">{referenceNumber}</dd>
        </div>
        {SUMMARY_ROWS.map((row) =>
          values[row.key] ? (
            <div key={row.key} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
              <dt className="text-gray-500">{row.label}</dt>
              <dd className="text-right font-medium text-gray-900">{values[row.key]}</dd>
            </div>
          ) : null,
        )}
      </dl>

      {completed && agreementPdfUrl ? (
        <a
          href={agreementPdfUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            pushDashboardEvent('l_dashboard_guided_tour_agreement_view_pdf', {
              reference_number: referenceNumber,
            })
          }
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#6962AC] px-4 py-2 text-sm font-semibold text-[#6962AC] hover:bg-[#6962AC]/5"
          data-testid="agreement-view-pdf"
        >
          <FilePdf className="size-4" aria-hidden />
          View signed agreement
        </a>
      ) : null}
    </div>
  )
}
