import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

type SqlPlaygroundAccordionPanelProps = {
  title: string
  count: number
  expanded: boolean
  onToggle: () => void
  children: ReactNode
  testId: string
}

/**
 * Mobile stand-in for the desktop Tables / Instructor's queries side panels —
 * there's no room to show both alongside the editor on a narrow screen, so
 * each collapses behind its own header and only one opens at a time (see
 * `SqlPlaygroundEditor`'s `mobileExpandedPanel`).
 */
export function SqlPlaygroundAccordionPanel({
  title,
  count,
  expanded,
  onToggle,
  children,
  testId,
}: SqlPlaygroundAccordionPanelProps) {
  return (
    <div
      data-testid={testId}
      className="overflow-hidden rounded-lg border border-border"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        data-testid={`${testId}-toggle`}
        className="flex w-full items-center justify-between gap-2 bg-surface-muted px-3 py-2 text-sm font-medium text-foreground"
      >
        <span>
          {title} <span className="text-foreground-muted">({count})</span>
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-foreground-muted transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>
      {expanded ? (
        <div className="max-h-72 overflow-auto border-t border-border">
          {children}
        </div>
      ) : null}
    </div>
  )
}
