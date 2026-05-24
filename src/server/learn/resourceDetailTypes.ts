import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'
import type { LearnHubDetailPayload } from '@/server/learn/types'

/** Normalized from lecture `category` for reading resources. */
export type ResourceKind = 'pre-read' | 'notes' | 'material'

export type ResourcePhase = 'before' | 'during' | 'after'

export type ResourceDetailPayload = LearnHubDetailPayload & {
  associatedItems: Array<LearnAssociatedListItem>
  resourceKind: ResourceKind
  phase: ResourcePhase
  schedule: string | null
  concludes: string | null
  scheduleDisplayRange: string
  hostAvatarUrl: string | null
  /** Primary reading content (notes, else description). */
  body: string | null
  hideNotes: boolean
  phaseContent: LearnPhaseContent
}
