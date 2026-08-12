export type InterviewDomain =
  | 'software-development'
  | 'data-ai-ml'
  | 'product-management'
  | 'general'

type InterviewAnswerSource = 'voice' | 'typed'

/**
 * A follow-up probe on a question's main answer — NOT a planned question of
 * its own (it's never pre-generated, never counted toward `numQuestions`,
 * and never advances the progress bar). It only exists nested under the
 * `InterviewTurn` it was asked about.
 */
export type InterviewFollowUp = {
  /** The interviewer's spoken follow-up prompt. */
  prompt: string
  /** Verbatim typed answer text; '' until answered. */
  transcript: string
  /** Raw base64 WAV of a voice answer; null for typed or not-yet-answered follow-ups. */
  answerAudioBase64: string | null
  answerSource: InterviewAnswerSource
  askedAt: string
  /** '' means this follow-up is still pending — the canonical "answered" sentinel. */
  answeredAt: string
}

export type InterviewTurn = {
  /** 0-based index among the session's pre-generated planned questions. */
  questionIndex: number
  /** Fixed question text, generated once for the whole session up front. */
  question: string
  /** '' until this question has actually been asked (spoken) — later
   * questions sit in the DB unasked until the interview reaches them. */
  askedAt: string
  /** Candidate's answer to `question` itself (not to a follow-up). Verbatim
   * typed text; '' for voice-answered or not-yet-answered turns. */
  transcript: string
  /** Raw base64 WAV of a voice answer — replayed as conversation memory and fed into report scoring; null for typed or not-yet-answered turns. */
  answerAudioBase64: string | null
  answerSource: InterviewAnswerSource
  /** Probing follow-ups asked about this question's answer, in order. */
  followUps: Array<InterviewFollowUp>
  /** '' means the question (including any follow-ups) is still in progress —
   * the canonical "fully done, moved past" sentinel. */
  answeredAt: string
}

type InterviewReportRubricItem = {
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
  numQuestions: number
  /** Language the interviewer speaks/replies in for this session — chosen at
   * creation and fixed for the rest of the session. */
  language: string
  turns: Array<InterviewTurn>
  report: InterviewReport | null
  createdAt: string | null
  updatedAt: string | null
  completedAt: string | null
}

export type InterviewSessionSummary = {
  id: number
  topicLabel: string
  status: InterviewSessionStatus
  createdAt: string | null
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
