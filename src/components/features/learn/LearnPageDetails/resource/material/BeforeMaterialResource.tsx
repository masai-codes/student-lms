'use client'

import { ResourcePhaseContent } from '../shared/ResourcePhaseContent'

type BeforeMaterialResourceProps = {
  schedule: string | null
}

export function BeforeMaterialResource({ schedule }: BeforeMaterialResourceProps) {
  return <ResourcePhaseContent kind="material" phase="before" schedule={schedule} />
}
