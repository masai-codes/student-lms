import { generateObject } from 'ai'
import { z } from 'zod'
import { getOpenRouterTextModel } from '@/server/api/interviews/clients/openRouterModel'
import { JUDGE_MODEL } from './models'

const verdictSchema = z.object({
  score: z.number().min(0).max(1),
  reason: z.string(),
})

export type JudgeVerdict = z.infer<typeof verdictSchema>

/** Runs a single LLM-graded verdict against a fixed judge model (never one
 * of the models under test), returning a 0-1 score plus its rationale. */
export async function judge(prompt: string): Promise<JudgeVerdict> {
  const { object } = await generateObject({
    model: getOpenRouterTextModel(JUDGE_MODEL),
    schema: verdictSchema,
    prompt: `${prompt}\n\nRespond with a score from 0 to 1 (1 = fully meets the criterion, 0 = fully fails it) and a one-sentence reason.`,
  })
  return object
}
