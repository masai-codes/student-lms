import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ListChecks, Lock, X } from '@phosphor-icons/react'
import { GuidedTourStepList } from './GuidedTourStepList'
import { IdCardStep } from './IdCardStep'
import { GuidedTourActivePanel } from './GuidedTourActivePanel'
import { buildLmsSteps, buildProgramSteps, getIdCardState } from './steps'
import BottomDrawer from '@/components/ui/bottom-drawer'
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport'
import type { GuidedTourStep } from './steps'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FeePaymentBanners } from '../../section-banner/FeePaymentBanners'
import { pushDashboardEvent } from '../../shared/dashboardAnalytics'
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
  /** When set, preselect the first step with this action on mount (e.g. `agreement`). */
  initialStepAction?: 'agreement'
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
  initialStepAction,
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
  // Mobile only: the step list lives in a bottom sheet (no room for the side rail).
  const [stepsDrawerOpen, setStepsDrawerOpen] = useState(false)
  const isMobile = useIsMobileViewport()

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

  // Pin the active step once steps load. Without this the fallback above would
  // re-resolve on every progress refetch: reporting the current video complete
  // at the 10s watch mark rebuilds `steps` with it now marked completed, so
  // `find((s) => !s.completed)` would jump the panel to the next step mid-play.
  // The video only advances on its `ended` event (see handleVideoEnded).
  useEffect(() => {
    if (activeKey === null && steps.length > 0) {
      // A deep-link (e.g. "sign agreement" from a restricted lecture) preselects
      // the first step with the requested action; otherwise land on the first
      // incomplete step.
      const preferred = initialStepAction
        ? steps.find((s) => s.action === initialStepAction)
        : undefined
      setActiveKey(
        (preferred ?? steps.find((s) => !s.completed) ?? steps[0]).key,
      )
    }
  }, [activeKey, steps, initialStepAction])
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
    pushDashboardEvent('l_dashboard_guided_tour_batch_select_id_' + Number(value), {
      batch_id: Number(value),
    })
    setAutoPlayNext(false)
    setSelectedBatchId(Number(value))
    setActiveKey(null)
  }

  const selectStep = (key: string) => {
    setAutoPlayNext(false)
    setActiveKey(key)
  }

  // Manual Back / Next through the step list (below the active step's content).
  // Never autoplays the target video — manual navigation always leaves it paused.
  const goToStep = (index: number) => {
    const target = steps.at(index)
    if (!target) return
    pushDashboardEvent('l_dashboard_guided_tour_step_nav', {
      step_key: target.key,
      step_action: target.action,
      direction: index > activeIndex ? 'next' : 'back',
    })
    selectStep(target.key)
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

  const handleClose = () => {
    pushDashboardEvent('l_dashboard_guided_tour_see_dashboard')
    onSeeDashboard()
  }

  const batchSelect =
    status.batches.length > 1 ? (
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
    ) : null

  const tabsRow = (
    <div className="flex gap-2" role="tablist" data-testid="guided-tour-tabs">
      <button
        type="button"
        role="tab"
        aria-selected={effectiveTab === 'lms'}
        onClick={() => {
          pushDashboardEvent('l_dashboard_guided_tour_tab', { tab: 'lms' })
          selectTab('lms')
        }}
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
        onClick={() => {
          if (!programUnlocked) return
          pushDashboardEvent('l_dashboard_guided_tour_tab', { tab: 'program' })
          selectTab('program')
        }}
        className={effectiveTab === 'program' ? TAB_ACTIVE : programUnlocked ? TAB_IDLE : TAB_LOCKED}
        data-testid="guided-tour-tab-program"
        data-locked={!programUnlocked}
        title={programUnlocked ? undefined : 'Unlocks once your fees are paid'}
      >
        {programUnlocked ? null : <Lock className="size-4" aria-hidden data-testid="guided-tour-tab-program-lock" />}
        Program Onboarding
      </button>
    </div>
  )

  // Progress + step list + ID-card capstone (Program Onboarding only). Shared
  // between the desktop rail and the mobile bottom sheet (each passes its own
  // select handler); the hint hides once the ID card unlocks.
  const renderStepList = (onSelectStep: (key: string) => void) => (
    <>
      <GuidedTourStepList
        steps={steps}
        activeKey={activeStep?.key}
        onSelect={onSelectStep}
        completed={tabProgress?.completed ?? 0}
        total={tabProgress?.total ?? 0}
        showHint={!idCard?.unlocked}
      />
      {showIdCard ? (
        <div className="mt-4">
          <IdCardStep url={idCard?.url ?? null} unlocked={idCard?.unlocked ?? false} />
        </div>
      ) : null}
    </>
  )

  // Payment-pending / overdue nudge (LMS-walkthrough only) — reuses the dashboard banner.
  const feeBanner =
    effectiveTab === 'lms' && feePaymentBanners.length > 0 ? (
      <FeePaymentBanners banners={feePaymentBanners} compact />
    ) : null

  return (
    <div
      // Full-bleed to the viewport: the app's <main> is capped at max-w-1440 and
      // centered, so break out of it and use the whole width.
      className="relative left-1/2 mb-6 mt-2 flex w-screen -translate-x-1/2 flex-col gap-4 px-3 md:flex-row md:items-start md:gap-5 md:px-5"
      data-testid="guided-tour-overlay"
    >
      {isMobile ? (
        // Mobile: a compact header (title + close + tabs + a "steps" trigger). The
        // step list moves into a bottom sheet so the active content stays primary.
        <div className="flex w-full flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-gray-900">Let&apos;s get you started</h1>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close and see dashboard"
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              data-testid="guided-tour-see-dashboard"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {batchSelect}
          {tabsRow}
          <button
            type="button"
            onClick={() => setStepsDrawerOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#6962AC] bg-[#6962AC]/5 px-4 py-2.5 text-sm font-semibold text-[#6962AC]"
            data-testid="guided-tour-open-steps"
          >
            <ListChecks className="size-4" aria-hidden />
            View steps ({tabProgress?.completed ?? 0}/{tabProgress?.total ?? 0})
          </button>
        </div>
      ) : (
        // Desktop: the task-list side rail (fills the viewport height, scrolls internally).
        <aside className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm md:sticky md:top-4 md:h-[calc(100dvh-6rem)] md:max-w-[440px] md:self-start">
          <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
            <h1 className="text-lg font-semibold text-gray-900">Let&apos;s get you started</h1>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close and see dashboard"
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              data-testid="guided-tour-see-dashboard"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>

          {/* Fixed: batch selector + tabs (never scroll away). */}
          <div className="flex shrink-0 flex-col gap-4 border-b border-gray-100 px-5 py-4">
            {batchSelect}
            {tabsRow}
          </div>

          {/* Scrollable: progress + step list + ID-card capstone. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{renderStepList(selectStep)}</div>

          {feeBanner ? <div className="shrink-0 border-t border-gray-100 p-4">{feeBanner}</div> : null}
        </aside>
      )}

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
            hasPrev={activeIndex > 0}
            hasNext={activeIndex < steps.length - 1}
            onPrev={() => goToStep(activeIndex - 1)}
            onNext={() => goToStep(activeIndex + 1)}
          />
        ) : null}
      </section>

      {/* Mobile: the step list in a swipeable bottom sheet. Selecting a step closes it. */}
      {isMobile ? (
        <BottomDrawer
          open={stepsDrawerOpen}
          onClose={() => setStepsDrawerOpen(false)}
          title="Let's get you started"
          bodyClassName="px-4 pb-6"
        >
          {renderStepList((key) => {
            selectStep(key)
            setStepsDrawerOpen(false)
          })}
          {feeBanner ? <div className="mt-4">{feeBanner}</div> : null}
        </BottomDrawer>
      ) : null}
    </div>
  )
}

// Match the dashboard "My Schedule" / "Pending Tasks" tabs (CTA purple #6962AC).
const TAB_BASE = 'inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6962AC]'
const TAB_ACTIVE = `${TAB_BASE} border-[#6962AC] bg-[#6962AC]/10 text-[#6962AC]`
const TAB_IDLE = `${TAB_BASE} border-gray-200 bg-white text-gray-600 hover:bg-gray-50`
const TAB_LOCKED = `${TAB_BASE} cursor-not-allowed border-gray-200 bg-white text-gray-400`
