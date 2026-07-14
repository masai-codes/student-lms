import { Warning } from '@phosphor-icons/react'

export interface AgreementFieldIssue {
  /** Field key, used to focus the matching control (`agreement-${key}`). */
  key: string
  /** Human-readable field label (e.g. "Parent's Email ID"). */
  label: string
  /** The specific reason the field is invalid. */
  message: string
}

interface AgreementValidationSummaryProps {
  issues: Array<AgreementFieldIssue>
}

/** Focus (and scroll to) the control for a field key, if it's on screen. */
function focusField(key: string) {
  const el = document.getElementById(`agreement-${key}`)
  if (!el) return
  el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  // Focus after the scroll so the field lands in view before it steals focus.
  window.setTimeout(() => (el as HTMLElement).focus?.(), 150)
}

/**
 * A red banner listing exactly which detail-form fields still need attention and
 * why — so a learner knows what's blocking "Continue" instead of facing a
 * silently disabled button. Each row jumps to the offending field.
 */
export function AgreementValidationSummary({
  issues,
}: AgreementValidationSummaryProps) {
  if (issues.length === 0) return null

  return (
    <div
      className="rounded-xl border border-red-200 bg-danger-subtle p-4"
      role="alert"
      data-testid="agreement-validation-summary"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-danger-subtle-foreground">
        <Warning
          size={18}
          weight="fill"
          className="shrink-0 text-danger"
          aria-hidden
        />
        <span>
          Please fix {issues.length} {issues.length === 1 ? 'field' : 'fields'}{' '}
          to continue
        </span>
      </div>
      <ul className="mt-2 flex flex-col gap-1">
        {issues.map((issue) => (
          <li key={issue.key}>
            <button
              type="button"
              onClick={() => focusField(issue.key)}
              className="text-left text-xs text-danger hover:underline"
              data-testid={`agreement-validation-summary-item-${issue.key}`}
            >
              <span className="font-medium">{issue.label}:</span>{' '}
              {issue.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
