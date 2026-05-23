import type { LearnHubDetailPayload } from '@/server/learn/types'

/** Normalized from lecture `category` for reading resources. */
export type ResourceKind = 'pre-read' | 'notes' | 'material'

export type ResourcePhase = 'before' | 'during' | 'after'

export type ResourceDetailPayload = LearnHubDetailPayload & {
  resourceKind: ResourceKind
  phase: ResourcePhase
  schedule: string | null
  concludes: string | null
  scheduleDisplayRange: string
  hostAvatarUrl: string | null
  /** Primary reading content (notes, else description). */
  body: string | null
  hideNotes: boolean
}
