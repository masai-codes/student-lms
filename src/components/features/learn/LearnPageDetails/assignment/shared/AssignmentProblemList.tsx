'use client'

import type {
  AssignmentProblemListItem,
  AssignmentProblemStatusTone,
} from '@/server/learn/utils/buildAssignmentProblemListItems'
import { MasaiChips } from '@/components/ui/masai-chips'

type AssignmentProblemListProps = {
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
export function AssignmentProblemList({ problems }: AssignmentProblemListProps) {
  if (problems.length === 0) {
    return null
  }

  return (
    <section data-testid="assignment-problem-list">
      <h2 className="type-h6 text-gray-900">Problems</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {problems.map((problem) => (
          <li
            key={problem.elementId}
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-4"
            data-testid={`assignment-problem-${problem.elementId}`}
          >
            <p className="type-b1-md text-gray-900">{problem.title}</p>
            {problem.statusChip ? (
              <MasaiChips
                label={problem.statusChip.label}
                size="regular"
                backgroundClassName={TONE_CLASSES[problem.statusChip.tone].background}
                textClassName={TONE_CLASSES[problem.statusChip.tone].text}
                className="pointer-events-none shrink-0"
                tabIndex={-1}
                data-testid={`assignment-problem-${problem.elementId}-status`}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
