import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock, X } from '@phosphor-icons/react'
import { GuidedTourStepList } from './GuidedTourStepList'
import { GuidedTourActivePanel } from './GuidedTourActivePanel'
import { buildLmsSteps, buildProgramSteps } from './steps'
import type { GuidedTourStep } from './steps'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fetchT0FlowLectures } from '@/lib/api/dashboard/dashboardApi'
import type { BatchT0Status, T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'

interface GuidedTourOverlayProps {
  status: T0FlowStatus
  onSeeDashboard: () => void
}

type TabKey = 'lms' | 'program'

/**
 * Full-screen guided-tour experience shown over the dashboard for eligible T0
 * users, laid out as a two-panel card: the left panel holds the batch dropdown
 * (multi-batch only), both tabs (Program Onboarding always shown but locked
 * until full fees are paid), progress, and the step list; the right panel shows
 * the active step's video/content with Back / Next navigation.
 */
export function GuidedTourOverlay({ status, onSeeDashboard }: GuidedTourOverlayProps) {
  const queryClient = useQueryClient()
  const [selectedBatchId, setSelectedBatchId] = useState<number | undefined>(status.batches.at(0)?.batchId)
  const [tab, setTab] = useState<TabKey>('lms')
  const [activeKey, setActiveKey] = useState<string | null>(null)

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
    return effectiveTab === 'lms' ? buildLmsSteps(lectures, status) : buildProgramSteps(lectures)
  }, [lectures, status, effectiveTab])

  const activeIndex = Math.max(0, steps.findIndex((s) => s.key === activeKey))
  const activeStep = steps.find((s) => s.key === activeKey) ?? steps.at(0)
  const tabProgress = effectiveTab === 'lms' ? selectedBatch?.lms : selectedBatch?.program

  const refetchProgress = () => {
    // Overview carries t0Flow progress + the primary batch's lectures; the
    // lectures query covers any non-primary batch currently open.
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 't0-flow-lectures'] })
  }

  const selectTab = (next: TabKey) => {
    setTab(next)
    setActiveKey(null)
  }

  const selectBatch = (value: string) => {
    setSelectedBatchId(Number(value))
    setActiveKey(null)
  }

  const goToIndex = (index: number) => {
    const next = steps.at(index)
    if (next) setActiveKey(next.key)
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col gap-4 overflow-y-auto bg-gray-50 p-4 md:flex-row md:gap-6 md:overflow-hidden md:p-6"
      data-testid="guided-tour-overlay"
    >
      {/* Left card — task list */}
      <aside className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm md:min-h-0 md:max-w-[400px]">
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
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

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
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

          <GuidedTourStepList
            steps={steps}
            activeKey={activeStep?.key}
            onSelect={setActiveKey}
            completed={tabProgress?.completed ?? 0}
            total={tabProgress?.total ?? 0}
          />
        </div>
      </aside>

      {/* Right card — selected step actionables (its content scrolls internally on desktop) */}
      <section className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white shadow-sm md:min-h-0 md:overflow-hidden">
        {selectedBatch ? (
          <GuidedTourActivePanel
            step={activeStep}
            batchId={selectedBatch.batchId}
            tab={effectiveTab}
            profilePhotoUrl={status.profilePhotoUrl}
            onReported={refetchProgress}
            onBack={() => goToIndex(activeIndex - 1)}
            onNext={() => goToIndex(activeIndex + 1)}
            canBack={activeIndex > 0}
            canNext={activeIndex < steps.length - 1}
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
