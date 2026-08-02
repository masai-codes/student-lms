import { z } from 'zod'
import { ApiError } from '@/server/api/http/apiError'
import type { OpenRouterChatMessage } from '@/server/api/interviews/clients/openRouterClient'
import { requestOpenRouterChatCompletion } from '@/server/api/interviews/clients/openRouterClient'
import { getInterviewAudioModel } from '@/server/api/interviews/constants'
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

const REPORT_SECTION_HEADERS = [
  'OVERALL_SCORE',
  'SUMMARY',
  'STRENGTHS',
  'IMPROVEMENTS',
  'RUBRIC',
] as const

function buildReportSystemPrompt(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
}): string {
  return `You are grading a completed mock interview on "${input.topicLabel}" (${input.domain} track) against these rubric dimensions: ${input.rubricFocus.join(', ')}.

You will receive the sequence of questions asked and the candidate's answers, as audio and/or text, in order.

Respond in EXACTLY this plain-text format and nothing else — no markdown, no extra commentary:
OVERALL_SCORE: <integer 0-100>
SUMMARY: <one short paragraph>
STRENGTHS:
- <strength>
- <strength>
IMPROVEMENTS:
- <improvement>
- <improvement>
RUBRIC:
- dimension: <one of the focus areas above> | score: <integer 0-100> | comment: <one sentence>

Include exactly one RUBRIC line per focus area listed above. Ground every strength, improvement, and comment in what the candidate actually said.`
}

/**
 * Grading call over the raw per-turn audio (no transcript exists anymore) —
 * must use the audio-capable model, and since that model doesn't support
 * `json_schema` structured output, the response is parsed out of a plain-text
 * convention instead. Deliberately separate from the per-turn audio call so
 * it stays deterministic and re-runnable.
 */
function buildReportMessages(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  turns: Array<InterviewTurn>
}): Array<OpenRouterChatMessage> {
  const messages: Array<OpenRouterChatMessage> = [
    { role: 'system', content: buildReportSystemPrompt(input) },
  ]

  input.turns.forEach((turn, i) => {
    messages.push({
      role: 'assistant',
      content: `Question ${i + 1}: ${turn.question}`,
    })
    messages.push({
      role: 'user',
      content: turn.answerAudioBase64
        ? [
            {
              type: 'input_audio',
              input_audio: { data: turn.answerAudioBase64, format: 'wav' },
            },
          ]
        : [{ type: 'text', text: turn.transcript }],
    })
  })

  return messages
}

/** Splits the model's plain-text response into named sections by header line. */
function splitReportSections(raw: string): Record<string, string> {
  const headerPattern = new RegExp(
    `^\\s*(${REPORT_SECTION_HEADERS.join('|')})\\s*:?\\s*(.*)$`,
    'i',
  )
  const sections: Record<string, Array<string>> = {}
  let current: string | null = null

  for (const line of raw.split('\n')) {
    const match = line.match(headerPattern)
    if (match) {
      current = match[1].toUpperCase()
      sections[current] = match[2] ? [match[2]] : []
      continue
    }
    if (current) sections[current].push(line)
  }

  const result: Record<string, string> = {}
  for (const key of Object.keys(sections)) {
    result[key] = sections[key].join('\n').trim()
  }
  return result
}

function extractInt(text: string): number | null {
  const match = text.match(/-?\d+/)
  return match ? Number(match[0]) : null
}

function extractBullets(text: string): Array<string> {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*[-*]\s*/, '').trim())
    .filter(Boolean)
}

/**
 * The model doesn't reliably keep the `dimension:`/`score:`/`comment:` key
 * prefixes on rubric lines (observed dropping `dimension:` in testing), so
 * segments without a recognized key fall back to positional assignment.
 */
function parseRubricLine(
  line: string,
): { dimension: string; score: number; comment: string } | null {
  const cleaned = line.replace(/^\s*[-*]\s*/, '').trim()
  if (!cleaned) return null

  let dimension = ''
  let score: number | null = null
  let comment = ''

  cleaned.split('|').forEach((rawSegment, i) => {
    const segment = rawSegment.trim()
    const keyed = segment.match(/^(dimension|score|comment)\s*:\s*(.*)$/i)
    if (keyed) {
      const value = keyed[2].trim()
      if (keyed[1].toLowerCase() === 'dimension') dimension = value
      else if (keyed[1].toLowerCase() === 'score')
        score = extractInt(value) ?? score
      else comment = value
      return
    }
    if (i === 0 && !dimension) dimension = segment
    else if (i === 1 && score === null) score = extractInt(segment)
    else if (i === 2 && !comment) comment = segment
  })

  if (!dimension || score === null) return null
  return { dimension, score, comment }
}

function parseDelimitedReport(raw: string): unknown {
  const sections = splitReportSections(raw)
  const overallScore = sections.OVERALL_SCORE
    ? extractInt(sections.OVERALL_SCORE)
    : null

  return {
    overallScore,
    summary: sections.SUMMARY ?? '',
    strengths: sections.STRENGTHS ? extractBullets(sections.STRENGTHS) : [],
    improvements: sections.IMPROVEMENTS
      ? extractBullets(sections.IMPROVEMENTS)
      : [],
    rubric: sections.RUBRIC
      ? sections.RUBRIC.split('\n')
          .map(parseRubricLine)
          .filter((item): item is NonNullable<typeof item> => item !== null)
      : [],
  }
}

export async function generateInterviewReport(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  turns: Array<InterviewTurn>
}): Promise<InterviewReport> {
  let raw: string
  try {
    raw = await requestOpenRouterChatCompletion({
      model: getInterviewAudioModel(),
      messages: buildReportMessages(input),
    })
  } catch (error) {
    console.error('Failed to generate interview report', error)
    throw new ApiError(503, 'INTERVIEW_REPORT_GENERATION_FAILED')
  }

  const parsed = interviewReportSchema.safeParse(parseDelimitedReport(raw))
  if (!parsed.success) {
    console.error('Interview report failed schema validation', parsed.error)
    throw new ApiError(503, 'INTERVIEW_REPORT_GENERATION_FAILED')
  }

  return parsed.data
}
