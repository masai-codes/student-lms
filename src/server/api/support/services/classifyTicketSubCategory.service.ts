/**
 * Support — AI subcategory classification when the student skipped the chip.
 *
 * `subCategory` is normally set by the student tapping a "common question"
 * chip. When they type their own message instead, this classifies it against
 * the static taxonomy in `aiSubcategoryTaxonomy.ts` — never against a live,
 * editable data source. Mirrors `generateTicketTitle.service.ts`'s contract
 * exactly: Anthropic (Claude Haiku) when configured, time-boxed, and never
 * blocks or fails ticket creation — any doubt at all resolves to `null`
 * (the caller then leaves `subCategory` blank, same as today).
 *
 * `general_query` is classified in two hops instead of one flat 48-option
 * list: first the topic bucket (~10 options), then the specific question
 * within just that bucket (4–14 options). Each hop only ever asks the model
 * to disambiguate a small, focused set — asking it to weigh all ~48 at once
 * would hand it far more similar-sounding options than it needs, which is
 * exactly the kind of extra context that hurts classification accuracy
 * rather than helping it.
 */

import { generateText } from 'ai'
import { getAiTutorChatModel } from '@/server/api/ai-tutor/clients/anthropicModel'
import { plainTextFromHtml } from '@/lib/plainTextFromHtml'
import {
  FLAT_SUBCATEGORY_TAXONOMY,
  GENERAL_QUERY_CATEGORY,
  GENERAL_QUERY_SUBCATEGORY_TAXONOMY,
} from '@/server/api/support/aiSubcategoryTaxonomy'

const MAX_AI_PROMPT_CHARS = 500
const DEFAULT_AI_TIMEOUT_MS = 1_500
/** Sentinel the model returns when none of the given options genuinely fit. */
const NO_MATCH = 'NONE'

export type SubCategoryClassification = {
  subCategory: string
  source: 'ai'
}

function aiClassificationEnabled(): boolean {
  return process.env.SUPPORT_AI_SUBCATEGORY !== 'false'
}

function resolveAiTimeoutMs(override?: number): number {
  if (override != null && override > 0) return override
  const parsed = Number(process.env.SUPPORT_AI_SUBCATEGORY_TIMEOUT_MS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_AI_TIMEOUT_MS
}

async function requestClassification(input: {
  message: string
  options: Array<string>
  contextLabel: string
}): Promise<string | null> {
  const plainMessage = plainTextFromHtml(input.message).slice(
    0,
    MAX_AI_PROMPT_CHARS,
  )
  const system = `You classify a student support message into exactly one ${input.contextLabel} from a fixed list. Reply with the matching option copied EXACTLY as given, character-for-character — no quotes, no extra words. If none of the options genuinely fit, reply with exactly: ${NO_MATCH}`
  const user = `Options:\n${input.options.map((option) => `- ${option}`).join('\n')}\n\nStudent message:\n${plainMessage}`

  const result = await generateText({
    model: getAiTutorChatModel(),
    system,
    prompt: user,
    temperature: 0,
  })
  return result.text.trim()
}

/**
 * Ask the model to pick exactly one option for the message, or null. Options
 * are always taken from the static taxonomy, so an out-of-list answer is
 * treated as a miss rather than trusted — this never invents a new value.
 * A single-option list skips the AI call entirely: there's no ambiguity.
 */
async function classifyFromOptions(input: {
  message: string
  options: Array<string>
  contextLabel: string
  timeoutMs?: number
}): Promise<string | null> {
  if (input.options.length === 0) return null
  if (input.options.length === 1) return input.options[0]
  if (!aiClassificationEnabled()) return null
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return null

  const timeout = resolveAiTimeoutMs(input.timeoutMs)

  try {
    const raw = await Promise.race([
      requestClassification(input),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), timeout)
      }),
    ])
    if (raw == null || raw === NO_MATCH) return null
    return input.options.includes(raw) ? raw : null
  } catch (error) {
    console.error('[support] AI subcategory classification failed', error)
    return null
  }
}

/**
 * Classify a ticket's subCategory from its message when the student didn't
 * pick a chip. Returns `null` when the category has no known taxonomy entry,
 * or when classification can't produce a confident, list-validated match —
 * callers should treat `null` exactly like "leave subCategory blank."
 */
export async function classifyTicketSubCategory(
  input: { category: string; message: string },
  options?: { timeoutMs?: number },
): Promise<SubCategoryClassification | null> {
  if (!input.message.trim()) return null

  if (input.category === GENERAL_QUERY_CATEGORY) {
    const buckets = Object.keys(GENERAL_QUERY_SUBCATEGORY_TAXONOMY)
    const bucket = await classifyFromOptions({
      message: input.message,
      options: buckets,
      contextLabel: 'topic area',
      timeoutMs: options?.timeoutMs,
    })
    if (!bucket) return null

    const question = await classifyFromOptions({
      message: input.message,
      options: GENERAL_QUERY_SUBCATEGORY_TAXONOMY[bucket],
      contextLabel: 'specific issue',
      timeoutMs: options?.timeoutMs,
    })
    if (!question) return null

    return { subCategory: question, source: 'ai' }
  }

  const questions = FLAT_SUBCATEGORY_TAXONOMY[input.category]
  if (!questions) return null

  const question = await classifyFromOptions({
    message: input.message,
    options: questions,
    contextLabel: 'specific issue',
    timeoutMs: options?.timeoutMs,
  })
  if (!question) return null

  return { subCategory: question, source: 'ai' }
}
