import type { LearnHubDetailPayload } from '@/server/learn/types'

export type AssignmentKind = 'practice' | 'assignment' | 'evaluation'

export type AssignmentPhase = 'before' | 'during' | 'after'

export type AssignmentDetailPayload = LearnHubDetailPayload & {
  assignmentKind: AssignmentKind
  phase: AssignmentPhase
  schedule: string | null
  concludes: string | null
  scheduleDisplayRange: string
  hostAvatarUrl: string | null
  instructions: string | null
  enforceDeadline: boolean
}
