export type InterviewDomain =
  | 'software-development'
  | 'data-ai-ml'
  | 'product-management'
  | 'general'

export type InterviewAnswerSource = 'voice' | 'typed'

export type InterviewTurn = {
  index: number
  question: string
  transcript: string
  answerSource: InterviewAnswerSource
  askedAt: string
  answeredAt: string
}

export type InterviewReportRubricItem = {
  dimension: string
  score: number
  comment: string
}

export type InterviewReport = {
  overallScore: number
  rubric: Array<InterviewReportRubricItem>
  strengths: Array<string>
  improvements: Array<string>
  summary: string
}

export type InterviewSessionStatus = 'in_progress' | 'completed' | 'abandoned'

export type InterviewSession = {
  id: number
  userId: number
  topicId: string
  topicLabel: string
  domain: InterviewDomain
  status: InterviewSessionStatus
  turns: Array<InterviewTurn>
  report: InterviewReport | null
  createdAt: string | null
  updatedAt: string | null
  completedAt: string | null
}

export type InterviewTopic = {
  id: string
  label: string
  iconKey: string
  blurb: string
  rubricFocus: Array<string>
}

export type InterviewTopicsForUser = {
  domain: InterviewDomain
  catalogTopics: Array<InterviewTopic>
  curriculumTopics: Array<InterviewTopic>
}
