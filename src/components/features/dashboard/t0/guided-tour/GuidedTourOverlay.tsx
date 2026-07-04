import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock, X } from '@phosphor-icons/react'
import { GuidedTourVideoStep } from './GuidedTourVideoStep'
import { GuidedTourStepPanel } from './GuidedTourStepPanel'
import { buildLmsSteps, buildProgramSteps } from './steps'
import type { GuidedTourStep } from './steps'
import type { BatchT0Status, T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fetchT0FlowLectures } from '@/lib/api/dashboard/dashboardApi'

interface GuidedTourOverlayProps {
  status: T0FlowStatus
  onSeeDashboard: () => void
}

type TabKey = 'lms' | 'program'

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((Math.min(completed, total) / total) * 100) : 100
  return (
    <div className="flex items-center gap-3" data-testid="guided-tour-progress">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-600" data-testid="guided-tour-progress-label">
        {Math.min(completed, total)}/{total}
      </span>
    </div>
  )
}

/**
 * Full-screen guided-tour experience shown over the dashboard for eligible T0
 * users. Both tabs are always visible — LMS Walkthrough and Program Onboarding —
 * with the program tab locked until full fees are paid. A batch dropdown (shown
 * only for multi-batch users) switches which admission batch the tour drives.
 * Watching a video reports completion and refetches progress so the bar advances.
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

  const { data: lectures } = useQuery({
    queryKey: ['dashboard', 't0-flow-lectures', selectedBatch?.batchId ?? null],
    queryFn: () => fetchT0FlowLectures(selectedBatch?.batchId),
    enabled: selectedBatch !== undefined,
  })

  const steps: Array<GuidedTourStep> = useMemo(() => {
    if (!lectures) return []
    return effectiveTab === 'lms' ? buildLmsSteps(lectures, status) : buildProgramSteps(lectures)
  }, [lectures, status, effectiveTab])

  const activeStep = steps.find((s) => s.key === activeKey) ?? steps.at(0)
  const tabProgress = effectiveTab === 'lms' ? selectedBatch?.lms : selectedBatch?.program

  const refetchProgress = () => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 't0-flow-status'] })
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

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-white" data-testid="guided-tour-overlay">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Getting started</h1>
          <button
            type="button"
            onClick={onSeeDashboard}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            data-testid="guided-tour-see-dashboard"
          >
            See dashboard
            <X className="size-4" aria-hidden />
          </button>
        </header>

        {status.batches.length > 1 ? (
          <Select value={selectedBatch ? String(selectedBatch.batchId) : undefined} onValueChange={selectBatch}>
            <SelectTrigger aria-label="Batch" className="w-full sm:w-72" data-testid="guided-tour-batch-select">
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
            className={
              effectiveTab === 'program' ? TAB_ACTIVE : programUnlocked ? TAB_IDLE : TAB_LOCKED
            }
            data-testid="guided-tour-tab-program"
            data-locked={!programUnlocked}
            title={programUnlocked ? undefined : 'Unlocks once your fees are paid'}
          >
            Program Onboarding
            {programUnlocked ? null : <Lock className="size-4" aria-hidden data-testid="guided-tour-tab-program-lock" />}
          </button>
        </div>

        {tabProgress ? <ProgressBar completed={tabProgress.completed} total={tabProgress.total} /> : null}

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <ol className="flex flex-col gap-2" data-testid="guided-tour-step-list">
              {steps.map((step) => (
                <li key={step.key}>
                  <button
                    type="button"
                    onClick={() => setActiveKey(step.key)}
                    aria-current={step.key === activeStep?.key}
                    className={step.key === activeStep?.key ? STEP_ACTIVE : STEP_IDLE}
                    data-testid={`guided-tour-step-${step.key}`}
                  >
                    <span
                      className={
                        step.completed
                          ? 'flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-[11px] text-white'
                          : 'size-5 shrink-0 rounded-full border-2 border-gray-300'
                      }
                      data-testid={step.completed ? `guided-tour-step-${step.key}-done` : undefined}
                      aria-hidden
                    >
                      {step.completed ? '✓' : ''}
                    </span>
                    <span className="text-left text-sm">{step.title}</span>
                  </button>
                </li>
              ))}
          </ol>

          <div className="min-w-0">
            {activeStep?.kind === 'video' && activeStep.video && selectedBatch ? (
              <GuidedTourVideoStep
                key={activeStep.key}
                lectureId={activeStep.video.lectureId}
                videoUrl={activeStep.video.videoUrl}
                batchId={selectedBatch.batchId}
                tab={effectiveTab}
                onReported={refetchProgress}
              />
            ) : activeStep ? (
              <GuidedTourStepPanel step={activeStep} idCardUrl={lectures?.idCardUrl ?? null} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

const TAB_ACTIVE = 'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white'
const TAB_IDLE = 'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100'
const TAB_LOCKED = 'inline-flex cursor-not-allowed items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-400'
const STEP_ACTIVE = 'flex w-full items-center gap-3 rounded-xl border border-primary bg-primary/5 px-4 py-3'
const STEP_IDLE = 'flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-300'
