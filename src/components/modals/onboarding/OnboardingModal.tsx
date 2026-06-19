import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Loader2,
  RotateCcw,
  StickyNote,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PendingAgreementSection, PendingFeedbackForm } from '@/server/api/dashboard/getDashboardActionBanners.service'
import { AgreementFlow } from '@/components/modals/onboarding/AgreementFlow'
import { FeedbackFormContent } from '@/components/modals/onboarding/FeedbackModal'
import { AssessNpsContent } from '@/components/modals/onboarding/AssessNpsContent'

interface Step {
  id: string
  label: string
  Icon: LucideIcon
}

// ── Step right-panel: Profile Photo ───────────────────────────────────────────

function PhotoContent({ initialSnapshot, onSave, onPhotoSaved, isActive }: { initialSnapshot: string | null; onSave: (snap: string) => void; onPhotoSaved?: () => void; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [snapshot, setSnapshot] = useState<string | null>(initialSnapshot)
  const [loading, setLoading] = useState(false)
  const [camError, setCamError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [camBlocked, setCamBlocked] = useState(false)

  const startCamera = useCallback(async () => {
    setLoading(true)
    setCamError('')
    setCamBlocked(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      let blocked = false
      try {
        const status = await navigator.permissions.query({ name: 'camera' as PermissionName })
        blocked = status.state === 'denied'
      } catch {
        blocked = true
      }
      setCamBlocked(blocked)
      setCamError(
        blocked
          ? 'Camera access is blocked by your browser.'
          : 'Camera access denied. Please allow camera permission and try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  // Google Meet-style: camera is tied to isActive, not component lifecycle.
  // Turning off the tab = turning off the camera immediately.
  useEffect(() => {
    if (isActive && !snapshot) {
      void startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [isActive, startCamera])

  function handleCapture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg')
    setSnapshot(dataUrl)
    stopCamera()
  }

  function handleRetake() {
    setSnapshot(null)
    void startCamera()
  }

  async function handleSave() {
    if (!snapshot) return
    stopCamera()
    setUploading(true)
    setUploadError('')
    try {
      // 1. Get a presigned PUT URL from the server
      const presignRes = await fetch('/api/profile/photo-upload-url?contentType=image/jpeg')
      if (!presignRes.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, s3Url } = (await presignRes.json()) as { uploadUrl: string; s3Url: string }

      // 2. Convert base64 dataURL to a Blob and upload directly to S3 via presigned URL
      const blob = await fetch(snapshot).then((r) => r.blob())
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      })
      if (!putRes.ok) throw new Error('S3 upload failed')

      // 3. Persist the S3 URL in the DB
      const saveRes = await fetch('/api/profile/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Url }),
      })
      if (!saveRes.ok) throw new Error('Failed to save profile picture')

      onSave(s3Url)
      onPhotoSaved?.()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins' }}>
        Capture Your Photo
      </h3>

      <div
        className="w-full rounded-3xl overflow-hidden relative bg-[#221F1F] flex items-center justify-center"
        style={{ maxWidth: 718, height: 404 }}
      >
        {snapshot ? (
          <img src={snapshot} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onCanPlay={() => setLoading(false)}
              className="w-full h-full object-cover"
              style={{ display: loading || camError ? 'none' : 'block' }}
            />
            {loading && !camError && (
              <Loader2 size={32} className="animate-spin text-white/60" />
            )}
            {camError && (
              <div className="flex flex-col items-center gap-4 px-8">
                <p className="text-white/70 text-sm text-center">{camError}</p>
                {camBlocked ? (
                  <p className="text-white/50 text-xs text-center leading-relaxed">
                    Click the lock / camera icon in your browser's address bar, set Camera to &quot;Allow&quot;, then reload the page.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="flex items-center gap-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none"
                    style={{ height: 40, padding: '0 20px', background: '#6962AC', fontFamily: 'Poppins', fontSize: 14 }}
                  >
                    <Camera size={16} />
                    Allow Camera Permission
                  </button>
                )}
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {!snapshot ? (
        <button
          type="button"
          onClick={handleCapture}
          disabled={loading || !!camError}
          className="flex items-center gap-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ height: 40, padding: '0 20px', background: '#6962AC', fontFamily: 'Poppins', fontSize: 16 }}
        >
          <Camera size={20} />
          Capture
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleRetake}
              disabled={uploading}
              className="flex items-center gap-2 font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ height: 40, padding: '0 20px', fontFamily: 'Poppins', fontSize: 16 }}
            >
              <RotateCcw size={18} style={{ color: '#6962AC' }} />
              Retake
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={uploading}
              className="flex items-center gap-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ height: 40, padding: '0 20px', background: '#6962AC', fontFamily: 'Poppins', fontSize: 16 }}
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : null}
              {uploading ? 'Uploading…' : 'Save & Submit'}
            </button>
          </div>
          {uploadError && (
            <p className="text-sm text-red-500" style={{ fontFamily: 'Poppins' }}>{uploadError}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────────

export function OnboardingModal({
  onClose,
  initialStep,
  showProfilePhoto = false,
  agreementSections = [],
  feedbackForms = [],
  onPhotoSaved,
  onAgreementSubmitted,
  onFeedbackSubmitted,
  onAssessCompleted,
}: {
  onClose: () => void
  initialStep?: string
  showProfilePhoto?: boolean
  agreementSections?: Array<PendingAgreementSection>
  feedbackForms?: Array<PendingFeedbackForm>
  onPhotoSaved?: () => void
  onAgreementSubmitted?: () => void
  onFeedbackSubmitted?: () => void
  onAssessCompleted?: () => void
}) {
  // Freeze steps on mount so completed items don't vanish when the parent
  // re-fetches and removes them from the pending lists.
  const [steps] = useState<Array<Step>>(() => [
    ...(showProfilePhoto ? [{ id: 'photo', label: 'Profile Photo', Icon: Camera }] : []),
    ...agreementSections.map((s) => ({
      id: `agreement-${s.sectionId}`,
      label: `Agreement - ${s.name}`,
      Icon: ClipboardList,
    })),
    ...feedbackForms.filter((f) => f.source === 'nps').map((f) => ({
      id: `feedback-${f.id}`,
      label: `Feedback - ${f.title}`,
      Icon: StickyNote,
    })),
    ...feedbackForms.filter((f) => f.source === 'assess_nps').map((f) => ({
      id: `assess-${f.id}`,
      label: `Feedback - ${f.title}`,
      Icon: StickyNote,
    })),
  ])

  // Keep a stable copy of feedbackForms for title lookups after prop updates
  const initialFeedbackForms = useRef(feedbackForms)

  const defaultStep = initialStep ?? steps[0]?.id ?? ''
  const [activeStep, setActiveStep] = useState(defaultStep)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [photoSnapshot, setPhotoSnapshot] = useState<string | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function markDone(stepId: string) {
    setCompletedSteps((prev) => new Set([...prev, stepId]))
    const idx = steps.findIndex((s) => s.id === stepId)
    if (idx !== -1 && idx < steps.length - 1) {
      setActiveStep(steps[idx + 1].id)
    }
  }

  const doneCount = completedSteps.size

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 top-16 z-30 flex bg-[#FAF9F9] px-8 pb-8 pt-6 gap-6">
        <div className="w-full flex gap-6 mt-6">
          {/* ── Left panel ── */}
          <div className="w-[420px] shrink-0 bg-white rounded-2xl p-5 flex flex-col">
            <h2
              className="leading-7"
              style={{ fontFamily: 'Poppins', fontSize: 20, fontWeight: 600, color: '#111928' }}
            >
              Complete the following steps to have a seamless experience
            </h2>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#DEF7EC' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(doneCount / steps.length) * 100}%`, background: '#31C48D' }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span style={{ fontFamily: 'Poppins', fontSize: 12, color: '#4B5563', fontWeight: 500 }}>
                  Your Progress
                </span>
                <span style={{ fontFamily: 'Poppins', fontSize: 12, color: '#1F2A37', fontWeight: 500 }}>
                  {doneCount} of {steps.length} done
                </span>
              </div>
            </div>

            {/* Step cards */}
            <div className="mt-4 flex flex-col overflow-y-auto min-h-0 flex-1">
              {steps.map((step, i) => {
                const isCompleted = completedSteps.has(step.id)
                const isActive = activeStep === step.id
                const { Icon } = step

                return (
                  <div key={step.id}>
                    <button
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className="w-full flex items-center gap-2 px-3 rounded-lg border transition-colors focus-visible:outline-none"
                      style={{
                        height: 48,
                        background: isActive ? '#EBF5FF' : '#FFFFFF',
                        borderColor: isActive ? '#6962AC' : '#E5E7EB',
                      }}
                    >
                      <span className="shrink-0 flex items-center justify-center size-6">
                        {isCompleted
                          ? <CheckCircle2 size={22} className="text-green-500" />
                          : <Icon size={22} style={{ color: isActive ? '#6962AC' : '#9CA3AF' }} />}
                      </span>
                      <span
                        className="flex-1 text-left text-sm font-medium truncate"
                        style={{ fontFamily: 'Poppins', color: '#1F2A37' }}
                      >
                        {step.label}
                      </span>
                      <ChevronRight size={18} className="text-gray-400 shrink-0" />
                    </button>

                    {i < steps.length - 1 && (
                      <div className="h-4 flex">
                        <div className="w-px bg-gray-300 ml-[23px]" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Skip for now */}
            <div className="mt-auto pt-4">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium underline focus-visible:outline-none"
                style={{ fontFamily: 'Poppins', color: '#6962AC' }}
              >
                Skip for Now
              </button>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex-1 bg-white rounded-2xl overflow-hidden flex flex-col">
            {showProfilePhoto && (
              <div className={activeStep === 'photo' ? 'contents' : 'hidden'}>
                <PhotoContent
                  isActive={activeStep === 'photo'}
                  initialSnapshot={photoSnapshot}
                  onPhotoSaved={onPhotoSaved}
                  onSave={(snap) => {
                    setPhotoSnapshot(snap)
                    markDone('photo')
                  }}
                />
              </div>
            )}

            {steps
              .filter((s) => s.id.startsWith('agreement-'))
              .map((step) => {
                const sectionId = parseInt(step.id.replace('agreement-', ''), 10)
                if (activeStep !== step.id) return null
                return completedSteps.has(step.id) ? (
                  <div key={step.id} className="flex-1 flex flex-col items-center justify-center gap-4 p-10">
                    <div className="size-16 rounded-full bg-green-50 flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-green-500" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                      Agreement Signed
                    </h3>
                    <p className="text-sm text-gray-500 text-center max-w-sm leading-relaxed">
                      You have successfully reviewed and signed your program agreement.
                    </p>
                  </div>
                ) : (
                  <div key={step.id} className="flex-1 min-h-0">
                    <AgreementFlow
                      onSubmit={() => {
                        markDone(step.id)
                        onAgreementSubmitted?.()
                      }}
                      sectionId={sectionId}
                    />
                  </div>
                )
              })}

            {steps
              .filter((s) => s.id.startsWith('feedback-'))
              .map((step) => {
                const formId = parseInt(step.id.replace('feedback-', ''), 10)
                if (activeStep !== step.id) return null
                return (
                  <FeedbackFormContent
                    key={step.id}
                    formId={formId}
                    isOnlyStep={steps.length === 1}
                    onSubmitted={() => {
                      onFeedbackSubmitted?.()
                      markDone(step.id)
                      if (steps.length === 1) onClose()
                    }}
                  />
                )
              })}

            {steps
              .filter((s) => s.id.startsWith('assess-'))
              .map((step) => {
                const formId = parseInt(step.id.replace('assess-', ''), 10)
                if (activeStep !== step.id) return null
                const form = initialFeedbackForms.current.find((f) => f.source === 'assess_nps' && f.id === formId)
                return (
                  <AssessNpsContent
                    key={step.id}
                    formId={formId}
                    title={form?.title ?? 'Assessment'}
                    onDone={() => {
                      markDone(step.id)
                      onAssessCompleted?.()
                    }}
                  />
                )
              })}
          </div>
        </div>
      </div>
    </>
  )
}
