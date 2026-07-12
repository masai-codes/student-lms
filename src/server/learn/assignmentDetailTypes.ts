import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import type { AssignmentDetailFooter } from '@/server/learn/assignmentDetailFooterTypes'
import type { LearnPhaseContent } from '@/server/learn/learnPhaseContentTypes'
import type { LearnHubDetailPayload } from '@/server/learn/types'
import type { AssignmentCompletedDetails } from '@/server/learn/utils/buildAssignmentCompletedDetails'
import type { AssignmentHeaderBadge } from '@/server/learn/utils/buildAssignmentHeaderBadges'
import type { AssignmentLiveAnalytics } from '@/server/learn/utils/buildAssignmentLiveAnalytics'
import type { AssignmentProblemListItem } from '@/server/learn/utils/buildAssignmentProblemListItems'

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
  completedDetails: AssignmentCompletedDetails | null
  headerBadges: Array<AssignmentHeaderBadge>
  liveAnalytics: AssignmentLiveAnalytics | null
  requiresPledge: boolean
  problems: Array<AssignmentProblemListItem>
  isBookmarked: boolean
}
