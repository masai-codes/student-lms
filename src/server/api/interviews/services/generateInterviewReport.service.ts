import { z } from 'zod'
import { ApiError } from '@/server/api/http/apiError'
import { requestOpenRouterReportJson } from '@/server/api/interviews/clients/openRouterTextChat'
import { getInterviewTextModel } from '@/server/api/interviews/constants'
import type {
  InterviewReport,
  InterviewTurn,
} from '@/server/api/interviews/types/interviewSession'

const interviewReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  rubric: z
    .array(
      z.object({
        dimension: z.string(),
        score: z.number().min(0).max(100),
        comment: z.string(),
      }),
    )
    .min(1),
  strengths: z.array(z.string()).min(1),
  improvements: z.array(z.string()).min(1),
  summary: z.string(),
})

function buildReportPrompt(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  turns: Array<InterviewTurn>
}): string {
  const transcript = input.turns
    .map(
      (turn, i) => `Q${i + 1}: ${turn.question}\nA${i + 1}: ${turn.transcript}`,
    )
    .join('\n\n')

  return `You are scoring a completed mock interview on "${input.topicLabel}" (${input.domain} track). Focus areas: ${input.rubricFocus.join(', ')}.

Below is the full transcript of questions and the candidate's (verbatim, possibly informal) spoken answers:

${transcript}

Score the candidate's performance. Use each focus area as a rubric dimension (score 0-100), plus an overall score (0-100). Give concrete strengths and improvements grounded in what the candidate actually said, and a short summary.`
}

/**
 * Text-only scoring call over accumulated transcripts — deliberately
 * separate from the per-turn audio call so it stays deterministic and
 * re-runnable. Goes through OpenRouter (same key as the audio turn model)
 * rather than Anthropic directly, so this feature needs only OPENROUTER_API_KEY.
 */
export async function generateInterviewReport(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  turns: Array<InterviewTurn>
}): Promise<InterviewReport> {
  let raw: unknown
  try {
    raw = await requestOpenRouterReportJson({
      model: getInterviewTextModel(),
      prompt: buildReportPrompt(input),
    })
  } catch (error) {
    console.error('Failed to generate interview report', error)
    throw new ApiError(503, 'INTERVIEW_REPORT_GENERATION_FAILED')
  }

  const parsed = interviewReportSchema.safeParse(raw)
  if (!parsed.success) {
    console.error('Interview report failed schema validation', parsed.error)
    throw new ApiError(503, 'INTERVIEW_REPORT_GENERATION_FAILED')
  }

  return parsed.data
}
