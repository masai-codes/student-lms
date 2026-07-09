import { CheckCircle, FilePdf } from '@phosphor-icons/react'
import { pushDashboardEvent } from '../../../shared/dashboardAnalytics'

interface AgreementCertificateProps {
  referenceNumber: string
  /** Learner name as entered on the agreement form (falls back to profile name). */
  name: string
  email: string
  studentCode: string
  program: string
  batchName: string
  /** ISO first-view time; null until viewed. */
  viewTime: string | null
  /** ISO signed time; null until signed. */
  signedTime: string | null
  /** IP captured at submit; null until signed. */
  ipAddress: string | null
  location: string
  /** When signed, shows the completed state + a link to the generated PDF. */
  completed?: boolean
  agreementPdfUrl?: string | null
}

const PLACEHOLDER = '--'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Agreement timestamps are stored as IST wall-clock time but carry a misleading
 * `Z` suffix (e.g. "2026-07-10T00:28:36.076Z" means 12:28 AM IST, NOT UTC).
 * We intentionally read the UTC components — which hold those IST digits — so the
 * value is shown verbatim as IST regardless of the viewer's browser timezone
 * (no double-shift), formatted in 12-hour am/pm. Displays as "10 Jul 2026, 12:28 AM".
 */
function formatTimestamp(value: string | null): string {
  if (!value) return PLACEHOLDER
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = MONTHS[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  const hours24 = date.getUTCHours()
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const meridiem = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${day} ${month} ${year}, ${hours12}:${minutes} ${meridiem}`
}

/**
 * Signature certificate — mirrors the reference (experience-ui) signing flow so
 * the legally-recorded details shown on screen match one-for-one: the issuing
 * entity, then Details (Name, Email, Student Code, Program, Batch),
 * Timestamp (Viewed, Signed), and Signature (IP Address, Location). Shown before
 * submit as a review, and once signed with a link to the generated PDF.
 */
export function AgreementCertificate({
  referenceNumber,
  name,
  email,
  studentCode,
  program,
  batchName,
  viewTime,
  signedTime,
  ipAddress,
  location,
  completed,
  agreementPdfUrl,
}: AgreementCertificateProps) {
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

      {/* On the certificate step the reference number is shown (the issuing-entity
          block appears only on the earlier agreement-reading steps). */}
      <p className="text-sm text-gray-700">
        Reference number :- <span className="font-medium text-gray-900">{referenceNumber || PLACEHOLDER}</span>
      </p>

      <Section title="Details">
        <InfoRow label="Name" value={name} />
        <InfoRow label="Email" value={email} />
        <InfoRow label="Student Code" value={studentCode} />
        <InfoRow label="Program" value={program} />
        <InfoRow label="Batch" value={batchName} />
      </Section>

      <Section title="Timestamp">
        <InfoRow label="Viewed" value={formatTimestamp(viewTime)} />
        <InfoRow label="Signed" value={formatTimestamp(signedTime)} />
      </Section>

      <Section title="Signature">
        <InfoRow label="IP Address" value={ipAddress} />
        <InfoRow label="Location" value={location} />
      </Section>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200">
      <h3 className="border-b border-gray-100 px-4 py-2 text-sm font-bold text-gray-800">{title}</h3>
      <dl className="divide-y divide-gray-100">{children}</dl>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value || PLACEHOLDER}</dd>
    </div>
  )
}
