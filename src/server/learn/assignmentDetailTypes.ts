import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import type { AssignmentDetailFooter } from '@/server/learn/assignmentDetailFooterTypes'
import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'
import type { LearnHubDetailPayload } from '@/server/learn/types'

export type AssignmentKind = 'practice' | 'assignment' | 'evaluation'

export type AssignmentPhase = 'before' | 'during' | 'after'

export type AssignmentDetailPayload = LearnHubDetailPayload & {
  associatedItems: Array<LearnAssociatedListItem>
  assignmentKind: AssignmentKind
  phase: AssignmentPhase
  schedule: string | null
  concludes: string | null
  scheduleDisplayRange: string
  hostAvatarUrl: string | null
  instructions: string | null
  enforceDeadline: boolean
  phaseContent: LearnPhaseContent
  footer: AssignmentDetailFooter
}
