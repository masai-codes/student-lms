import {
  Camera,
  CaretRight,
  CheckCircle,
  CircleHalf,
  DownloadSimple,
  FileText,
  IdentificationCard,
  Info,
  Package,
  Play,
  UploadSimple,
} from '@phosphor-icons/react'
import { pushDashboardEvent } from '../../shared/dashboardAnalytics'
import type { GuidedTourStep } from './steps'

interface GuidedTourStepListProps {
  steps: Array<GuidedTourStep>
  activeKey: string | undefined
  onSelect: (key: string) => void
  completed: number
  total: number
  /** Show the "watch the complete video" hint (hidden once the ID card unlocks). */
  showHint?: boolean
}

/** The step's leading icon: done → check, active → half-ring, else its type icon. */
function StepIcon({
  step,
  isActive,
}: {
  step: GuidedTourStep
  isActive: boolean
}) {
  if (step.completed)
    return <CheckCircle weight="fill" className="size-5 text-green-500" />
  if (isActive)
    return <CircleHalf weight="fill" className="size-5 text-brand" />
  switch (step.action) {
    case 'profile-photo':
      return <Camera className="size-5 text-foreground-subtle" />
    case 'download-app':
      return <DownloadSimple className="size-5 text-foreground-subtle" />
    case 'agreement':
      return <FileText className="size-5 text-foreground-subtle" />
    case 'documents':
      return <UploadSimple className="size-5 text-foreground-subtle" />
    case 'student-kit':
      return <Package className="size-5 text-foreground-subtle" />
    case 'id-card':
      return <IdentificationCard className="size-5 text-foreground-subtle" />
    default:
      return <Play weight="fill" className="size-4 text-foreground-subtle" />
  }
}

/**
 * Left panel of the guided tour: a "Your Progress" header + bar, the timeline
 * step list (each step a card with its state/type icon, connected vertically),
 * and the completion hint. Presentation-only — selection is owned by the caller.
 */
export function GuidedTourStepList({
  steps,
  activeKey,
  onSelect,
  completed,
  total,
  showHint = true,
}: GuidedTourStepListProps) {
  const shown = Math.min(completed, total)
  const pct = total > 0 ? Math.round((shown / total) * 100) : 100

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Your Progress</span>
          <span
            className="text-foreground-muted"
            data-testid="guided-tour-progress-label"
          >
            {shown} of {total} done
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          data-testid="guided-tour-progress"
        >
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="flex flex-col" data-testid="guided-tour-step-list">
        {steps.map((step, index) => {
          const isActive = step.key === activeKey
          return (
            <li key={step.key}>
              <button
                type="button"
                onClick={() => {
                  pushDashboardEvent('l_dashboard_guided_tour_step_select', {
                    step_key: step.key,
                    step_action: step.action,
                    completed: step.completed,
                  })
                  onSelect(step.key)
                }}
                aria-current={isActive}
                className={isActive ? STEP_ACTIVE : STEP_IDLE}
                data-testid={`guided-tour-step-${step.key}`}
              >
                <span
                  className="shrink-0"
                  data-testid={
                    step.completed
                      ? `guided-tour-step-${step.key}-done`
                      : undefined
                  }
                  aria-hidden
                >
                  <StepIcon step={step} isActive={isActive} />
                </span>
                <span className="flex-1 text-left text-sm text-foreground">
                  {step.title}
                </span>
                <CaretRight
                  className="size-4 shrink-0 text-foreground-subtle"
                  aria-hidden
                />
              </button>
              {index < steps.length - 1 ? (
                <div className="ml-[27px] h-2 w-px bg-muted" aria-hidden />
              ) : null}
            </li>
          )
        })}
      </ol>

      {showHint ? (
        <div
          className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-700 dark:bg-info-subtle dark:text-info-subtle-foreground"
          data-testid="guided-tour-hint"
        >
          <Info className="mt-0.5 size-4 shrink-0" weight="fill" aria-hidden />
          <span>
            Make sure to watch the complete video to update your progress.
          </span>
        </div>
      ) : null}
    </div>
  )
}

const STEP_ACTIVE =
  'flex w-full items-center gap-3 rounded-xl border border-brand bg-brand/10 px-4 py-3'
const STEP_IDLE =
  'flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:border-border-strong'
