'use client'

import { CaretRight } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'

import type {
  AssignmentProblemListItem,
  AssignmentProblemStatusTone,
} from '@/server/learn/utils/buildAssignmentProblemListItems'
import { MasaiChips } from '@/components/ui/masai-chips'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

type AssignmentProblemListProps = {
  assignmentId: number
  problems: Array<AssignmentProblemListItem>
}

const TONE_CLASSES: Record<
  AssignmentProblemStatusTone,
  { background: string; text: string }
> = {
  completed: {
    background: 'bg-success-subtle',
    text: '!text-success-subtle-foreground',
  },
  'in-progress': {
    background: 'bg-warning-subtle',
    text: '!text-warning-subtle-foreground',
  },
  pending: {
    background: 'bg-[#F6EDE7] dark:bg-warning-subtle',
    text: '!text-[#CC926E] dark:!text-warning-subtle-foreground',
  },
}

/** Problems belonging to an assignment, each with its per-problem solution status. */
export function AssignmentProblemList({
  assignmentId,
  problems,
}: AssignmentProblemListProps) {
  if (problems.length === 0) {
    return null
  }

  return (
    <section data-testid="assignment-problem-list">
      <h2 className="type-h6 text-foreground">Problems</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {problems.map((problem, index) => (
          <li
            key={problem.elementId}
            className="animate-dash-row-in"
            style={
              {
                '--dash-delay': `${Math.min(index * 0.05, 0.4)}s`,
              } as React.CSSProperties
            }
          >
            <Link
              to="/assignments/$assignmentId/problems/$problemId"
              params={{
                assignmentId: String(assignmentId),
                problemId: String(problem.problemId),
              }}
              onClick={() =>
                pushLearnEvent(
                  learnEntityEvent(
                    'assignment',
                    'problem_open',
                    problem.problemId,
                  ),
                  {
                    assignment_id: assignmentId,
                    problem_id: problem.problemId,
                    element_id: problem.elementId,
                  },
                )
              }
              className="dash-lift group flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-4 transition-colors hover:border-brand/35 hover:bg-surface-muted"
              data-testid={`assignment-problem-${problem.elementId}`}
            >
              <p className="type-b1-md min-w-0 break-words text-foreground">
                {problem.title}
              </p>
              <span className="flex shrink-0 items-center gap-3">
                {problem.statusChip ? (
                  <MasaiChips
                    label={problem.statusChip.label}
                    size="regular"
                    backgroundClassName={
                      TONE_CLASSES[problem.statusChip.tone].background
                    }
                    textClassName={TONE_CLASSES[problem.statusChip.tone].text}
                    className="pointer-events-none transition-colors duration-200"
                    tabIndex={-1}
                    data-testid={`assignment-problem-${problem.elementId}-status`}
                  />
                ) : null}
                <CaretRight
                  className="size-4 text-foreground-subtle transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand"
                  aria-hidden
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
