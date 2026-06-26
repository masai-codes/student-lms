import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  FolderUp,
  Lock,
  Package,
  Play,
  Video,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fetchT0FlowLectures, fetchT0FlowStudentStatus, recordT0FlowStepComplete } from '@/lib/api/dashboard/dashboardApi'
import type { T0FlowStudentStatusResult } from '@/server/api/dashboard/getT0FlowStudentStatus.service'
import type { T0FlowLectureItem } from '@/server/api/dashboard/getT0FlowLectures.service'
import type { BatchT0Status } from '@/server/api/dashboard/getT0FlowStatus.service'
import { PhotoContent } from '@/components/modals/onboarding/OnboardingModal'
import { AgreementFlow, MobileAgreementPlaceholder } from '@/components/modals/onboarding/AgreementFlow'
import { DownloadAppModal } from '@/components/features/layout/DownloadAppModal'
import { PaymentBanner } from '@/components/features/dashboard/section-banner/PaymentBanner'
import type { PaymentBannerInfo } from '@/server/api/dashboard/getPaymentBannerInfo.service'

// ── Types ─────────────────────────────────────────────────────────────────────

type StepStatus = 'completed' | 'active' | 'pending'
type StepKind = 'lecture' | 'profile-photo' | 'download-app' | 'legal-agreement' | 'document-upload' | 'student-kit'

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
            onPause={(e) => { if (!e.currentTarget.seeking) onPlayingChange?.(false) }}
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

