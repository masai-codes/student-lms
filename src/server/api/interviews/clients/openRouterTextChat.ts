import type { OpenRouterJsonSchemaFormat } from '@/server/api/interviews/clients/openRouterClient'
import { requestOpenRouterChatCompletion } from '@/server/api/interviews/clients/openRouterClient'

/** Plain text completion — used once per session to generate the opening question. */
export async function requestOpenRouterText(input: {
  model: string
  prompt: string
}): Promise<string> {
  return requestOpenRouterChatCompletion({
    model: input.model,
    messages: [{ role: 'user', content: input.prompt }],
  })
}

const REPORT_JSON_SCHEMA: OpenRouterJsonSchemaFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'interview_report',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        overallScore: { type: 'number' },
        rubric: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              score: { type: 'number' },
              comment: { type: 'string' },
            },
            required: ['dimension', 'score', 'comment'],
            additionalProperties: false,
          },
        },
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
      required: [
        'overallScore',
        'rubric',
        'strengths',
        'improvements',
        'summary',
      ],
      additionalProperties: false,
    },
  },
}

/** Structured JSON completion — used once per session, on the final question, to score it. */
export async function requestOpenRouterReportJson(input: {
  model: string
  prompt: string
}): Promise<unknown> {
  const content = await requestOpenRouterChatCompletion({
    model: input.model,
    messages: [{ role: 'user', content: input.prompt }],
    responseFormat: REPORT_JSON_SCHEMA,
  })

  try {
    return JSON.parse(content)
  } catch {
    throw new Error('INTERVIEW_OPENROUTER_INVALID_RESPONSE')
  }
}
