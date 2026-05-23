'use client'

import { getAssignmentPhaseCopy } from './assignmentPhaseCopy'

import type {
  AssignmentKind,
  AssignmentPhase,
} from '@/server/learn/assignmentDetailTypes'
import { formatSqlDate } from '@/utils/generics'
import type { ReactNode } from 'react'

type AssignmentPhaseContentProps = {
  kind: AssignmentKind
  phase: AssignmentPhase
  schedule: string | null
  action?: ReactNode
}

export function AssignmentPhaseContent({
  kind,
  phase,
  schedule,
  action,
}: AssignmentPhaseContentProps) {
  const copy = getAssignmentPhaseCopy(kind, phase)
  const unlockLabel =
    schedule != null && schedule.trim() !== ''
      ? formatSqlDate(schedule)
      : 'the scheduled time'

  return (
    <section className="space-y-3">
      <h2 className="type-h6 text-gray-900">{copy.title}</h2>
      <p className="type-b2-regular text-gray-600">
        {copy.description}
        {phase === 'before' ? (
          <>
            {' '}
            <span className="type-b2-md text-gray-900">Opens {unlockLabel}.</span>
          </>
        ) : null}
      </p>
      {action ? <div className="pt-1">{action}</div> : null}
    </section>
  )
}