function IdCardModal({ idCardUrl, onClose }: { idCardUrl: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end lg:items-center justify-center lg:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full lg:max-w-md rounded-t-3xl lg:rounded-2xl bg-white p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile/tablet only */}
        <div className="lg:hidden flex justify-center -mt-2 mb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        {/* Close button — desktop only */}
        <button
          type="button"
          onClick={onClose}
          className="hidden lg:flex absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Poppins', color: '#111928' }}>Woohoo! 🥳</h2>
          <p className="text-sm" style={{ fontFamily: 'Poppins', color: '#6B7280' }}>You've unlocked your Student ID!</p>
        </div>
        <img src={idCardUrl} alt="ID Card" className="w-full rounded-xl object-contain border border-gray-200" />
        <div className="flex gap-3">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(idCardUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors hover:bg-gray-50 focus-visible:outline-none"
            style={{ fontFamily: 'Poppins', borderColor: '#E5E7EB', color: '#0A66C2' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Share
          </a>
          <a
            href={idCardUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-colors focus-visible:outline-none"
            style={{ fontFamily: 'Poppins', background: '#6962AC' }}
          >
            <Download size={18} />
            Download
          </a>
        </div>
      </div>
    </div>
  )
}

function IdCard({ allDone, idCardUrl }: { allDone: boolean; idCardUrl: string | null }) {
  const [modalOpen, setModalOpen] = useState(false)

  const lockedText = allDone
    ? 'Your ID card will be generated within 30 minutes. We are currently reviewing your information, and once the verification is complete, your ID card will be created automatically.'
    : 'Complete the above steps to unlock your ID card'

  if (allDone && idCardUrl) {
    // SS2: unlocked — show real card
    return (
      <>
        <div
          className="mt-2 rounded-xl overflow-hidden flex items-center gap-4 p-4 cursor-pointer group"
          style={{ background: '#EEF2FF' }}
          onClick={() => setModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
        >
          <img
            src={idCardUrl}
            alt="ID Card"
            className="shrink-0 rounded-lg object-cover border border-indigo-100"
            style={{ width: '45%', aspectRatio: '1.586 / 1' }}
          />
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <span className="font-bold text-base" style={{ fontFamily: 'Poppins', color: '#1F2A37' }}>ID Card</span>
            <span className="text-sm leading-6" style={{ fontFamily: 'Poppins', color: '#4B5563' }}>
              Hurray! You have unlocked your ID card.
            </span>
          </div>
          <ChevronRight size={22} className="shrink-0 text-teal-500 group-hover:translate-x-0.5 transition-transform" />
        </div>
        {modalOpen && <IdCardModal idCardUrl={idCardUrl} onClose={() => setModalOpen(false)} />}
      </>
    )
  }

  // SS1 / SS1b: locked or pending generation
  return (
    <div className="mt-2 rounded-xl overflow-hidden flex items-center gap-4 p-4" style={{ background: '#EEF2FF' }}>
      <div className="relative shrink-0 rounded-lg overflow-hidden" style={{ width: '45%', aspectRatio: '1.586 / 1' }}>
        <img src="/Studentid.png" alt="ID Card" className="w-full h-full object-cover" style={{ filter: 'blur(3px)' }} />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(99,92,172,0.25)' }}>
          <Lock size={28} className="text-white drop-shadow" />
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <span className="font-bold text-base" style={{ fontFamily: 'Poppins', color: '#1F2A37' }}>ID Card</span>
        <span className="text-xs leading-5" style={{ fontFamily: 'Poppins', color: '#4B5563' }}>{lockedText}</span>
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

// ── Shared redirect card ──────────────────────────────────────────────────────
function RedirectCard({ heading, description }: { heading: string; description: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-center" style={{ fontFamily: 'Poppins', color: '#111928' }}>{heading}</h2>
      <div className="rounded-2xl p-6 flex flex-col items-center gap-5" style={{ background: '#F9FAFB' }}>
        <img src="/redirection.svg" alt="Redirecting" className="w-16 h-16 object-contain" />
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-lg font-bold" style={{ fontFamily: 'Poppins', color: '#1A202C' }}>Redirecting you to Admissions</span>
          <span className="text-sm leading-6 max-w-xs" style={{ fontFamily: 'Poppins', color: '#6B7280' }}>{description}</span>
        </div>
        <span className="text-sm text-center" style={{ fontFamily: 'Poppins', color: '#6B7280' }}>
          Contact support if you need the Admissions portal link.
        </span>
      </div>
    </div>
  )
}

// ── Shared success card (SS2 / SS4) ──────────────────────────────────────────
function SuccessCard({
  heading,
  title,
  description,
  note,
}: {
  heading: string
  title: string
  description: string
  note?: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-center" style={{ fontFamily: 'Poppins', color: '#111928' }}>{heading}</h2>
      <div className="rounded-2xl p-6 flex flex-col items-center gap-5" style={{ background: '#F9FAFB' }}>
        <span className="flex items-center justify-center size-16 rounded-full" style={{ background: '#0E9F6E' }}>
          <Check size={32} strokeWidth={3} className="text-white" />
        </span>
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-xl font-bold" style={{ fontFamily: 'Poppins', color: '#111928' }}>{title}</span>
          <span className="text-sm leading-6 max-w-xs" style={{ fontFamily: 'Poppins', color: '#6B7280' }}>{description}</span>
        </div>
        {note && (
          <div className="w-full rounded-xl px-4 py-3 text-sm text-center" style={{ background: '#EBF5FF', color: '#3F83F8', fontFamily: 'Poppins' }}>
            {note}
          </div>
        )}
      </div>
    </div>
  )
}

function DocumentUploadContent({ status }: { status: T0FlowStudentStatusResult['documents'] }) {
  if (!status) {
    return <div className="flex items-center justify-center h-32"><div className="size-8 rounded-full border-2 border-[#6962AC] border-t-transparent animate-spin" /></div>
  }
  if (status.documentsUploaded) {
    // SS2: success
    return (
      <SuccessCard
        heading="Document Upload"
        title="Documents Submitted"
        description="Your documents have been uploaded successfully"
      />
    )
  }
  // SS1: redirect
  return (
    <RedirectCard
      heading="Document Upload"
      description="You'll now be redirected to the Admissions platform to upload your documents"
    />
  )
}

function StudentKitContent({ status }: { status: T0FlowStudentStatusResult['kit'] }) {
  const [copied, setCopied] = useState(false)

  function copyId(id: string) {
    void navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!status) {
    return <div className="flex items-center justify-center h-32"><div className="size-8 rounded-full border-2 border-[#6962AC] border-t-transparent animate-spin" /></div>
  }

  if (!status.detailsFilled) {
    // SS3: redirect + note
    return (
      <div className="flex flex-col gap-4">
        <RedirectCard
          heading="Student Kit Details"
          description="You'll now be redirected to the Admissions platform to submit your student kit details"
        />
        <p className="text-sm text-center leading-6 px-2" style={{ fontFamily: 'Poppins', color: '#6B7280' }}>
          Once details are submitted, the student kit tracking details will be shared within 48 hours.
          You can view the tracking information in your profile.
        </p>
      </div>
    )
  }

  if (!status.tracking) {
    // SS4: details filled, no tracking yet
    return (
      <SuccessCard
        heading="Student Kit Details"
        title="Student Kit Details Submitted"
        description={`Your details have been successfully submitted.\nTracking details will be shared soon.`}
        note="Tracking details will appear here once available"
      />
    )
  }

  // SS5: tracking available
  const { trackingId, trackingUrl } = status.tracking
  return (
    <div className="flex flex-col gap-5 py-2 overflow-y-auto">
      <h2 className="text-xl font-bold text-center" style={{ fontFamily: 'Poppins', color: '#111928' }}>Student Kit Details</h2>

      {/* Tracking details card */}
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: '#F9FAFB' }}>
        <span className="font-bold text-base" style={{ fontFamily: 'Poppins', color: '#111928' }}>Tracking details</span>
        <div className="grid grid-cols-2 gap-3">
          {trackingId && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ fontFamily: 'Poppins', color: '#6B7280' }}>Tracking ID</span>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: '#E5E7EB', background: '#FFFFFF' }}>
                <span className="flex-1 text-sm font-medium truncate" style={{ fontFamily: 'Poppins', color: '#111928' }}>{trackingId}</span>
                <button
                  type="button"
                  onClick={() => copyId(trackingId)}
                  className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none"
                  title="Copy"
                >
                  {copied
                    ? <CheckCircle2 size={16} className="text-green-500" />
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  }
                </button>
              </div>
            </div>
          )}
          {trackingUrl && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ fontFamily: 'Poppins', color: '#6B7280' }}>Tracking Link</span>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: '#E5E7EB', background: '#FFFFFF' }}>
                <span className="flex-1 text-sm font-medium truncate" style={{ fontFamily: 'Poppins', color: '#3F83F8' }}>{trackingUrl}</span>
                <a href={trackingUrl} target="_blank" rel="noreferrer" className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Steps + guide image */}
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: '#F9FAFB' }}>
        <span className="font-bold text-base" style={{ fontFamily: 'Poppins', color: '#111928' }}>Follow the below steps to track your student kit</span>
        <ol className="flex flex-col gap-1.5 list-decimal list-inside">
          {['Copy your tracking ID', 'Open the tracking link and paste the tracking ID', 'Enter the captcha and submit to view the details and status'].map((step, i) => (
            <li key={i} className="text-sm" style={{ fontFamily: 'Poppins', color: '#4B5563' }}>{step}</li>
          ))}
        </ol>
        <img src="/Trackingpic.png" alt="Tracking guide" className="w-full max-w-xs rounded-xl object-contain border border-gray-200" />
      </div>

      <p className="text-sm" style={{ fontFamily: 'Poppins', color: '#6B7280' }}>
        Additionally you can access the student kit details from your profile
      </p>
    </div>
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
  paymentBanner,
}: {
  onClose: () => void
  batches: Array<BatchT0Status>
  profilePhotoUrl: string | null
  downloadAppCompleted: boolean
  onPhotoSaved?: () => void
  onAgreementSubmitted?: () => void
  paymentBanner?: PaymentBannerInfo | null
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

  const needsStudentStatus = !!(lecturesData?.isDocumentsRequired || lecturesData?.isStudentKitApplicable)
  const { data: studentStatusData } = useQuery({
    queryKey: ['t0-flow-student-status', selectedBatchId],
    queryFn: () => fetchT0FlowStudentStatus(selectedBatchId!),
    enabled: needsStudentStatus && !!selectedBatchId,
    staleTime: 2 * 60 * 1000,
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
    ...(lecturesData?.isDocumentsRequired ? [{
      id: 'document-upload',
      lectureId: null,
      label: 'Document Upload',
      Icon: FolderUp,
      videoUrl: null,
      kind: 'document-upload' as StepKind,
    }] : []),
    ...(lecturesData?.isStudentKitApplicable ? [{
      id: 'student-kit',
      lectureId: null,
      label: 'Track My Student Kit',
      Icon: Package,
      videoUrl: null,
      kind: 'student-kit' as StepKind,
    }] : []),
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

  const progressSteps = steps.filter((s) => s.kind !== 'document-upload' && s.kind !== 'student-kit')
  const doneCount = progressSteps.filter((s) => completedSteps.has(s.id)).length
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

  // ── Shared handlers ──────────────────────────────────────────────────────────
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  function handleStepClick(i: number) {
    const step = steps[i]
    const kind = step?.kind
    if (kind === 'download-app') {
      setDownloadModalOpen(true)
      return
    }
    setIsVideoPlaying(false)
    setActiveStepIndex(i)
    // const isCompleted = step ? completedSteps.has(step.id) : false
    const isPhotoUploaded = kind === 'profile-photo' && !!photoSnapshot
    if (
      kind === 'student-kit' ||
      kind === 'document-upload' ||
      kind === 'legal-agreement' ||
      (kind === 'profile-photo' && isPhotoUploaded)
    ) {
      setMobileSheetOpen(true)
    } else {
      setMobileDetailOpen(true)
    }
  }

  // ── Right-panel content (shared between mobile detail + desktop right panel) ─
  function StepContent() {
    if (!activeStep) {
      return (
        <div className="flex items-center justify-center text-sm text-gray-400 h-full" style={{ fontFamily: 'Poppins' }}>
          No content available yet
        </div>
      )
    }
    return (
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
              onSubmit={() => { markDone(activeStep.id); onAgreementSubmitted?.() }}
            />
          )
        ) : activeStep.kind === 'document-upload' ? (
          <DocumentUploadContent status={studentStatusData?.documents ?? null} />
        ) : activeStep.kind === 'student-kit' ? (
          <StudentKitContent status={studentStatusData?.kit ?? null} />
        ) : (
          <VideoPlayer
            title={activeStep.label}
            videoUrl={activeStep.videoUrl}
            onPlayingChange={setIsVideoPlaying}
            onVideoEnded={(durationSeconds) => {
              if (activeStep.kind !== 'lecture') return
              markDone(activeStep.id)
              if (activeStep.lectureId && selectedBatchId) {
                void recordT0FlowStepComplete(activeStep.lectureId, selectedBatchId, activeTab, durationSeconds)
              }
            }}
          />
        )}

        {activeStep.kind !== 'profile-photo' && activeStep.kind !== 'legal-agreement' && activeStep.kind !== 'document-upload' && activeStep.kind !== 'student-kit' && (
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
    )
  }

  // ── Shared step list section ──────────────────────────────────────────────────
  function StepListSection() {
    return (
      <div className="flex flex-col pb-2">
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
            onStepClick={handleStepClick}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400" style={{ fontFamily: 'Poppins' }}>
            No content available yet
          </div>
        )}
        {!isLms && !isLecturesLoading && steps.length > 0 && (
          <IdCard
            allDone={doneCount === progressSteps.length && progressSteps.length > 0}
            idCardUrl={lecturesData?.idCardUrl ?? null}
          />
        )}
      </div>
    )
  }

  // ── Shared controls (tabs, progress, batch selector) ─────────────────────────
  function Controls() {
    return (
      <>
        {/* Batch selector */}
        {batches.length > 1 && (
          <div className="mt-4">
            <label className="block text-xs font-medium mb-1.5" style={{ fontFamily: 'Poppins', color: '#6B7280' }}>Batch</label>
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
          {(['lms', 'program'] as const).map((tab) => {
            const active = activeTab === tab
            const locked = tab === 'program' && !showProgramTab
            const lmsProgressSteps = lmsSteps.filter((s) => s.kind !== 'document-upload' && s.kind !== 'student-kit')
            const lmsDoneCount = lmsProgressSteps.filter((s) => completedSteps.has(s.id)).length
            const btn = (
              <button
                key={tab}
                type="button"
                onClick={() => { if (!locked) setActiveTab(tab) }}
                disabled={locked}
                className="w-full py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none flex items-center justify-center gap-1.5"
                style={{
                  fontFamily: 'Poppins',
                  background: active ? '#EBF5FF' : '#FFFFFF',
                  color: active ? '#6962AC' : '#9CA3AF',
                  border: `1.5px solid ${active ? '#6962AC' : '#E5E7EB'}`,
                  cursor: locked ? 'default' : 'pointer',
                }}
              >
                {locked && <Lock size={13} style={{ color: '#9CA3AF' }} />}
                {tab === 'lms' ? 'LMS Walkthrough' : 'Program Onboarding'}
              </button>
            )
            if (!locked) return <div key={tab} className="flex-1">{btn}</div>
            return (
              <div key={tab} className="flex-1 relative group">
                {btn}
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl bg-[#1F2937] px-4 py-3 text-center text-sm font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50" style={{ fontFamily: 'Poppins' }}>
                  Complete your program fee payment to unlock this section
                  {/* Caret */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1F2937' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#DEF7EC' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: progressSteps.length ? `${(doneCount / progressSteps.length) * 100}%` : '0%', background: '#31C48D' }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span style={{ fontFamily: 'Poppins', fontSize: 12, color: '#4B5563', fontWeight: 500 }}>Your Progress</span>
            <span style={{ fontFamily: 'Poppins', fontSize: 12, color: '#1F2A37', fontWeight: 500 }}>{doneCount} of {progressSteps.length} done</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* ── Mobile / Tablet layout (< lg) ─────────────────────────────────────── */}
      {/* ── Mobile full-screen video player ────────────────────────────────────── */}
      {mobileDetailOpen && activeStep?.kind === 'lecture' ? (
        <div className="lg:hidden fixed inset-0 z-[300] bg-black flex flex-col">
          {/* Floating back button */}
          <div className="absolute top-4 left-4 z-10">
            <button
              type="button"
              onClick={() => { setMobileDetailOpen(false); setIsVideoPlaying(false) }}
              className="flex items-center justify-center size-10 rounded-full focus-visible:outline-none"
              style={{ background: 'rgba(40,40,40,0.85)' }}
              aria-label="Back"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
          </div>

          {/* Video fills remaining space above bottom bar */}
          <div className="flex-1 flex items-center justify-center">
            <VideoPlayer
              title=""
              videoUrl={activeStep.videoUrl}
              onPlayingChange={setIsVideoPlaying}
              onVideoEnded={(durationSeconds) => {
                markDone(activeStep.id)
                if (activeStep.lectureId && selectedBatchId) {
                  void recordT0FlowStepComplete(activeStep.lectureId, selectedBatchId, activeTab, durationSeconds)
                }
              }}
            />
          </div>

          {/* Bottom nav bar */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white">
            <button
              type="button"
              onClick={prev}
              disabled={activeStepIndex === 0}
              className="flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none disabled:opacity-40 shrink-0"
              style={{ background: '#EEF2FF', width: 48, height: 48 }}
            >
              <ArrowLeft size={20} style={{ color: '#6962AC' }} />
            </button>
            <div className="flex-1 flex items-center justify-center rounded-2xl px-4 py-3" style={{ background: '#EEF2FF' }}>
              <span className="text-sm font-semibold truncate" style={{ fontFamily: 'Poppins', color: '#6962AC' }}>
                Walkthrough &amp; Onboarding
              </span>
            </div>
            <button
              type="button"
              onClick={next}
              disabled={activeStepIndex === steps.length - 1}
              className="flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none disabled:opacity-40 shrink-0"
              style={{ background: '#EEF2FF', width: 48, height: 48 }}
            >
              <ArrowRight size={20} style={{ color: '#6962AC' }} />
            </button>
          </div>
        </div>
      ) : (
        <div className="lg:hidden fixed inset-0 z-[300] bg-[#FAF9F9] flex flex-col">

          {/* Header */}
          <div className="bg-white rounded-b-[24px] px-4 flex items-center gap-3 shrink-0" style={{ minHeight: 56 }}>
            <button
              type="button"
              onClick={() => {
                if (mobileDetailOpen) { setMobileDetailOpen(false); setIsVideoPlaying(false) }
                else onClose()
              }}
              className="flex items-center justify-center size-9 rounded-full text-gray-800 hover:bg-gray-100 transition-colors focus-visible:outline-none shrink-0"
              aria-label={mobileDetailOpen ? 'Back' : 'Close'}
            >
              <ArrowLeft size={20} />
            </button>
            <span className="flex-1 text-center font-medium text-base truncate" style={{ fontFamily: 'Poppins', color: '#111928' }}>
              Walkthrough &amp; Onboarding
            </span>
            <div className="size-9 shrink-0" />
          </div>

          {/* List view */}
          {!mobileDetailOpen && (
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 flex flex-col">
              <Controls />
              <div className="mt-4 flex flex-col flex-1">
                <StepListSection />
              </div>
              {isLms && (
                <div className="mt-4 shrink-0">
                  {paymentBanner && paymentBanner.type !== 'banned'
                    ? <PaymentBanner info={paymentBanner} />
                    : (
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg" style={{ background: '#EBF5FF' }}>
                        <span className="shrink-0 flex items-center justify-center size-5 rounded-full mt-0.5" style={{ background: '#3B82F6' }}>
                          <span className="text-white font-bold" style={{ fontSize: 11 }}>i</span>
                        </span>
                        <p className="text-xs leading-5" style={{ fontFamily: 'Poppins', color: '#1E429F' }}>
                          Make sure to watch the complete video to update your progress
                        </p>
                      </div>
                    )
                  }
                </div>
              )}
            </div>
          )}

          {/* Detail view (non-video steps) */}
          {mobileDetailOpen && (
            <div className="flex-1 overflow-y-auto px-4 py-6 bg-white flex flex-col">
              {StepContent()}
            </div>
          )}

          {/* Bottom sheet drawer */}
          {mobileSheetOpen && activeStep && (
            <>
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/30 z-10"
                onClick={() => setMobileSheetOpen(false)}
              />
              {/* Sheet */}
              <div className="absolute inset-x-0 bottom-0 z-20 bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: '85vh' }}>
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>
                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 pb-8">
                  {activeStep.kind === 'student-kit'
                    ? <StudentKitContent status={studentStatusData?.kit ?? null} />
                    : activeStep.kind === 'document-upload'
                    ? <DocumentUploadContent status={studentStatusData?.documents ?? null} />
                    : activeStep.kind === 'legal-agreement' && !completedSteps.has(activeStep.id)
                    ? <MobileAgreementPlaceholder sectionId={activeStep.sectionId} />
                    : StepContent()
                  }
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Desktop layout (≥ lg) ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex fixed inset-x-0 bottom-0 top-16 z-[300] bg-[#FAF9F9] px-8 pb-8 pt-6 flex-col">
        <div className="w-full flex gap-6 mt-6 flex-1 min-h-0">

          {/* Left panel */}
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

            <Controls />

            <div className="mt-4 flex flex-col overflow-y-auto flex-1 min-h-0">
              <StepListSection />
            </div>

            {isLms && (
              <div className="mt-4 shrink-0">
                {paymentBanner && paymentBanner.type !== 'banned'
                  ? <PaymentBanner info={paymentBanner} />
                  : (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg" style={{ background: '#EBF5FF' }}>
                      <span className="shrink-0 flex items-center justify-center size-5 rounded-full mt-0.5" style={{ background: '#3B82F6' }}>
                        <span className="text-white font-bold" style={{ fontSize: 11 }}>i</span>
                      </span>
                      <p className="text-xs leading-5" style={{ fontFamily: 'Poppins', color: '#1E429F' }}>
                        Make sure to watch the complete video to update your progress
                      </p>
                    </div>
                  )
                }
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="flex-1 bg-white rounded-2xl overflow-hidden flex flex-col justify-center px-10 py-8">
            {StepContent()}
          </div>

        </div>
      </div>

      <DownloadAppModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} />
    </>
  )
}
