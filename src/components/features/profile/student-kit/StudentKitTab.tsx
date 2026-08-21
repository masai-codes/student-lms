import { useState } from 'react'
import {
  ArrowSquareOut,
  CheckCircle,
  Copy,
  Package,
} from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { MasaiButton } from '@/components/ui/masai-button'
import {
  ProfileCardListSkeleton,
  ProfileEmptyState,
  ProfileErrorState,
  ProfileTabPanel,
} from '@/components/features/profile/shared/ProfileStates'
import { profileStudentKitQuery } from '@/query/profile/profileQueries'
import { pushProfileEvent } from '@/components/features/profile/shared/profileAnalytics'

const TRACKING_STEPS = [
  'Copy your tracking ID',
  'Open the tracking link and paste the tracking ID',
  'Enter the captcha and submit to see the delivery status',
]

/** Copy button with real confirmation feedback, announced for screen readers. */
function CopyTrackingId({ trackingId }: { trackingId: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <span
        data-testid="profile-kit-tracking-id"
        className="min-w-0 break-all type-b2-regular text-foreground"
      >
        {trackingId}
      </span>
      <MasaiButton
        type="secondary"
        size="sm"
        iconOnly
        icon={
          copied ? (
            <CheckCircle size={16} weight="fill" aria-hidden />
          ) : (
            <Copy size={16} aria-hidden />
          )
        }
        aria-label={copied ? 'Tracking ID copied' : 'Copy tracking ID'}
        data-testid="profile-kit-copy-tracking-id"
        className="shrink-0"
        onClick={() => {
          pushProfileEvent('student_kit_copy_tracking_id')
          void navigator.clipboard
            .writeText(trackingId)
            .then(() => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 2000)
            })
            .catch(() => setCopied(false))
        }}
      />
      <span aria-live="polite" className="sr-only">
        {copied ? 'Tracking ID copied to clipboard' : ''}
      </span>
    </div>
  )
}

export function StudentKitTab() {
  const {
    data: kit,
    isLoading,
    isError,
  } = useQuery(profileStudentKitQuery(true))

  if (isLoading) {
    return (
      <ProfileTabPanel testId="profile-student-kit-panel">
        <ProfileCardListSkeleton rows={2} testId="profile-kit-skeleton" />
      </ProfileTabPanel>
    )
  }

  if (isError || !kit) {
    return (
      <ProfileTabPanel testId="profile-student-kit-panel">
        <ProfileErrorState
          testId="profile-kit-error"
          message="We couldn't load your student kit details. Please refresh and try again."
        />
      </ProfileTabPanel>
    )
  }

  // Details not yet filled: send the student to Admissions to complete them.
  if (!kit.detailsFilled && kit.showKit) {
    return (
      <ProfileTabPanel testId="profile-student-kit-panel">
        <ProfileEmptyState
          testId="profile-kit-details-pending"
          icon={<Package size={44} aria-hidden />}
          title="Tell us where to send your kit"
          description="Add your delivery details on the Admissions platform and your tracking information will appear here."
          action={
            kit.admissionsFormUrl ? (
              <a
                href={kit.admissionsFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="profile-kit-admissions-link"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 type-b1-md text-brand-foreground shadow-md transition-transform duration-150 ease-out hover:-translate-y-px active:scale-95"
                onClick={() => pushProfileEvent('student_kit_admissions_click')}
              >
                Add delivery details
                <ArrowSquareOut size={16} aria-hidden />
              </a>
            ) : undefined
          }
        />
      </ProfileTabPanel>
    )
  }

  // Details submitted but no tracking link issued yet.
  if (!kit.trackingUrl) {
    return (
      <ProfileTabPanel testId="profile-student-kit-panel">
        <ProfileEmptyState
          testId="profile-kit-awaiting-tracking"
          icon={<CheckCircle size={44} weight="fill" aria-hidden />}
          title="Details submitted"
          description="Your kit is being prepared. Tracking details will appear here as soon as it ships."
        />
      </ProfileTabPanel>
    )
  }

  return (
    <ProfileTabPanel testId="profile-student-kit-panel">
      <h3 className="type-h6 text-foreground">Tracking details</h3>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 type-b2-md text-foreground-muted">Tracking ID</p>
          {kit.trackingId ? (
            <CopyTrackingId trackingId={kit.trackingId} />
          ) : (
            <p className="type-b2-regular text-foreground-subtle">
              Not available yet
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 type-b2-md text-foreground-muted">Tracking link</p>
          <a
            href={kit.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="profile-kit-tracking-link"
            className="dash-lift flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:border-brand"
            onClick={() => pushProfileEvent('student_kit_tracking_link_click')}
          >
            <span className="min-w-0 truncate type-b2-regular text-brand">
              {kit.trackingUrl}
            </span>
            <ArrowSquareOut
              size={16}
              className="shrink-0 text-foreground-subtle"
              aria-hidden
            />
          </a>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-surface-muted p-4">
        <p className="type-b2-md text-foreground">
          How to track your student kit
        </p>
        <ol className="mt-3 flex list-inside list-decimal flex-col gap-2 type-b2-regular text-foreground-muted">
          {TRACKING_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </ProfileTabPanel>
  )
}
