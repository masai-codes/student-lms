'use client'

import { ResourcePhaseContent } from '../shared/ResourcePhaseContent'

type BeforeNotesResourceProps = {
  schedule: string | null
}

export function BeforeNotesResource({ schedule }: BeforeNotesResourceProps) {
  return <ResourcePhaseContent kind="notes" phase="before" schedule={schedule} />
}
