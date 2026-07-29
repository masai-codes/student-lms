import { normalizeNullableText } from '@/server/learn/utils/normalizeNullableText'

export type AiSummaryStatus = 'generated' | 'processing' | 'not_available'

type LecturesAiSummaryRow = {
  summary: string | null
  isSummaryPublished: number | null
}

export function resolveAiSummaryStatus(row: LecturesAiSummaryRow | null): AiSummaryStatus {
  if (row == null) return 'not_available'

  const summary = normalizeNullableText(row.summary)
  if (summary == null) return 'processing'

  if (row.isSummaryPublished === 0) return 'processing'

  return 'generated'
}
