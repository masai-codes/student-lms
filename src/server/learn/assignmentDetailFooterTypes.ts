import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'

export type AssignmentFooterActionVariant = 'primary' | 'secondary'

export type AssignmentFooterActionKind =
  | 'start-assessment'
  | 'continue-assessment'
  | 'practice-assessment'
  | 'show-submission'
  | 'toggle-completion'

export type AssignmentFooterAction = {
  kind: AssignmentFooterActionKind
  label: string
  variant: AssignmentFooterActionVariant
  enabled: boolean
}

export type AssignmentFooterStatusChip = {
  status: AssignmentProgressStatus
  label: string
}

export type AssignmentFooterScore = {
  state: 'pending' | 'released'
  score: number | null
  label: string
}

export type AssignmentFooterNoticeVariant =
  'score-policy' | 'practice-after-deadline'

export type AssignmentFooterNotice = {
  variant: AssignmentFooterNoticeVariant
  message: string
}

export type AssignmentDetailFooterMeta = {
  submissionId: number | null
  assessPlatformLink: string | null
  platform: string | null
}

/** Server-driven sticky footer for assignment detail (desktop-first, mirrors legacy LMS). */
export type AssignmentDetailFooter = {
  visible: boolean
  statusChip: AssignmentFooterStatusChip | null
  showPracticeModeChip: boolean
  score: AssignmentFooterScore | null
  notices: Array<AssignmentFooterNotice>
  actions: Array<AssignmentFooterAction>
  meta: AssignmentDetailFooterMeta
}
