import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock, X } from '@phosphor-icons/react'
import { GuidedTourStepList } from './GuidedTourStepList'
import { IdCardStep } from './IdCardStep'
import { GuidedTourActivePanel } from './GuidedTourActivePanel'
import { buildLmsSteps, buildProgramSteps, getIdCardState } from './steps'
import type { GuidedTourStep } from './steps'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FeePaymentBanners } from '../../section-banner/FeePaymentBanners'
import { fetchT0FlowLectures } from '@/lib/api/dashboard/dashboardApi'
import type { BatchT0Status, T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'
import type { FeePaymentBanner } from '@/server/api/dashboard/t0/getFeePaymentBanner.service'

interface GuidedTourOverlayProps {
  status: T0FlowStatus
  onSeeDashboard: () => void
  /** Course to open on mount (from the dashboard onboarding banner); defaults to the first batch. */
  initialBatchId?: number
  /** Tab to open on mount; defaults to the LMS walkthrough. */
  initialTab?: 'lms' | 'program'
  /** Fee-payment banners (same as the dashboard); shown under the LMS-walkthrough steps. */
  feePaymentBanners: Array<FeePaymentBanner>
}

type TabKey = 'lms' | 'program'

/**
 * The flow to open first: Program Onboarding only once the LMS walkthrough is
 * complete and the program tab is unlocked & still pending; otherwise LMS.
 */
function defaultPendingTab(batch: BatchT0Status | undefined): TabKey {
  if (batch?.showProgramTab && batch.lms.complete && batch.program && !batch.program.complete) {
    return 'program'
  }
  return 'lms'
}

/**
 * Full-screen guided-tour experience shown over the dashboard for eligible T0
 * users, laid out as a two-panel card: the left panel holds the batch dropdown
 * (multi-batch only), both tabs (Program Onboarding always shown but locked
 * until full fees are paid), progress, and the step list; the right panel shows
 * the active step's video/content with Back / Next navigation.
 */
export function GuidedTourOverlay({
  status,
  onSeeDashboard,
  initialBatchId,
  initialTab,
  feePaymentBanners,
}: GuidedTourOverlayProps) {
  const queryClient = useQueryClient()
  const [selectedBatchId, setSelectedBatchId] = useState<number | undefined>(
    initialBatchId ?? status.batches.at(0)?.batchId,
  )
  const initialBatch =
    status.batches.find((b) => b.batchId === (initialBatchId ?? status.batches.at(0)?.batchId)) ??
    status.batches.at(0)
  // Default to the first pending flow chronologically: LMS walkthrough, then
  // (once it's done and unlocked) Program Onboarding. An explicit target wins.
  const [tab, setTab] = useState<TabKey>(initialTab ?? defaultPendingTab(initialBatch))
  const [activeKey, setActiveKey] = useState<string | null>(null)
  // True only when we auto-advance after a video ends, so the next video plays
  // itself; manual navigation always leaves the next video paused.
  const [autoPlayNext, setAutoPlayNext] = useState(false)

  const selectedBatch: BatchT0Status | undefined =
    status.batches.find((b) => b.batchId === selectedBatchId) ?? status.batches.at(0)
  const programUnlocked = selectedBatch?.showProgramTab ?? false
  // The program tab is always visible but locked; never render its content when locked.
  const effectiveTab: TabKey = tab === 'program' && !programUnlocked ? 'lms' : tab

  // Lectures live on the batch: the primary batch's arrive inline via the
  // overview; other batches are fetched on demand when the learner switches.
  const inlineLectures = selectedBatch?.lectures ?? null
  const { data: fetchedLectures } = useQuery({
    queryKey: ['dashboard', 't0-flow-lectures', selectedBatch?.batchId ?? null],
    queryFn: () => fetchT0FlowLectures(selectedBatch?.batchId),
    enabled: selectedBatch !== undefined && inlineLectures === null,
  })
  const lectures = inlineLectures ?? fetchedLectures

  const steps: Array<GuidedTourStep> = useMemo(() => {
    if (!lectures) return []
    return effectiveTab === 'lms' ? buildLmsSteps(lectures, status) : buildProgramSteps(lectures, status)
  }, [lectures, status, effectiveTab])

  // With nothing explicitly selected, land on the first incomplete step
  // (chronological), falling back to the first step when all are done.
  const activeStep =
    steps.find((s) => s.key === activeKey) ?? steps.find((s) => !s.completed) ?? steps.at(0)
  const activeIndex = activeStep ? Math.max(0, steps.findIndex((s) => s.key === activeStep.key)) : 0
  const tabProgress = effectiveTab === 'lms' ? selectedBatch?.lms : selectedBatch?.program

  // Segment bar spans the tab's video steps; index of the active one among them.
  const videoStepKeys = steps.filter((s) => s.kind === 'video').map((s) => s.key)
  const videoIndex = activeStep ? videoStepKeys.indexOf(activeStep.key) : -1

  // ID-card capstone: rendered below the Program Onboarding steps (not a step).
  const idCard = lectures && effectiveTab === 'program' ? getIdCardState(lectures, status) : null
  const showIdCard = idCard?.show ?? false

  const refetchProgress = () => {
    // Overview carries t0Flow progress + the primary batch's lectures; the
    // lectures query covers any non-primary batch currently open.
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 't0-flow-lectures'] })
  }

  const selectTab = (next: TabKey) => {
    setAutoPlayNext(false)
    setTab(next)
    setActiveKey(null)
  }

  const selectBatch = (value: string) => {
    setAutoPlayNext(false)
    setSelectedBatchId(Number(value))
    setActiveKey(null)
  }

  const selectStep = (key: string) => {
    setAutoPlayNext(false)
    setActiveKey(key)
  }

  // When a walkthrough video ends, auto-advance to the next step if it's also a
  // video and let it play itself.
  const handleVideoEnded = () => {
    const next = steps.at(activeIndex + 1)
    if (next && next.kind === 'video') {
      setAutoPlayNext(true)
      setActiveKey(next.key)
    } else {
      setAutoPlayNext(false)
    }
  }

  return (
    <div
      // Full-bleed to the viewport: the app's <main> is capped at max-w-1440 and
      // centered, so break out of it and use the whole width.
      className="relative left-1/2 mb-6 mt-2 flex w-screen -translate-x-1/2 flex-col gap-4 px-3 md:flex-row md:items-start md:gap-5 md:px-5"
      data-testid="guided-tour-overlay"
    >
      {/* Left card — task list. Fills the viewport height and scrolls internally on desktop. */}
      <aside className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm md:sticky md:top-4 md:h-[calc(100dvh-6rem)] md:max-w-[440px] md:self-start">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h1 className="text-lg font-semibold text-gray-900">Let&apos;s get you started</h1>
          <button
            type="button"
            onClick={onSeeDashboard}
            aria-label="Close and see dashboard"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="guided-tour-see-dashboard"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        {/* Fixed: batch selector + tabs (never scroll away). */}
        <div className="flex shrink-0 flex-col gap-4 border-b border-gray-100 px-5 py-4">
          {status.batches.length > 1 ? (
            <Select value={selectedBatch ? String(selectedBatch.batchId) : undefined} onValueChange={selectBatch}>
              <SelectTrigger aria-label="Batch" className="w-full" data-testid="guided-tour-batch-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[210]">
                {status.batches.map((b) => (
                  <SelectItem key={b.batchId} value={String(b.batchId)} data-testid={`guided-tour-batch-option-${b.batchId}`}>
                    {b.batchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <div className="flex gap-2" role="tablist" data-testid="guided-tour-tabs">
            <button
              type="button"
              role="tab"
              aria-selected={effectiveTab === 'lms'}
              onClick={() => selectTab('lms')}
              className={effectiveTab === 'lms' ? TAB_ACTIVE : TAB_IDLE}
              data-testid="guided-tour-tab-lms"
            >
              LMS Walkthrough
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={effectiveTab === 'program'}
              disabled={!programUnlocked}
              onClick={() => programUnlocked && selectTab('program')}
              className={effectiveTab === 'program' ? TAB_ACTIVE : programUnlocked ? TAB_IDLE : TAB_LOCKED}
              data-testid="guided-tour-tab-program"
              data-locked={!programUnlocked}
              title={programUnlocked ? undefined : 'Unlocks once your fees are paid'}
            >
              {programUnlocked ? null : <Lock className="size-4" aria-hidden data-testid="guided-tour-tab-program-lock" />}
              Program Onboarding
            </button>
          </div>
        </div>

        {/* Scrollable: progress + step list, then the ID-card capstone (Program
            Onboarding only) below the hint. The hint hides once the card unlocks. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <GuidedTourStepList
            steps={steps}
            activeKey={activeStep?.key}
            onSelect={selectStep}
            completed={tabProgress?.completed ?? 0}
            total={tabProgress?.total ?? 0}
            showHint={!idCard?.unlocked}
          />
          {showIdCard ? (
            <div className="mt-4">
              <IdCardStep url={idCard?.url ?? null} unlocked={idCard?.unlocked ?? false} />
            </div>
          ) : null}
        </div>

        {/* Pinned bottom: payment-pending / overdue nudge under the LMS-walkthrough
            steps — reuses the dashboard banner (compact so it fits the panel). */}
        {effectiveTab === 'lms' && feePaymentBanners.length > 0 ? (
          <div className="shrink-0 border-t border-gray-100 p-4">
            <FeePaymentBanners banners={feePaymentBanners} compact />
          </div>
        ) : null}
      </aside>

      {/* Right side — selected step actionables. Bounded to the viewport height so
          long steps (the agreement) scroll internally with a pinned footer. */}
      <section className="flex min-w-0 flex-1 flex-col md:h-[calc(100dvh-6rem)]">
        {selectedBatch ? (
          <GuidedTourActivePanel
            step={activeStep}
            batchId={selectedBatch.batchId}
            tab={effectiveTab}
            profilePhotoUrl={status.profilePhotoUrl}
            onReported={refetchProgress}
            videoCount={videoStepKeys.length}
            videoIndex={videoIndex}
            autoPlayVideo={autoPlayNext}
            onVideoEnded={handleVideoEnded}
          />
        ) : null}
      </section>
    </div>
  )
}

// Match the dashboard "My Schedule" / "Pending Tasks" tabs (CTA purple #6962AC).
const TAB_BASE = 'inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6962AC]'
const TAB_ACTIVE = `${TAB_BASE} border-[#6962AC] bg-[#6962AC]/10 text-[#6962AC]`
const TAB_IDLE = `${TAB_BASE} border-gray-200 bg-white text-gray-600 hover:bg-gray-50`
const TAB_LOCKED = `${TAB_BASE} cursor-not-allowed border-gray-200 bg-white text-gray-400`
