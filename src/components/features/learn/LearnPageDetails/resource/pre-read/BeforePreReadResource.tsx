'use client'

import { ResourcePhaseContent } from '../shared/ResourcePhaseContent'

type BeforePreReadResourceProps = {
  schedule: string | null
}

export function BeforePreReadResource({ schedule }: BeforePreReadResourceProps) {
  return <ResourcePhaseContent kind="pre-read" phase="before" schedule={schedule} />
}
