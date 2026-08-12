/** One FAQ entry stored in `lectures_ai.faqs`. */
export type LectureAiFaq = {
  question: string
  answer: string
}

/** Cap on how many FAQs the chat empty state offers as suggestions. */
export const LECTURE_AI_FAQ_LIMIT = 3

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

/**
 * `lectures_ai.faqs` is a JSON column populated by the transcript pipeline —
 * an array of `{ question, answer }` entries, e.g.
 * `[{ "question": "...", "answer": "..." }]`.
 */
export function parseLectureAiFaqs(faqs: unknown): Array<LectureAiFaq> {
  if (!Array.isArray(faqs)) return []

  const results: Array<LectureAiFaq> = []
  for (const item of faqs) {
    if (results.length >= LECTURE_AI_FAQ_LIMIT) break
    if (!item || typeof item !== 'object') continue

    const row = item as Record<string, unknown>
    const question = readTrimmedString(row.question)
    const answer = readTrimmedString(row.answer)
    if (!question || !answer) continue

    results.push({ question, answer })
  }

  return results
}
