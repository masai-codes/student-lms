import { useState } from 'react'
import { ArrowSquareOut, CheckCircle, CopySimple } from '@phosphor-icons/react'
import type { StudentKitStatus } from '@/server/api/dashboard/t0/getStudentKitStatus.service'

interface StudentKitStepProps {
  kit: StudentKitStatus
}

/** Illustration of the courier tracking steps (same asset as the legacy LMS). */
const KIT_TRACKING_IMAGE =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/faab73d2-1e58-4301-bfb9-3235bc90aba1/aTbeezF0AAAXOdsS.png'

const CARD_CENTER =
  'flex min-h-[360px] w-full flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm'
const CTA = 'inline-flex h-11 items-center justify-center rounded-lg bg-[#6962AC] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#5a4f96]'

/**
 * Student-kit step, mirroring the legacy LMS: submit shipping details (redirect
 * to the admissions portal) → details submitted, tracking pending → tracking
 * available (copyable ID + courier link + how-to-track steps). Renders purely
 * from the backend-provided kit status.
 */
export function StudentKitStep({ kit }: StudentKitStepProps) {
  const [copied, setCopied] = useState(false)
  const trackingUrl = kit.trackingUrl?.trim() ?? ''
  const trackingId = kit.trackingId?.trim() ?? ''
  const hasLink = Boolean(trackingUrl)

  const copyTrackingId = async () => {
    if (!trackingId) return
    try {
      await navigator.clipboard.writeText(trackingId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  // 1. Details not filled → redirect to admissions to upload welcome-kit details.
  if (!kit.detailsFilled) {
    return (
      <div className={CARD_CENTER} data-testid="student-kit-step">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">Redirecting you to Admissions</h2>
        <p className="mb-8 max-w-sm text-sm text-gray-600">
          You&apos;ll now be redirected to the Admissions platform to upload your Welcome Kit details.
        </p>
        {kit.admissionsFormUrl ? (
          <button
            type="button"
            onClick={() => window.open(kit.admissionsFormUrl!, '_blank', 'noopener,noreferrer')}
            className={CTA}
            data-testid="student-kit-fill"
          >
            Continue
          </button>
        ) : (
          <p className="text-sm text-gray-500">Please contact support to submit your kit details.</p>
        )}
      </div>
    )
  }

  // 2. Details filled but no tracking link yet → submitted, tracking pending.
  if (!hasLink) {
    return (
      <div className={CARD_CENTER} data-testid="student-kit-step">
        <div className="mb-6 flex size-[72px] items-center justify-center rounded-full bg-[#3B9D6E]">
          <CheckCircle size={40} weight="bold" className="text-white" aria-hidden />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-gray-900">Student Kit Details Submitted</h2>
        <p className="mb-8 max-w-sm text-sm text-gray-600" data-testid="student-kit-pending">
          Your details have been successfully submitted. Tracking details will be shared soon.
        </p>
        <div className="rounded-full border border-[#D1E5FF] bg-[#F0F7FF] px-6 py-3 text-sm font-medium text-[#3B82F6]">
          Tracking details will appear here once available
        </div>
      </div>
    )
  }

  // 3. Tracking available → copyable ID (when present) + courier link + steps.
  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm" data-testid="student-kit-step">
      <div className="mb-6 rounded-2xl bg-[#F9FAFB] p-6">
        <h2 className="mb-5 text-base font-bold text-gray-900">Tracking details</h2>
        <div className="flex flex-col gap-6 md:flex-row">
          {trackingId ? (
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-gray-700">Tracking ID</label>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                <span className="text-sm text-gray-900" data-testid="student-kit-tracking-id">{trackingId}</span>
                <button
                  type="button"
                  onClick={copyTrackingId}
                  title={copied ? 'Copied!' : 'Copy Tracking ID'}
                  className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100"
                >
                  <CopySimple className="size-5" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-gray-700">Tracking Link</label>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="student-kit-track"
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300"
            >
              <span className="mr-2 truncate text-sm text-[#2563EB]">{trackingUrl}</span>
              <ArrowSquareOut className="size-5 shrink-0 text-gray-500" aria-hidden />
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 rounded-2xl bg-[#F9FAFB] p-6 md:flex-row">
        <div className="flex-1">
          <h3 className="mb-6 text-lg font-bold text-gray-900">Follow the below steps to track your student kit</h3>
          <ol className="flex list-inside list-decimal flex-col gap-3 text-sm font-medium text-gray-700">
            <li>Copy your tracking ID</li>
            <li>Open the tracking link and paste the tracking ID</li>
            <li>Enter the captcha and submit to view the details and status</li>
          </ol>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <img
            src={KIT_TRACKING_IMAGE}
            alt="Student kit tracking steps"
            className="h-auto w-full max-w-[280px] rounded-lg border border-gray-200 bg-white object-contain"
          />
        </div>
      </div>
    </div>
  )
}
