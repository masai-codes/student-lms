import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Lock,
  Play,
  Video,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fetchT0FlowLectures, recordT0FlowStepComplete } from '@/lib/api/dashboard/dashboardApi'
import type { T0FlowLectureItem } from '@/server/api/dashboard/getT0FlowLectures.service'
import type { BatchT0Status } from '@/server/api/dashboard/getT0FlowStatus.service'
import { PhotoContent } from '@/components/modals/onboarding/OnboardingModal'
import { AgreementFlow } from '@/components/modals/onboarding/AgreementFlow'
import { DownloadAppModal } from '@/components/features/layout/DownloadAppModal'

// ── Types ─────────────────────────────────────────────────────────────────────

type StepStatus = 'completed' | 'active' | 'pending'
type StepKind = 'lecture' | 'profile-photo' | 'download-app' | 'legal-agreement'

interface T0Step {
  id: string
  lectureId: number | null
  label: string
  Icon: LucideIcon
  videoUrl: string | null
  kind: StepKind
  sectionId?: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function iconForType(lectureType: string): LucideIcon {
  return lectureType === 'live' ? Video : Play
}

function lectureItemsToSteps(items: Array<T0FlowLectureItem>): Array<T0Step> {
  return items.map((item) => ({
    id: item.id,
    lectureId: item.lectureId,
    label: item.title,
    Icon: iconForType(item.lectureType),
    videoUrl: item.videoUrl,
    kind: 'lecture',
  }))
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" stroke="#E5E7EB" strokeWidth="2.5" />
      <path d="M11 2 A9 9 0 0 1 20 11" stroke="#6962AC" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function StepIcon({ status, Icon, isPlaying }: { status: StepStatus; Icon: LucideIcon; isPlaying?: boolean }) {
  if (status === 'completed') return <CheckCircle2 size={22} className="text-green-500" />
  if (status === 'active') {
    if (isPlaying) return <SpinnerIcon />
    return (
      <span className="flex items-center justify-center size-[22px] rounded-full" style={{ background: '#6962AC' }}>
        <Icon size={13} className="text-white" />
      </span>
    )
  }
  return (
    <span className="flex items-center justify-center size-[22px] rounded-full border border-gray-300 bg-white">
      <Icon size={13} className="text-gray-400" />
    </span>
  )
}

function VideoPlayer({
  title,
  videoUrl,
  onPlayingChange,
  onVideoEnded,
}: {
  title: string
  videoUrl: string | null
  onPlayingChange?: (playing: boolean) => void
  onVideoEnded?: (durationSeconds: number) => void
}) {
  return (
    <div className="flex flex-col">
      <h2 className="text-center font-bold mb-6" style={{ fontFamily: 'Poppins', fontSize: 20, color: '#111928' }}>
        {title}
      </h2>
      <div className="w-full rounded-2xl bg-black overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
        {videoUrl ? (
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            className="w-full h-full object-contain"
            onPlay={() => onPlayingChange?.(true)}
            onPause={() => onPlayingChange?.(false)}
            onEnded={(e) => {
              onPlayingChange?.(false)
              onVideoEnded?.(e.currentTarget.duration)
            }}
          />
        ) : (
          <button
            type="button"
            className="flex items-center justify-center size-16 rounded-full bg-red-500 hover:bg-red-600 transition-colors focus-visible:outline-none"
            aria-label="Play video"
          >
            <Play size={28} className="text-white ml-1" fill="white" />
          </button>
        )}
      </div>
    </div>
  )
}


function ProfilePhotoUploaded({ photoUrl }: { photoUrl: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <h2 className="text-center font-bold" style={{ fontFamily: 'Poppins', fontSize: 20, color: '#111928' }}>
        Profile Photo
      </h2>
      <p className="text-sm" style={{ fontFamily: 'Poppins', color: '#4B5563' }}>
        Profile Image Already uploaded
      </p>
      <img
        src={photoUrl}
        alt="Profile"
        className="size-40 rounded-full object-cover border-4 border-white shadow-md"
      />
    </div>
  )
}

function IdCardLocked() {
  return (
    <div className="mt-2 rounded-xl overflow-hidden flex items-center gap-4 p-4" style={{ background: '#EEF2FF' }}>
      <div className="relative shrink-0 w-[100px] h-[72px] rounded-lg overflow-hidden" style={{ background: '#C7D2FE' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock size={28} style={{ color: '#4338CA' }} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-sm" style={{ fontFamily: 'Poppins', color: '#1F2A37' }}>ID Card</span>
        <span className="text-xs leading-5" style={{ fontFamily: 'Poppins', color: '#4B5563' }}>
          Complete the above steps to unlock your ID card
        </span>
      </div>
    </div>
  )
}

function StepList({
  steps,
  activeStepIndex,
  completedSteps,
  isVideoPlaying,
  onStepClick,
}: {
  steps: Array<T0Step>
  activeStepIndex: number
  completedSteps: Set<string>
  isVideoPlaying: boolean
  onStepClick: (i: number) => void
}) {
  return (
    <>
      {steps.map((step, i) => {
        const isActive = i === activeStepIndex
        const status: StepStatus = completedSteps.has(step.id) ? 'completed' : isActive ? 'active' : 'pending'
        const { Icon } = step
        return (
          <div key={step.id}>
            <button
              type="button"
              onClick={() => onStepClick(i)}
              className="w-full flex items-center gap-2 px-3 rounded-lg border transition-colors focus-visible:outline-none"
              style={{
                height: 48,
                background: isActive ? '#EBF5FF' : '#FFFFFF',
                borderColor: isActive ? '#6962AC' : '#E5E7EB',
              }}
            >
              <span className="shrink-0 flex items-center justify-center size-6">
                <StepIcon status={status} Icon={Icon} isPlaying={isActive && isVideoPlaying} />
              </span>
              <span className="flex-1 min-w-0 text-left text-sm font-medium truncate" style={{ fontFamily: 'Poppins', color: '#1F2A37' }}>
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
    </>
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────────

export function T0FlowModal({
  onClose,
  batches,
  profilePhotoUrl,
  downloadAppCompleted,
  onPhotoSaved,
  onAgreementSubmitted,
}: {
  onClose: () => void
  batches: Array<BatchT0Status>
  profilePhotoUrl: string | null
  downloadAppCompleted: boolean
  onPhotoSaved?: () => void
  onAgreementSubmitted?: () => void
}) {
  const [selectedBatchId, setSelectedBatchId] = useState<number | undefined>(batches[0]?.batchId)
  const [activeTab, setActiveTab] = useState<'lms' | 'program'>('lms')
  const [lmsActiveIndex, setLmsActiveIndex] = useState(0)
  const [programActiveIndex, setProgramActiveIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    const initial: Array<string> = []
    if (profilePhotoUrl) initial.push('profile-photo')
    if (downloadAppCompleted) initial.push('download-app')
    return new Set(initial)
  })
  const [photoSnapshot, setPhotoSnapshot] = useState<string | null>(profilePhotoUrl)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  const selectedBatch = batches.find((b) => b.batchId === selectedBatchId) ?? batches[0]
  const showProgramTab = selectedBatch?.showProgramTab ?? false

  const { data: lecturesData, isLoading: isLecturesLoading } = useQuery({
    queryKey: ['t0-flow-lectures', selectedBatchId],
    queryFn: () => fetchT0FlowLectures(selectedBatchId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!lecturesData) return
    const ids: Array<string> = []
    const completedLecIds = new Set(lecturesData.completedLectureIds ?? [])
    for (const item of [...lecturesData.lmsLectures, ...lecturesData.programLectures]) {
      if (completedLecIds.has(item.lectureId)) ids.push(item.id)
    }
    for (const section of lecturesData.legalAgreementSections ?? []) {
      if (section.completed) ids.push(`legal-${section.sectionId}`)
    }
    if (!ids.length) return
    setCompletedSteps((prev) => new Set([...prev, ...ids]))
  }, [lecturesData])

  const lmsSteps: Array<T0Step> = [
    ...lectureItemsToSteps(lecturesData?.lmsLectures ?? []),
    { id: 'profile-photo', lectureId: null, label: 'Profile Photo', Icon: Camera, videoUrl: null, kind: 'profile-photo' as StepKind },
    { id: 'download-app', lectureId: null, label: 'Download Masai Learn App', Icon: Download, videoUrl: null, kind: 'download-app' as StepKind },
  ]

  const programSteps: Array<T0Step> = [
    ...lectureItemsToSteps(lecturesData?.programLectures ?? []),
    ...(lecturesData?.legalAgreementSections ?? []).map((s) => ({
      id: `legal-${s.sectionId}`,
      lectureId: null,
      label: 'Agreement Signing',
      Icon: FileText,
      videoUrl: null,
      kind: 'legal-agreement' as StepKind,
      sectionId: s.sectionId,
    })),
  ]

  const isLms = activeTab === 'lms'
  const steps = isLms ? lmsSteps : programSteps
  const activeStepIndex = isLms ? lmsActiveIndex : programActiveIndex
  const setActiveStepIndex = isLms ? setLmsActiveIndex : setProgramActiveIndex

  const doneCount = steps.filter((s) => completedSteps.has(s.id)).length
  const activeStep = steps[activeStepIndex] ?? null

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])


  const prev = () => { setIsVideoPlaying(false); setActiveStepIndex((i) => Math.max(0, i - 1)) }
  const next = () => { setIsVideoPlaying(false); setActiveStepIndex((i) => Math.min(steps.length - 1, i + 1)) }

  function markDone(stepId: string) {
    setCompletedSteps((prev) => new Set([...prev, stepId]))
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-[300] bg-[#FAF9F9] px-8 pb-8 pt-6 flex flex-col">
      <div className="w-full flex gap-6 mt-6 flex-1 min-h-0">

        {/* ── Left panel ── */}
        <div className="w-[420px] shrink-0 bg-white rounded-2xl p-5 flex flex-col relative">

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex items-center justify-center size-8 rounded-full text-gray-500 hover:bg-gray-100 transition-colors focus-visible:outline-none"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <h2 className="font-semibold leading-7 pr-8" style={{ fontFamily: 'Poppins', fontSize: 20, color: '#111928' }}>
            Let's get you started
          </h2>

          {/* Batch selector */}
          {batches.length > 0 && (
            <div className="mt-4">
              <label className="block text-xs font-medium mb-1.5" style={{ fontFamily: 'Poppins', color: '#6B7280' }}>
                Batch
              </label>
              <div className="relative">
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(Number(e.target.value))
                    setActiveTab('lms')
                    setLmsActiveIndex(0)
                    setProgramActiveIndex(0)
                  }}
                  className="w-full appearance-none rounded-xl border px-4 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6962AC]"
                  style={{ height: 44, fontFamily: 'Poppins', borderColor: '#E5E7EB', color: '#111928', background: '#FFFFFF' }}
                >
                  {batches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>{b.batchName}</option>
                  ))}
                </select>
                <ChevronRight size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400" />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {(['lms', ...(showProgramTab ? ['program' as const] : [])] as const).map((tab) => {
              const active = activeTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none"
                  style={{
                    fontFamily: 'Poppins',
                    background: active ? '#EBF5FF' : '#FFFFFF',
                    color: active ? '#6962AC' : '#9CA3AF',
                    border: `1.5px solid ${active ? '#6962AC' : '#E5E7EB'}`,
                  }}
                >
                  {tab === 'lms' ? 'LMS Walkthrough' : 'Program Onboarding'}
                </button>
              )
            })}
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#DEF7EC' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: steps.length ? `${(doneCount / steps.length) * 100}%` : '0%', background: '#31C48D' }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span style={{ fontFamily: 'Poppins', fontSize: 12, color: '#4B5563', fontWeight: 500 }}>Your Progress</span>
              <span style={{ fontFamily: 'Poppins', fontSize: 12, color: '#1F2A37', fontWeight: 500 }}>{doneCount} of {steps.length} done</span>
            </div>
          </div>

          {/* Step list */}
          <div className="mt-4 flex flex-col overflow-y-auto min-h-0 flex-1">
            {isLecturesLoading ? (
              <div className="flex flex-col gap-0">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-12 rounded-lg bg-gray-100 animate-pulse" />
                    {i < 3 && <div className="h-4 flex"><div className="w-px bg-gray-200 ml-[23px]" /></div>}
                  </div>
                ))}
              </div>
            ) : steps.length > 0 ? (
              <StepList
                steps={steps}
                activeStepIndex={activeStepIndex}
                completedSteps={completedSteps}
                isVideoPlaying={isVideoPlaying}
                onStepClick={(i) => {
                  if (steps[i]?.kind === 'download-app') {
                    setDownloadModalOpen(true)
                    return
                  }
                  setIsVideoPlaying(false)
                  setActiveStepIndex(i)
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400" style={{ fontFamily: 'Poppins' }}>
                No content available yet
              </div>
            )}
            {!isLms && !isLecturesLoading && steps.length > 0 && <IdCardLocked />}
          </div>

          {/* Info banner — LMS tab only */}
          {isLms && (
            <div className="mt-4 shrink-0 flex items-start gap-2 px-3 py-2.5 rounded-lg" style={{ background: '#EBF5FF' }}>
              <span className="shrink-0 flex items-center justify-center size-5 rounded-full mt-0.5" style={{ background: '#3B82F6' }}>
                <span className="text-white font-bold" style={{ fontSize: 11 }}>i</span>
              </span>
              <p className="text-xs leading-5" style={{ fontFamily: 'Poppins', color: '#1E429F' }}>
                Make sure to watch the complete video to update your progress
              </p>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 bg-white rounded-2xl overflow-hidden flex flex-col justify-center px-10 py-8">
          {activeStep ? (
            <>
              {activeStep.kind === 'profile-photo' ? (
                photoSnapshot ? (
                  <ProfilePhotoUploaded photoUrl={photoSnapshot} />
                ) : (
                  <PhotoContent
                    initialSnapshot={null}
                    onSave={(snap) => setPhotoSnapshot(snap)}
                    onPhotoSaved={() => { markDone('profile-photo'); onPhotoSaved?.() }}
                    isActive
                  />
                )
              ) : activeStep.kind === 'legal-agreement' ? (
                completedSteps.has(activeStep.id) ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <CheckCircle2 size={48} className="text-green-500" />
                    <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins' }}>Agreement Signed</h3>
                    <p className="text-sm text-gray-500 text-center" style={{ fontFamily: 'Poppins' }}>
                      You have successfully reviewed and signed your program agreement.
                    </p>
                  </div>
                ) : (
                  <AgreementFlow
                    sectionId={activeStep.sectionId}
                    onSubmit={() => {
                      markDone(activeStep.id)
                      onAgreementSubmitted?.()
                    }}
                  />
                )
              ) : (
                <VideoPlayer
                  title={activeStep.label}
                  videoUrl={activeStep.videoUrl}
                  onPlayingChange={setIsVideoPlaying}
                  onVideoEnded={(durationSeconds) => {
                    if (activeStep.kind !== 'lecture') return
                    markDone(activeStep.id)
                    if (activeStep.lectureId && selectedBatchId) {
                      void recordT0FlowStepComplete(
                        activeStep.lectureId,
                        selectedBatchId,
                        activeTab,
                        durationSeconds,
                      )
                    }
                  }}
                />
              )}

              {activeStep.kind !== 'profile-photo' && activeStep.kind !== 'legal-agreement' && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    type="button"
                    onClick={prev}
                    disabled={activeStepIndex === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-40"
                    style={{ fontFamily: 'Poppins', background: '#EBF5FF', color: '#6962AC' }}
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    disabled={activeStepIndex === steps.length - 1}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-40"
                    style={{ fontFamily: 'Poppins', background: '#EBF5FF', color: '#6962AC' }}
                  >
                    Next
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center text-sm text-gray-400" style={{ fontFamily: 'Poppins' }}>
              No content available yet
            </div>
          )}
        </div>

      </div>

      <DownloadAppModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} />
    </div>
  )
}
