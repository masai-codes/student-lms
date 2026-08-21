import { ApiError } from '@/server/api/http/apiError'
import { requestOpenRouterChatCompletion } from '@/server/api/interviews/clients/openRouterClient'
import { getInterviewReportModel } from '@/server/api/interviews/constants'

/**
 * All of a session's planned questions are generated once, up front, in a
 * single plain-text call — never one at a time as the interview
 * progresses. This keeps every question fixed and known in advance, so
 * later turns can speak them verbatim instead of re-generating (and
 * potentially drifting from) their wording each time the candidate advances.
 */
function buildQuestionsSystemPrompt(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  subtopics: Array<string>
  numQuestions: number
}): string {
  const subtopicsLine =
    input.subtopics.length > 0
      ? `\nDraw questions from these specific subtopics (spread across as many as make sense, don't force all of them in): ${input.subtopics.join(', ')}.\n`
      : ''

  return `You are designing questions for a mock interview on "${input.topicLabel}" for a candidate in the ${input.domain} track.
Focus areas: ${input.rubricFocus.join(', ')}.
${subtopicsLine}
Write exactly ${input.numQuestions} interview questions, ordered from foundational to more challenging. Each should:
- Stand alone (no "as discussed before", no referencing other questions).
- Be answerable out loud in a few minutes.
- Cover a distinct angle of the focus areas — avoid overlap between questions.

Respond with ONLY the questions, one per line, in order, numbered "1. ", "2. ", etc. No preamble, no commentary, no markdown.`
}

function parseNumberedQuestions(
  raw: string,
  numQuestions: number,
): Array<string> {
  const lines = raw
    .split('\n')
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean)

  return lines.slice(0, numQuestions)
}

export async function generateAllInterviewQuestions(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  subtopics: Array<string>
  numQuestions: number
  /** Overrides `getInterviewReportModel()` — lets evals compare model
   * variants against the exact same prompt/parsing logic production uses. */
  model?: string
}): Promise<Array<string>> {
  let raw: string
  try {
    raw = await requestOpenRouterChatCompletion({
      model: input.model ?? getInterviewReportModel(),
      messages: [
        { role: 'system', content: buildQuestionsSystemPrompt(input) },
        { role: 'user', content: 'Generate the questions now.' },
      ],
    })
  } catch (error) {
    console.error('Failed to generate interview questions', error)
    throw new ApiError(503, 'INTERVIEW_QUESTION_GENERATION_FAILED')
  }

  const questions = parseNumberedQuestions(raw, input.numQuestions)
  if (questions.length !== input.numQuestions) {
    console.error(
      'Interview question generation returned the wrong count',
      questions.length,
      input.numQuestions,
    )
    throw new ApiError(503, 'INTERVIEW_QUESTION_GENERATION_FAILED')
  }

  return questions
}
