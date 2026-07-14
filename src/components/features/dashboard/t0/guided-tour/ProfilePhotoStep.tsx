import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Camera, CheckCircle } from '@phosphor-icons/react'
import Webcam from 'react-webcam'
import { uploadProfilePhoto } from '@/lib/api/dashboard/dashboardApi'
import { pushDashboardEvent } from '../../shared/dashboardAnalytics'

interface ProfilePhotoStepProps {
  /** The already-saved profile photo, if any — shown with a Retake option. */
  existingPhotoUrl: string | null
  /** Called after the photo is stored, so the tour can refetch progress. */
  onCompleted: () => void
}

const VIDEO_CONSTRAINTS: MediaTrackConstraints = { facingMode: 'user' }
const CIRCLE =
  'flex aspect-square w-48 max-w-full shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted sm:w-64 lg:w-72'
const BTN_SOLID =
  'inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-60'
const BTN_OUTLINE =
  'inline-flex h-11 items-center justify-center rounded-lg border border-brand px-5 text-sm font-semibold text-brand hover:bg-brand/5'

/**
 * Profile-photo capture step: enable the front camera, capture a still, then
 * submit it. The image is uploaded (as a base64 data URL) to the backend, which
 * stores it in S3 + `profiles.meta.profile_pic` / `users.profile_photo_path`.
 */
export function ProfilePhotoStep({
  existingPhotoUrl,
  onCompleted,
}: ProfilePhotoStepProps) {
  const webcamRef = useRef<Webcam>(null)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [captureImage, setCaptureImage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (image: string) => uploadProfilePhoto(image),
    onSuccess: onCompleted,
  })

  const capture = () => {
    const shot = webcamRef.current?.getScreenshot()
    if (shot) {
      setCaptureImage(shot)
      setCameraEnabled(false)
    }
  }

  const retake = () => {
    setCaptureImage(null)
    setCameraEnabled(true)
    mutation.reset()
  }

  return (
    <div
      className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-4 sm:p-6 lg:flex-row lg:items-start lg:justify-between"
      data-testid="guided-tour-panel-profile-photo"
    >
      <div className="flex min-w-0 flex-col gap-3 lg:flex-1">
        <h3 className="text-lg font-semibold text-foreground">
          Update your profile photo
        </h3>
        <ol className="flex flex-col gap-3 text-sm text-foreground-muted">
          <li>
            1. Click on <strong>ENABLE CAMERA</strong> to start your device
            camera.
          </li>
          <li>2. Make sure you are seated in a well lit area.</li>
          <li>
            3. Click on <strong>CAPTURE PHOTO</strong> to get clicked.
          </li>
        </ol>
        {mutation.isError ? (
          <p
            className="text-sm text-danger"
            data-testid="guided-tour-profile-photo-error"
          >
            Couldn&apos;t upload your photo. Please try again.
          </p>
        ) : null}
      </div>

      <div className="flex w-full flex-col items-center gap-4 lg:w-auto lg:shrink-0">
        {captureImage ? (
          <img
            src={captureImage}
            alt="Captured profile photo"
            className={`${CIRCLE} object-cover`}
            data-testid="guided-tour-profile-photo-preview"
          />
        ) : cameraEnabled ? (
          <div className={CIRCLE}>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={VIDEO_CONSTRAINTS}
              mirrored
              className="size-full object-cover"
              data-testid="guided-tour-profile-photo-webcam"
            />
          </div>
        ) : existingPhotoUrl ? (
          <img
            src={existingPhotoUrl}
            alt="Your profile photo"
            className={`${CIRCLE} object-cover`}
            data-testid="guided-tour-profile-photo-existing"
          />
        ) : (
          <div
            className={CIRCLE}
            data-testid="guided-tour-profile-photo-placeholder"
          >
            <Camera className="size-20 text-foreground-subtle" aria-hidden />
          </div>
        )}

        {mutation.isSuccess ? (
          <p
            className="inline-flex items-center gap-1.5 text-sm font-medium text-success"
            data-testid="guided-tour-profile-photo-done"
          >
            <CheckCircle weight="fill" className="size-5" aria-hidden />
            Photo updated
          </p>
        ) : captureImage ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={retake}
              className={BTN_OUTLINE}
              data-testid="guided-tour-profile-photo-retake"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={() => {
                pushDashboardEvent(
                  'l_dashboard_guided_tour_profile_photo_submit',
                )
                mutation.mutate(captureImage)
              }}
              disabled={mutation.isPending}
              className={BTN_SOLID}
              data-testid="guided-tour-profile-photo-submit"
            >
              {mutation.isPending ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        ) : cameraEnabled ? (
          <button
            type="button"
            onClick={() => {
              pushDashboardEvent(
                'l_dashboard_guided_tour_profile_photo_capture',
              )
              capture()
            }}
            className={BTN_SOLID}
            data-testid="guided-tour-profile-photo-capture"
          >
            Capture Photo
          </button>
        ) : existingPhotoUrl ? (
          <div className="flex flex-col items-center gap-2">
            <p
              className="inline-flex items-center gap-1.5 text-sm font-medium text-success"
              data-testid="guided-tour-profile-photo-done"
            >
              <CheckCircle weight="fill" className="size-5" aria-hidden />
              Photo added
            </p>
            <button
              type="button"
              onClick={retake}
              className={BTN_OUTLINE}
              data-testid="guided-tour-profile-photo-retake"
            >
              Retake
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCameraEnabled(true)}
            className={BTN_OUTLINE}
            data-testid="guided-tour-profile-photo-enable"
          >
            Enable Camera
          </button>
        )}
      </div>
    </div>
  )
}
