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
  completed: { background: 'bg-[#EEFFF7]', text: '!text-[#049402]' },
  'in-progress': { background: 'bg-[#FFF9E5]', text: '!text-[#FF832B]' },
  pending: { background: 'bg-[#F6EDE7]', text: '!text-[#CC926E]' },
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
      <h2 className="type-h6 text-gray-900">Problems</h2>
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
              className="dash-lift group flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-4 transition-colors hover:border-[#4F6BED]/35 hover:bg-gray-50"
              data-testid={`assignment-problem-${problem.elementId}`}
            >
              <p className="type-b1-md min-w-0 break-words text-gray-900">
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
                  className="size-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#4F6BED]"
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
