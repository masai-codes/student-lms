import { ProfilePhotoStep } from './ProfilePhotoStep'
import { AgreementStep } from './agreement/AgreementStep'
import { StudentKitStep } from './StudentKitStep'
import { DocumentUploadStep } from './DocumentUploadStep'
import { IdCardStep } from './IdCardStep'
import { GuidedTourLockedNotice } from './GuidedTourLockedNotice'
import { DownloadAppContent } from '@/components/features/layout/DownloadAppContent'
import type { GuidedTourStep } from './steps'

interface GuidedTourStepPanelProps {
  step: GuidedTourStep
  /** The active batch — needed for the on-demand document-status fetch. */
  batchId: number
  /** The already-saved profile photo, if any (for the profile-photo step). */
  profilePhotoUrl: string | null
  /** Called when a step's action completes, so the tour can refetch progress. */
  onCompleted: () => void
}

const CARD = 'flex flex-col items-start gap-4 rounded-xl border border-gray-200 p-6'

/**
 * Renders the active fixed (non-video) guided-tour step by dispatching to its
 * dedicated component: profile-photo (webcam), download-app (QR content),
 * agreement (multi-step form), student-kit, document-upload, and the ID-card
 * reveal.
 */
export function GuidedTourStepPanel({ step, batchId, profilePhotoUrl, onCompleted }: GuidedTourStepPanelProps) {
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

  if (step.action === 'agreement' && step.agreement) {
    return (
      <div data-testid="guided-tour-panel-agreement">
        <AgreementStep section={step.agreement} onCompleted={onCompleted} />
      </div>
    )
  }

  // Documents + student kit are locked until the agreement is signed.
  const lockedMessage = 'Sign your agreement first to unlock this step.'

  if (step.action === 'student-kit' && step.studentKit) {
    return (
      <div data-testid="guided-tour-panel-student-kit">
        {step.locked ? (
          <GuidedTourLockedNotice title={step.title} message={lockedMessage} />
        ) : (
          <StudentKitStep kit={step.studentKit} />
        )}
      </div>
    )
  }

  if (step.action === 'documents') {
    return (
      <div data-testid="guided-tour-panel-documents">
        {step.locked ? (
          <GuidedTourLockedNotice title={step.title} message={lockedMessage} />
        ) : (
          <DocumentUploadStep batchId={batchId} onCompleted={onCompleted} />
        )}
      </div>
    )
  }

  if (step.action === 'id-card' && step.idCard) {
    return (
      <div data-testid="guided-tour-panel-id-card">
        <IdCardStep url={step.idCard.url} unlocked={step.idCard.unlocked} />
      </div>
    )
  }

  return (
    <div className={CARD} data-testid="guided-tour-panel-pending">
      <p className="text-sm font-medium text-gray-900">{step.title}</p>
      <p className="text-sm text-gray-500">This step will be available here shortly.</p>
    </div>
  )
}
