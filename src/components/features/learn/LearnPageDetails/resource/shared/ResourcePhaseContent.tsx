'use client'

import { getResourcePhaseCopy } from './resourcePhaseCopy'

import type { ResourceKind, ResourcePhase } from '@/server/learn/resourceDetailTypes'
import { formatSqlDate } from '@/utils/generics'

type ResourcePhaseContentProps = {
  kind: ResourceKind
  phase: ResourcePhase
  schedule: string | null
}

export function ResourcePhaseContent({
  kind,
  phase,
  schedule,
}: ResourcePhaseContentProps) {
  const copy = getResourcePhaseCopy(kind, phase)
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
            <span className="type-b2-md text-gray-900">Unlocks {unlockLabel}.</span>
          </>
        ) : null}
      </p>
    </section>
  )
}
