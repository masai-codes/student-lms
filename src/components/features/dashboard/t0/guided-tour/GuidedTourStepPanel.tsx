import { ProfilePhotoStep } from './ProfilePhotoStep'
import { DownloadAppContent } from '@/components/features/layout/DownloadAppContent'
import type { GuidedTourStep } from './steps'

interface GuidedTourStepPanelProps {
  step: GuidedTourStep
  idCardUrl: string | null
  /** The already-saved profile photo, if any (for the profile-photo step). */
  profilePhotoUrl: string | null
  /** Called when a step's action completes, so the tour can refetch progress. */
  onCompleted: () => void
}

const CARD = 'flex flex-col items-start gap-4 rounded-xl border border-gray-200 p-6'

/**
 * Renders the active fixed (non-video) guided-tour step. Profile photo captures
 * via webcam; download-app shows the reusable app QR content (informational —
 * it completes only when the mobile app registers a device); the ID card reveals
 * the issued card. Agreement / documents / student-kit are forthcoming.
 */
export function GuidedTourStepPanel({ step, idCardUrl, profilePhotoUrl, onCompleted }: GuidedTourStepPanelProps) {
  if (step.action === 'profile-photo') {
    return <ProfilePhotoStep existingPhotoUrl={profilePhotoUrl} onCompleted={onCompleted} />
  }

  if (step.action === 'download-app') {
    // Informational only — this step completes when the mobile app creates a
    // `user_device_tokens` row (drives `downloadAppCompleted`), never by a click.
    return (
      <div
        className="flex h-full items-center justify-center rounded-xl border border-gray-200 p-6"
        data-testid="guided-tour-panel-download-app"
      >
        <DownloadAppContent className="mx-auto w-full max-w-[600px]" />
      </div>
    )
  }

  if (step.action === 'id-card' && idCardUrl) {
    return (
      <div className={CARD} data-testid="guided-tour-panel-id-card">
        <p className="text-sm text-gray-600">Your student ID card is ready.</p>
        <img src={idCardUrl} alt="Student ID card" className="w-full max-w-sm rounded-lg border border-gray-200" />
      </div>
    )
  }

  if (step.action === 'agreement') {
    return (
      <div className={CARD} data-testid="guided-tour-panel-agreement">
        <p className="text-sm font-medium text-gray-900">{step.title}</p>
        <p className="text-sm text-gray-500">The agreement form will come here.</p>
      </div>
    )
  }

  // documents / student-kit — full flows arrive in a later slice.
  return (
    <div className={CARD} data-testid="guided-tour-panel-pending">
      <p className="text-sm font-medium text-gray-900">{step.title}</p>
      <p className="text-sm text-gray-500">This step will be available here shortly.</p>
    </div>
  )
}
