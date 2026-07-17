import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface AgreementStepperProps {
  /** Ordered sub-step labels (Enter Details → each document → Signature Certificate). */
  steps: Array<string>
  /** Index of the active sub-step. */
  current: number
  /** Navigate to a step (the caller allows only already-reached steps). */
  onSelect: (index: number) => void
}

/**
 * Horizontal stepper for the agreement flow — shows every sub-step and the
 * current position. Passed (earlier) steps show a check and are clickable to go
 * back; the current step is highlighted; later steps are disabled. Scrolls
 * horizontally when there are many documents.
 */
export function AgreementStepper({
  steps,
  current,
  onSelect,
}: AgreementStepperProps) {
  return (
    <ol
      className="flex items-center gap-1 overflow-x-auto pb-1"
      data-testid="agreement-stepper"
    >
      {steps.map((label, index) => {
        const done = index < current
        const active = index === current
        const reachable = index <= current
        return (
          <li key={label} className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onSelect(index)}
              aria-current={active}
              className={cn(
                'flex items-center gap-2 rounded-full px-2 py-1 text-sm transition-colors',
                reachable ? 'cursor-pointer' : 'cursor-default',
              )}
              data-testid={`agreement-step-tab-${index}`}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  active && 'bg-brand text-brand-foreground',
                  done && 'bg-green-500 text-white',
                  !active &&
                    !done &&
                    'border-2 border-border-strong text-foreground-subtle',
                )}
                aria-hidden
              >
                {done ? (
                  <Check weight="bold" className="size-3.5" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap',
                  active
                    ? 'font-semibold text-foreground'
                    : done
                      ? 'text-foreground'
                      : 'text-foreground-subtle',
                )}
              >
                {label}
              </span>
            </button>
            {index < steps.length - 1 ? (
              <span className="h-px w-5 shrink-0 bg-muted" aria-hidden />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
