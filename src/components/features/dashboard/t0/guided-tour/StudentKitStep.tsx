import { ArrowSquareOut, CheckCircle, Package } from '@phosphor-icons/react'
import type { StudentKitStatus } from '@/server/api/dashboard/t0/getStudentKitStatus.service'

interface StudentKitStepProps {
  kit: StudentKitStatus
}

const CARD = 'flex flex-col items-start gap-4 rounded-xl border border-gray-200 p-6'
const CTA = 'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#6962AC] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50'
const CTA_OUTLINE = 'inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#6962AC] px-5 text-sm font-semibold text-[#6962AC] hover:bg-[#6962AC]/5'

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Student-kit step with three states: submit shipping details (redirect to the
 * admissions portal) → details submitted, tracking pending → tracking available
 * (link to the courier). Purely renders the backend-provided kit status.
 */
export function StudentKitStep({ kit }: StudentKitStepProps) {
  if (!kit.detailsFilled) {
    return (
      <div className={CARD} data-testid="student-kit-step">
        <Package className="size-8 text-[#6962AC]" aria-hidden />
        <p className="text-sm font-medium text-gray-900">Submit your welcome-kit details</p>
        <p className="text-sm text-gray-600">
          You&apos;ll be taken to the admissions portal to enter your shipping address for your Masai welcome kit.
        </p>
        {kit.admissionsFormUrl ? (
          <button type="button" onClick={() => openExternal(kit.admissionsFormUrl!)} className={CTA} data-testid="student-kit-fill">
            Continue <ArrowSquareOut className="size-4" aria-hidden />
          </button>
        ) : (
          <p className="text-sm text-gray-500">Please contact support to submit your kit details.</p>
        )}
      </div>
    )
  }

  if (!kit.trackingUrl) {
    return (
      <div className={CARD} data-testid="student-kit-step">
        <CheckCircle weight="fill" className="size-8 text-green-500" aria-hidden />
        <p className="text-sm font-medium text-gray-900">Kit details submitted</p>
        <p className="text-sm text-gray-600" data-testid="student-kit-pending">
          Your welcome kit is being prepared. Tracking details will appear here once it ships.
        </p>
      </div>
    )
  }

  return (
    <div className={CARD} data-testid="student-kit-step">
      <Package className="size-8 text-[#6962AC]" aria-hidden />
      <p className="text-sm font-medium text-gray-900">Your welcome kit is on its way</p>
      {kit.trackingId ? (
        <p className="text-sm text-gray-600">
          Tracking ID: <span className="font-medium text-gray-900" data-testid="student-kit-tracking-id">{kit.trackingId}</span>
        </p>
      ) : null}
      <a href={kit.trackingUrl} target="_blank" rel="noopener noreferrer" className={CTA_OUTLINE} data-testid="student-kit-track">
        Track shipment <ArrowSquareOut className="size-4" aria-hidden />
      </a>
    </div>
  )
}
