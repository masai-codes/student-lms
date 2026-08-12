import { count, eq } from 'drizzle-orm'

import { db } from '@/db'
import { zefLmsPollsSubmissions } from '@/db/schema'

export type InLecturePollResults = {
  /** Response count per option index, sized to the poll's option list. */
  optionCounts: Array<number>
  totalResponses: number
}

/**
 * Aggregate submission counts per option for a poll (scoped to that poll's
 * lecture, since `zef_lms_polls_questions` hangs off a single
 * `zef_lms_meta_data` → lecture). `optionCount` sizes the returned array so
 * zero-response options still appear as `0`, and guards against a stray
 * out-of-range `selectedOptionIndex` (e.g. the poll's options were edited
 * after some submissions were recorded).
 */
export async function computeInLecturePollResults(
  pollId: number,
  optionCount: number,
): Promise<InLecturePollResults> {
  const rows = await db
    .select({
      selectedOptionIndex: zefLmsPollsSubmissions.selectedOptionIndex,
      responseCount: count(),
    })
    .from(zefLmsPollsSubmissions)
    .where(eq(zefLmsPollsSubmissions.zefLmsPollsQuestionsId, pollId))
    .groupBy(zefLmsPollsSubmissions.selectedOptionIndex)

  const optionCounts = new Array<number>(optionCount).fill(0)
  let totalResponses = 0
  for (const row of rows) {
    totalResponses += row.responseCount
    if (row.selectedOptionIndex >= 0 && row.selectedOptionIndex < optionCount) {
      optionCounts[row.selectedOptionIndex] = row.responseCount
    }
  }
  return { optionCounts, totalResponses }
}
