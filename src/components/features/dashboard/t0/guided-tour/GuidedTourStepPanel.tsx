import { APP_DOWNLOAD_URL, PROFILE_PHOTO_PATH } from '../t0Config'
import type { GuidedTourStep } from './steps'

interface GuidedTourStepPanelProps {
  step: GuidedTourStep
  idCardUrl: string | null
}

const CARD = 'flex flex-col items-start gap-4 rounded-xl border border-gray-200 p-6'
const CTA = 'inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:opacity-90'

/**
 * Renders the active fixed (non-video) guided-tour step. Profile photo and app
 * download link out to their destinations; the ID card reveals the issued card.
 * Agreement / documents / student-kit are shown as forthcoming — their full
 * flows land in a later slice.
 */
export function GuidedTourStepPanel({ step, idCardUrl }: GuidedTourStepPanelProps) {
  if (step.action === 'profile-photo') {
    return (
      <div className={CARD} data-testid="guided-tour-panel-profile-photo">
        <p className="text-sm text-gray-600">
          Add a profile photo so mentors and peers can recognise you.
        </p>
        <a href={PROFILE_PHOTO_PATH} className={CTA} data-testid="guided-tour-profile-photo-cta">
          {step.completed ? 'Update photo' : 'Add photo'}
        </a>
      </div>
    )
  }

  if (step.action === 'download-app') {
    return (
      <div className={CARD} data-testid="guided-tour-panel-download-app">
        <p className="text-sm text-gray-600">
          Install the mobile app to get live-session reminders and learn on the go.
        </p>
        <a href={APP_DOWNLOAD_URL} target="_blank" rel="noreferrer" className={CTA} data-testid="guided-tour-download-app-cta">
          {step.completed ? 'Open app' : 'Download app'}
        </a>
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
