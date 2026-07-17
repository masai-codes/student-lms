import { Shuffle } from '@phosphor-icons/react'
import { pushDashboardEvent } from '../../shared/dashboardAnalytics'

interface AdmissionsRedirectCardProps {
  /** What the learner will upload on the admissions platform. */
  message: string
  /** Where "Continue" opens (new tab); `null` shows the support fallback instead. */
  url: string | null
  /** Extra side-effect when Continue is clicked (e.g. refetch status). */
  onContinue?: () => void
  /** Test id for the Continue button (varies per step). */
  ctaTestId?: string
  /** Support message shown when there's no URL. */
  fallback?: string
}

const CARD_CENTER =
  'flex min-h-[360px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-surface p-10 text-center shadow-sm'
const CTA =
  'inline-flex h-11 items-center justify-center rounded-lg bg-brand px-8 text-sm font-semibold text-brand-foreground transition-colors hover:bg-[#5a4f96]'

/**
 * Shared "Redirecting you to Admissions" card — reused by the document-upload
 * and student-kit steps (which both hand off to the admissions platform). Only
 * the message (and the CTA test id) differs.
 */
export function AdmissionsRedirectCard({
  message,
  url,
  onContinue,
  ctaTestId,
  fallback = 'Contact support if you need the Admissions portal link.',
}: AdmissionsRedirectCardProps) {
  return (
    <div className={CARD_CENTER} data-testid="admissions-redirect-card">
      <div className="mb-6">
        <Shuffle
          size={56}
          weight="bold"
          className="text-[#DF3841]"
          aria-hidden
        />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-foreground">
        Redirecting you to Admissions
      </h2>
      <p className="mb-8 max-w-sm text-sm text-foreground-muted">{message}</p>
      {url ? (
        <button
          type="button"
          onClick={() => {
            pushDashboardEvent('l_dashboard_guided_tour_admissions_continue', {
              cta: ctaTestId,
            })
            window.open(url, '_blank', 'noopener,noreferrer')
            onContinue?.()
          }}
          className={CTA}
          data-testid={ctaTestId}
        >
          Continue
        </button>
      ) : (
        <p className="text-sm text-foreground-muted">{fallback}</p>
      )}
    </div>
  )
}
