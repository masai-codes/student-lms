/**
 * Support — ticket title generation with AI enhancement + deterministic fallbacks.
 *
 * Legacy `createTicketV2` called OpenAI to summarize the message. This module
 * uses Anthropic (Claude) when configured, but never blocks ticket creation:
 * every tier falls through to a readable deterministic title.
 */

import { generateText } from 'ai'
import { getAiTutorChatModel } from '@/server/api/ai-tutor/clients/anthropicModel'
import { plainTextFromHtml } from '@/lib/plainTextFromHtml'

type TicketTitleSource = 'ai' | 'entity' | 'message' | 'category' | 'default'

export type TicketTitleResult = {
  title: string
  source: TicketTitleSource
}

export type ResolveTicketTitleInput = {
  message: string
  category: string
  subCategory?: string | null
  entityTitle?: string | null
  faqQuestion?: string | null
}

const MAX_TITLE_LENGTH = 80
const MAX_AI_PROMPT_CHARS = 500
const DEFAULT_AI_TIMEOUT_MS = 1_500
const MAX_AI_WORDS = 12

const REJECTED_AI_TITLES = new Set([
  'na',
  'n/a',
  'help',
  'issue',
  'question',
  'support ticket',
  'support request',
  'ticket',
])

/** Turn menu slugs into readable labels (`score-issue` → `score issue`). */
export function humanizeTicketSlug(value: string): string {
  return String(value).replace(/[-_]/g, ' ').trim()
}

/** Legacy-style category + subcategory title (`lecture – Others`). */
export function titleFromCategorySubcategory(
  category: string,
  subCategory?: string | null,
): string {
  const parts = [category, subCategory]
    .filter((part) => part != null && String(part).trim() !== '')
    .map((part) => humanizeTicketSlug(String(part)))
  return parts.join(' – ')
}

/** First meaningful line of the student message, capped for list display. */
export function titleFromMessage(message: string): string {
  const withoutTags = message.replace(/<[^>]*>/g, ' ')
  const firstLine =
    withoutTags
      .split(/\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .find(Boolean) ?? withoutTags.replace(/\s+/g, ' ').trim()
  if (firstLine.length === 0) return ''
  if (firstLine.length <= MAX_TITLE_LENGTH) return firstLine
  return `${firstLine.slice(0, MAX_TITLE_LENGTH - 1)}…`
}

function buildEntityTitle(
  entityTitle: string | null | undefined,
  subCategory: string | null | undefined,
): string | null {
  const entity = entityTitle?.trim()
  if (!entity) return null
  const sub = subCategory?.trim()
  if (!sub) return entity
  return `${entity} – ${humanizeTicketSlug(sub)}`
}

/** Validate and normalize an AI-generated title; returns null when unusable. */
export function sanitizeAndValidateAiTitle(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null

  let title = raw.trim()
  if (
    (title.startsWith('"') && title.endsWith('"')) ||
    (title.startsWith("'") && title.endsWith("'"))
  ) {
    title = title.slice(1, -1).trim()
  }

  title = title
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (title.length < 3 || title.length > MAX_TITLE_LENGTH) return null
  if (REJECTED_AI_TITLES.has(title.toLowerCase())) return null
  if (title.split(/\s+/).length > MAX_AI_WORDS) return null

  return title
}

function aiTitlesEnabled(): boolean {
  return process.env.SUPPORT_AI_TITLES !== 'false'
}

function resolveAiTimeoutMs(override?: number): number {
  if (override != null && override > 0) return override
  const parsed = Number(process.env.SUPPORT_AI_TITLE_TIMEOUT_MS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_AI_TIMEOUT_MS
}

function buildAiPrompt(input: ResolveTicketTitleInput): {
  system: string
  user: string
} {
  const plainMessage = plainTextFromHtml(input.message).slice(
    0,
    MAX_AI_PROMPT_CHARS,
  )
  const category = humanizeTicketSlug(input.category)
  const subCategory = input.subCategory?.trim()
    ? humanizeTicketSlug(input.subCategory)
    : null
  const entityTitle = input.entityTitle?.trim() || null
  const faqQuestion = input.faqQuestion?.trim() || null

  const contextLines = [
    `Category: ${category}`,
    subCategory ? `Subcategory: ${subCategory}` : null,
    entityTitle ? `Related item: "${entityTitle}"` : null,
    faqQuestion ? `FAQ context: "${faqQuestion}"` : null,
    `Student message:\n${plainMessage}`,
  ].filter(Boolean)

  return {
    system:
      'Generate concise support ticket titles (max 10 words). Professional, descriptive, no quotes. Return title text only.',
    user: `Generate a concise ticket title for this support request.\n\n${contextLines.join('\n')}`,
  }
}

async function requestAiTitle(
  input: ResolveTicketTitleInput,
): Promise<string | null> {
  const { system, user } = buildAiPrompt(input)
  const result = await generateText({
    model: getAiTutorChatModel(),
    system,
    prompt: user,
    temperature: 0.3,
  })
  return sanitizeAndValidateAiTitle(result.text)
}

async function tryAiTicketTitle(
  input: ResolveTicketTitleInput,
  timeoutMs?: number,
): Promise<string | null> {
  if (!aiTitlesEnabled()) return null
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return null

  const timeout = resolveAiTimeoutMs(timeoutMs)

  try {
    const result = await Promise.race([
      requestAiTitle(input),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), timeout)
      }),
    ])
    return typeof result === 'string' ? result : null
  } catch (error) {
    console.error('[support] AI ticket title failed', error)
    return null
  }
}

/** Resolve a ticket title — AI first (time-boxed), then deterministic fallbacks. */
export async function resolveTicketTitle(
  input: ResolveTicketTitleInput,
  options?: { aiTimeoutMs?: number },
): Promise<TicketTitleResult> {
  const aiTitle = await tryAiTicketTitle(input, options?.aiTimeoutMs)
  if (aiTitle) return { title: aiTitle, source: 'ai' }

  const entityTitle = buildEntityTitle(input.entityTitle, input.subCategory)
  if (entityTitle) return { title: entityTitle, source: 'entity' }

  const messageTitle = titleFromMessage(input.message)
  if (messageTitle) return { title: messageTitle, source: 'message' }

  const categoryTitle = titleFromCategorySubcategory(
    input.category,
    input.subCategory,
  )
  if (categoryTitle) return { title: categoryTitle, source: 'category' }

  const categoryOnly = humanizeTicketSlug(input.category)
  if (categoryOnly) return { title: categoryOnly, source: 'category' }

  return { title: 'Support request', source: 'default' }
}
