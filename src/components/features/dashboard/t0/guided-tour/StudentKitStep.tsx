import { useState } from 'react'
import { ArrowSquareOut, CheckCircle, CopySimple } from '@phosphor-icons/react'
import { AdmissionsRedirectCard } from './AdmissionsRedirectCard'
import { pushDashboardEvent } from '../../shared/dashboardAnalytics'
import type { StudentKitStatus } from '@/server/api/dashboard/t0/getStudentKitStatus.service'

interface StudentKitStepProps {
  kit: StudentKitStatus
}

/** Illustration of the courier tracking steps (same asset as the legacy LMS). */
const KIT_TRACKING_IMAGE =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/faab73d2-1e58-4301-bfb9-3235bc90aba1/aTbeezF0AAAXOdsS.png'

const CARD_CENTER =
  'flex min-h-[360px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-surface p-10 text-center shadow-sm'

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
    pushDashboardEvent('l_dashboard_guided_tour_student_kit_copy_id')
    try {
      await navigator.clipboard.writeText(trackingId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  // 1. Details not filled → redirect to admissions (shared redirect card).
  if (!kit.detailsFilled) {
    return (
      <AdmissionsRedirectCard
        message="You'll now be redirected to the Admissions platform to upload your Welcome Kit details."
        url={kit.admissionsFormUrl}
        ctaTestId="student-kit-fill"
        fallback="Please contact support to submit your kit details."
      />
    )
  }

  // 2. Details filled but no tracking link yet → submitted, tracking pending.
  if (!hasLink) {
    return (
      <div className={CARD_CENTER} data-testid="student-kit-step">
        <div className="mb-6 flex size-[72px] items-center justify-center rounded-full bg-success">
          <CheckCircle
            size={40}
            weight="bold"
            className="text-success-foreground"
            aria-hidden
          />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-foreground">
          Student Kit Details Submitted
        </h2>
        <p
          className="mb-8 max-w-sm text-sm text-foreground-muted"
          data-testid="student-kit-pending"
        >
          Your details have been successfully submitted. Tracking details will
          be shared soon.
        </p>
        <div className="rounded-full border border-[#D1E5FF] bg-[#F0F7FF] px-6 py-3 text-sm font-medium text-[#3B82F6] dark:border-info-subtle dark:bg-info-subtle dark:text-info-subtle-foreground">
          Tracking details will appear here once available
        </div>
      </div>
    )
  }

  // 3. Tracking available → copyable ID (when present) + courier link + steps.
  return (
    <div
      className="w-full rounded-2xl border border-border bg-surface p-6 shadow-sm"
      data-testid="student-kit-step"
    >
      <div className="mb-6 rounded-2xl bg-surface-muted p-6">
        <h2 className="mb-5 text-base font-bold text-foreground">
          Tracking details
        </h2>
        <div className="flex flex-col gap-6 md:flex-row">
          {trackingId ? (
            <div className="flex-1">
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Tracking ID
              </label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                <span
                  className="text-sm text-foreground"
                  data-testid="student-kit-tracking-id"
                >
                  {trackingId}
                </span>
                <button
                  type="button"
                  onClick={copyTrackingId}
                  title={copied ? 'Copied!' : 'Copy Tracking ID'}
                  className="rounded p-1 text-foreground-muted transition-colors hover:bg-surface-muted"
                >
                  <CopySimple className="size-5" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Tracking Link
            </label>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="student-kit-track"
              onClick={() =>
                pushDashboardEvent('l_dashboard_guided_tour_student_kit_track')
              }
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
            >
              <span className="mr-2 truncate text-sm text-[#2563EB] dark:text-info">
                {trackingUrl}
              </span>
              <ArrowSquareOut
                className="size-5 shrink-0 text-foreground-muted"
                aria-hidden
              />
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 rounded-2xl bg-surface-muted p-6 md:flex-row">
        <div className="flex-1">
          <h3 className="mb-6 text-lg font-bold text-foreground">
            Follow the below steps to track your student kit
          </h3>
          <ol className="flex list-inside list-decimal flex-col gap-3 text-sm font-medium text-foreground">
            <li>Copy your tracking ID</li>
            <li>Open the tracking link and paste the tracking ID</li>
            <li>Enter the captcha and submit to view the details and status</li>
          </ol>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <img
            src={KIT_TRACKING_IMAGE}
            alt="Student kit tracking steps"
            className="h-auto w-full max-w-[280px] rounded-lg border border-border bg-surface object-contain"
          />
        </div>
      </div>
    </div>
  )
}
