import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Camera, CheckCircle } from '@phosphor-icons/react'
import Webcam from 'react-webcam'
import { uploadProfilePhoto } from '@/lib/api/dashboard/dashboardApi'

interface ProfilePhotoStepProps {
  /** The already-saved profile photo, if any — shown with a Retake option. */
  existingPhotoUrl: string | null
  /** Called after the photo is stored, so the tour can refetch progress. */
  onCompleted: () => void
}

const VIDEO_CONSTRAINTS: MediaTrackConstraints = { facingMode: 'user' }
const CIRCLE = 'flex size-48 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100'
const BTN_SOLID = 'inline-flex h-11 items-center justify-center rounded-lg bg-[#6962AC] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60'
const BTN_OUTLINE = 'inline-flex h-11 items-center justify-center rounded-lg border border-[#6962AC] px-5 text-sm font-semibold text-[#6962AC] hover:bg-[#6962AC]/5'

/**
 * Profile-photo capture step: enable the front camera, capture a still, then
 * submit it. The image is uploaded (as a base64 data URL) to the backend, which
 * stores it in S3 + `profiles.meta.profile_pic` / `users.profile_photo_path`.
 */
export function ProfilePhotoStep({ existingPhotoUrl, onCompleted }: ProfilePhotoStepProps) {
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
      className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 md:flex-row md:items-start md:justify-between"
      data-testid="guided-tour-panel-profile-photo"
    >
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Update your profile photo</h3>
        <ol className="flex flex-col gap-3 text-sm text-gray-600">
          <li>1. Click on <strong>ENABLE CAMERA</strong> to start your device camera.</li>
          <li>2. Make sure you are seated in a well lit area.</li>
          <li>3. Click on <strong>CAPTURE PHOTO</strong> to get clicked.</li>
        </ol>
        {mutation.isError ? (
          <p className="text-sm text-red-600" data-testid="guided-tour-profile-photo-error">
            Couldn&apos;t upload your photo. Please try again.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-4">
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
          <div className={CIRCLE} data-testid="guided-tour-profile-photo-placeholder">
            <Camera className="size-16 text-gray-400" aria-hidden />
          </div>
        )}

        {mutation.isSuccess ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600" data-testid="guided-tour-profile-photo-done">
            <CheckCircle weight="fill" className="size-5" aria-hidden />
            Photo updated
          </p>
        ) : captureImage ? (
          <div className="flex gap-2">
            <button type="button" onClick={retake} className={BTN_OUTLINE} data-testid="guided-tour-profile-photo-retake">
              Retake
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate(captureImage)}
              disabled={mutation.isPending}
              className={BTN_SOLID}
              data-testid="guided-tour-profile-photo-submit"
            >
              {mutation.isPending ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        ) : cameraEnabled ? (
          <button type="button" onClick={capture} className={BTN_SOLID} data-testid="guided-tour-profile-photo-capture">
            Capture Photo
          </button>
        ) : existingPhotoUrl ? (
          <div className="flex flex-col items-center gap-2">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600" data-testid="guided-tour-profile-photo-done">
              <CheckCircle weight="fill" className="size-5" aria-hidden />
              Photo added
            </p>
            <button type="button" onClick={retake} className={BTN_OUTLINE} data-testid="guided-tour-profile-photo-retake">
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
