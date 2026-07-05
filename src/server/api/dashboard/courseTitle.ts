/**
 * The learner-facing course title for a batch: `batch.meta.courseTitle` when
 * set, otherwise the batch `name`. `meta` may arrive as a JSON string (raw SQL)
 * or an already-parsed object (Drizzle `json` column). Returns `''` when
 * neither is available — callers fall back to the batch id.
 */
export function resolveCourseTitle(meta: unknown, name: string | null | undefined): string {
  const parsed =
    typeof meta === 'string'
      ? safeParse(meta)
      : meta && typeof meta === 'object'
        ? (meta as Record<string, unknown>)
        : null

  const title = parsed?.['courseTitle']
  if (typeof title === 'string' && title.trim() !== '') return title.trim()
  return name?.trim() ?? ''
}

function safeParse(raw: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(raw)
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}
